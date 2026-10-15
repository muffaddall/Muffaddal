import "server-only";
import { supabase } from "@/lib/supabase";
import type {
  Trip,
  TripExpenseCategory,
  TripTransaction,
  TripTransactionType,
  TripWallet,
} from "@/lib/types";

type TripRow = { id: string; name: string; created_at: string };

function fromTripRow(row: TripRow): Trip {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromTripRow);
}

export async function getTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromTripRow(data) : null;
}

/** Creates a trip plus one wallet per starting currency, returning the new trip's id. */
export async function addTrip(input: { name: string; currencies: string[] }): Promise<string> {
  const { data, error } = await supabase.from("trips").insert({ name: input.name }).select("id").single();
  if (error) throw new Error(error.message);
  const tripId = (data as { id: string }).id;

  if (input.currencies.length > 0) {
    const { error: walletError } = await supabase
      .from("trip_wallets")
      .insert(input.currencies.map((currency, i) => ({ trip_id: tripId, currency, sort_order: i })));
    if (walletError) throw new Error(walletError.message);
  }

  return tripId;
}

/** Deletes a trip, first cleaning up any Day-to-Day transactions its income entries were linked to (cascade alone would leave those orphaned). */
export async function deleteTrip(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("trip_transactions")
    .select("linked_transaction_id")
    .eq("trip_id", id)
    .not("linked_transaction_id", "is", null);
  if (error) throw new Error(error.message);

  const linkedIds = (data ?? []).map((r) => r.linked_transaction_id as string);
  if (linkedIds.length > 0) {
    const { error: txError } = await supabase.from("dd_transactions").delete().in("id", linkedIds);
    if (txError) throw new Error(txError.message);
  }

  const { error: deleteError } = await supabase.from("trips").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);
}

type TripWalletRow = {
  id: string;
  trip_id: string;
  currency: string;
  sort_order: number;
  created_at: string;
};

function fromWalletRow(row: TripWalletRow): TripWallet {
  return {
    id: row.id,
    tripId: row.trip_id,
    currency: row.currency,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function getTripWallets(tripId: string): Promise<TripWallet[]> {
  const { data, error } = await supabase
    .from("trip_wallets")
    .select("*")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromWalletRow);
}

/** Every trip's wallets in one query — used by the Travel home page to show each trip's currency chips without a query per trip. */
export async function getAllTripWallets(): Promise<TripWallet[]> {
  const { data, error } = await supabase
    .from("trip_wallets")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromWalletRow);
}

export async function addTripWallet(tripId: string, currency: string): Promise<void> {
  const { count, error: countError } = await supabase
    .from("trip_wallets")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId);
  if (countError) throw new Error(countError.message);

  const { error } = await supabase
    .from("trip_wallets")
    .insert({ trip_id: tripId, currency, sort_order: count ?? 0 });
  if (error) throw new Error(error.message);
}

type TripTransactionRow = {
  id: string;
  trip_id: string;
  type: TripTransactionType;
  date: string;
  amount: number;
  wallet_id: string;
  to_wallet_id: string | null;
  to_amount: number | null;
  category: TripExpenseCategory | null;
  note: string;
  linked_account_id: string | null;
  linked_transaction_id: string | null;
  created_at: string;
};

function fromTxRow(row: TripTransactionRow): TripTransaction {
  return {
    id: row.id,
    tripId: row.trip_id,
    type: row.type,
    date: row.date,
    amount: row.amount,
    walletId: row.wallet_id,
    toWalletId: row.to_wallet_id,
    toAmount: row.to_amount,
    category: row.category,
    note: row.note,
    linkedAccountId: row.linked_account_id,
    linkedTransactionId: row.linked_transaction_id,
    createdAt: row.created_at,
  };
}

export async function getTripTransactions(tripId: string): Promise<TripTransaction[]> {
  const { data, error } = await supabase
    .from("trip_transactions")
    .select("*")
    .eq("trip_id", tripId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromTxRow);
}

/**
 * Adds a trip transaction. When it's an income entry with a
 * linkedAccountId + linkedAmount (the real-world amount in that account's
 * own currency), also logs a matching expense on that Day-to-Day account
 * — e.g. "$750 starting cash" withdrawn from the UAE account shows up
 * there as an AED expense too — same linked-row pattern as investment
 * withdrawals (see addInvestmentWithdrawal in lib/investments.ts).
 */
export async function addTripTransaction(
  tripId: string,
  input: {
    type: TripTransactionType;
    date: string;
    amount: number;
    walletId: string;
    toWalletId: string | null;
    toAmount: number | null;
    category: TripExpenseCategory | null;
    note: string;
    linkedAccountId: string | null;
    linkedAmount: number | null;
  }
): Promise<void> {
  let linkedTransactionId: string | null = null;

  if (input.type === "income" && input.linkedAccountId && input.linkedAmount) {
    const { data, error } = await supabase
      .from("dd_transactions")
      .insert({
        type: "expense",
        date: input.date,
        amount: input.linkedAmount,
        account_id: input.linkedAccountId,
        to_account_id: null,
        to_amount: null,
        category_id: null,
        note: input.note || "Trip cash",
        cleared: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    linkedTransactionId = (data as { id: string }).id;
  }

  const { error } = await supabase.from("trip_transactions").insert({
    trip_id: tripId,
    type: input.type,
    date: input.date,
    amount: input.amount,
    wallet_id: input.walletId,
    to_wallet_id: input.toWalletId,
    to_amount: input.toAmount,
    category: input.category,
    note: input.note,
    linked_account_id: input.linkedAccountId,
    linked_transaction_id: linkedTransactionId,
  });
  if (error) throw new Error(error.message);
}

/** Edits a trip transaction's own fields only — the wallet(s) and any linked Day-to-Day account are fixed at creation time, not editable afterward. */
export async function updateTripTransaction(
  id: string,
  input: {
    date: string;
    amount: number;
    toAmount: number | null;
    category: TripExpenseCategory | null;
    note: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from("trip_transactions")
    .update({
      date: input.date,
      amount: input.amount,
      to_amount: input.toAmount,
      category: input.category,
      note: input.note,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Deletes a trip transaction and, if it was an income entry linked to a Day-to-Day account, the matching expense it created there too. */
export async function deleteTripTransaction(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("trip_transactions")
    .select("linked_transaction_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (data?.linked_transaction_id) {
    const { error: txError } = await supabase
      .from("dd_transactions")
      .delete()
      .eq("id", data.linked_transaction_id);
    if (txError) throw new Error(txError.message);
  }

  const { error: deleteError } = await supabase.from("trip_transactions").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);
}
