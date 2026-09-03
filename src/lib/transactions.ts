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
  to_amount: number | null;
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
    toAmount: row.to_amount,
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

export async function getTransactionsByIds(ids: string[]): Promise<Transaction[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("dd_transactions").select("*").in("id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from("dd_transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

export async function addTransaction(input: TransactionInput): Promise<void> {
  const { error } = await supabase.from("dd_transactions").insert({
    type: input.type,
    date: input.date,
    amount: input.amount,
    account_id: input.accountId,
    to_account_id: input.toAccountId,
    to_amount: input.toAmount,
    category_id: input.categoryId,
    note: input.note,
  });
  if (error) throw new Error(error.message);
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<void> {
  const { error } = await supabase
    .from("dd_transactions")
    .update({
      type: input.type,
      date: input.date,
      amount: input.amount,
      account_id: input.accountId,
      to_account_id: input.toAccountId,
      to_amount: input.toAmount,
      category_id: input.categoryId,
      note: input.note,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from("dd_transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
