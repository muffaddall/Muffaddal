import "server-only";
import { supabase } from "@/lib/supabase";
import type { ExpenseCategory, ExpenseEntry, MonthlyIncome } from "@/lib/types";

export async function getExpenseMonths(): Promise<string[]> {
  const [entries, incomes] = await Promise.all([
    supabase.from("expense_entries").select("month"),
    supabase.from("monthly_income").select("month"),
  ]);
  if (entries.error) throw entries.error;
  if (incomes.error) throw incomes.error;

  const months = new Set<string>();
  for (const row of entries.data ?? []) months.add(row.month as string);
  for (const row of incomes.data ?? []) months.add(row.month as string);
  return Array.from(months).sort();
}

export async function getExpensesForMonth(month: string): Promise<ExpenseEntry[]> {
  const { data, error } = await supabase
    .from("expense_entries")
    .select("*")
    .eq("month", month)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getIncomeForMonth(month: string): Promise<number> {
  const { data, error } = await supabase
    .from("monthly_income")
    .select("income")
    .eq("month", month)
    .maybeSingle();
  if (error) throw error;
  return data?.income ?? 15000;
}

export async function setIncomeForMonth(month: string, income: number): Promise<void> {
  const { error } = await supabase
    .from("monthly_income")
    .upsert({ month, income }, { onConflict: "month" });
  if (error) throw error;
}

export async function addExpenseEntry(input: {
  month: string;
  date_label: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
}): Promise<void> {
  const { error } = await supabase.from("expense_entries").insert(input);
  if (error) throw error;
}

export async function updateExpenseEntry(
  id: string,
  input: {
    date_label: string;
    name: string;
    amount: number;
    category: ExpenseCategory;
  }
): Promise<void> {
  const { error } = await supabase.from("expense_entries").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteExpenseEntry(id: string): Promise<void> {
  const { error } = await supabase.from("expense_entries").delete().eq("id", id);
  if (error) throw error;
}

// Copies every entry from one month into another as new rows (new ids),
// so editing a copy never touches the original month's entry.
export async function copyExpensesToMonth(fromMonth: string, toMonth: string): Promise<number> {
  const source = await getExpensesForMonth(fromMonth);
  if (source.length === 0) return 0;

  const copies = source.map((entry) => ({
    month: toMonth,
    date_label: entry.date_label,
    name: entry.name,
    amount: entry.amount,
    category: entry.category,
    sort_order: entry.sort_order,
  }));

  const { error } = await supabase.from("expense_entries").insert(copies);
  if (error) throw error;
  return copies.length;
}

export function totalForMonth(entries: ExpenseEntry[]): number {
  return entries.reduce((sum, e) => sum + e.amount, 0);
}

export type MonthSummary = {
  month: string;
  income: number;
  total: number;
  leftover: number;
};

export async function getAllMonthSummaries(): Promise<MonthSummary[]> {
  const months = await getExpenseMonths();
  const summaries: MonthSummary[] = [];
  for (const month of months) {
    const [entries, income] = await Promise.all([
      getExpensesForMonth(month),
      getIncomeForMonth(month),
    ]);
    summaries.push({
      month,
      income,
      total: totalForMonth(entries),
      leftover: income - totalForMonth(entries),
    });
  }
  return summaries;
}

export { CATEGORY_LABELS, EXPENSE_CATEGORIES } from "@/lib/types";
export type { MonthlyIncome };
