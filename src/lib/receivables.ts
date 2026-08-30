import "server-only";
import { supabase } from "@/lib/supabase";
import type { Receivable, ReceivableStatus } from "@/lib/types";

type ReceivableRow = {
  id: string;
  transaction_id: string;
  person_id: string | null;
  amount: number;
  status: ReceivableStatus;
  paid_transaction_id: string | null;
  created_at: string;
};

function fromRow(row: ReceivableRow): Receivable {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    personId: row.person_id,
    amount: row.amount,
    status: row.status,
    paidTransactionId: row.paid_transaction_id,
    createdAt: row.created_at,
  };
}

export async function getReceivablesForTransaction(transactionId: string): Promise<Receivable[]> {
  const { data, error } = await supabase
    .from("dd_receivables")
    .select("*")
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/** Every outstanding (not yet paid back) receivable tied to any of these transaction ids. */
export async function getOutstandingReceivablesForTransactions(
  transactionIds: string[]
): Promise<Receivable[]> {
  if (transactionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("dd_receivables")
    .select("*")
    .in("transaction_id", transactionIds)
    .eq("status", "outstanding");
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/** Every receivable (any status) tied to any of these transaction ids. */
export async function getReceivablesForTransactions(
  transactionIds: string[]
): Promise<Receivable[]> {
  if (transactionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("dd_receivables")
    .select("*")
    .in("transaction_id", transactionIds);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getAllReceivables(): Promise<Receivable[]> {
  const { data, error } = await supabase
    .from("dd_receivables")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function addReceivable(input: {
  transactionId: string;
  personId: string | null;
  amount: number;
}): Promise<void> {
  const { error } = await supabase.from("dd_receivables").insert({
    transaction_id: input.transactionId,
    person_id: input.personId,
    amount: input.amount,
    status: "outstanding",
  });
  if (error) throw new Error(error.message);
}

export async function deleteReceivable(id: string): Promise<void> {
  const { error } = await supabase.from("dd_receivables").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Marks a receivable paid back: logs a real income transaction for the
 * amount (into the same account the original expense came from) so the
 * account balance reflects the repayment, then flips the receivable's
 * status and links it to that new transaction.
 */
export async function markReceivablePaidBack(
  receivableId: string,
  accountId: string,
  amount: number,
  note: string
): Promise<void> {
  const { data: inserted, error: insertError } = await supabase
    .from("dd_transactions")
    .insert({
      type: "income",
      date: new Date().toISOString().slice(0, 10),
      amount,
      account_id: accountId,
      to_account_id: null,
      category_id: null,
      note,
    })
    .select("id")
    .single();
  if (insertError) throw new Error(insertError.message);

  const paidTransactionId = (inserted as { id: string }).id;
  const { error: updateError } = await supabase
    .from("dd_receivables")
    .update({ status: "paid_back", paid_transaction_id: paidTransactionId })
    .eq("id", receivableId);
  if (updateError) throw new Error(updateError.message);
}
