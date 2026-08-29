import "server-only";
import { supabase } from "@/lib/supabase";
import type { Transaction, TransactionInput, TransactionType } from "@/lib/types";

type TransactionRow = {
  id: string;
  type: TransactionType;
  date: string;
  amount: number;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  note: string;
  created_at: string;
};

function fromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    date: row.date,
    amount: row.amount,
    accountId: row.account_id,
    toAccountId: row.to_account_id,
    categoryId: row.category_id,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("dd_transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getTransactionsForRange(
  start: string,
  end: string
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("dd_transactions")
    .select("*")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getTransactionsForAccount(accountId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("dd_transactions")
    .select("*")
    .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function addTransaction(input: TransactionInput): Promise<void> {
  const { error } = await supabase.from("dd_transactions").insert({
    type: input.type,
    date: input.date,
    amount: input.amount,
    account_id: input.accountId,
    to_account_id: input.toAccountId,
    category_id: input.categoryId,
    note: input.note,
  });
  if (error) throw new Error(error.message);
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from("dd_transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Net day-to-day money movement per month ("YYYY-MM" keys): income minus
// expense transactions. Transfers are excluded since they don't change how
// much money is available overall. Used to carry day-to-day surplus/deficit
// forward into later months' budgets.
export async function getDayToDayNetByMonth(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("dd_transactions")
    .select("date, amount, type")
    .in("type", ["income", "expense"]);
  if (error) throw new Error(error.message);

  const byMonth = new Map<string, number>();
  for (const row of (data ?? []) as { date: string; amount: number; type: TransactionType }[]) {
    const key = row.date.slice(0, 7);
    const delta = row.type === "income" ? row.amount : -row.amount;
    byMonth.set(key, (byMonth.get(key) ?? 0) + delta);
  }
  return byMonth;
}
