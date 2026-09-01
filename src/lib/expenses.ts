import "server-only";
import { supabase } from "@/lib/supabase";
import type { ExpenseCategory, ExpenseEntry, MonthlyIncome } from "@/lib/types";

export async function getExpenseMonths(accountId: string): Promise<string[]> {
  const [entries, incomes] = await Promise.all([
    supabase.from("expense_entries").select("month").eq("account_id", accountId),
    supabase.from("monthly_income").select("month").eq("account_id", accountId),
  ]);
  if (entries.error) throw entries.error;
  if (incomes.error) throw incomes.error;

  const months = new Set<string>();
  for (const row of entries.data ?? []) months.add(row.month as string);
  for (const row of incomes.data ?? []) months.add(row.month as string);
  return Array.from(months).sort();
}

export async function getExpensesForMonth(month: string, accountId: string): Promise<ExpenseEntry[]> {
  const { data, error } = await supabase
    .from("expense_entries")
    .select("*")
    .eq("month", month)
    .eq("account_id", accountId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getIncomeForMonth(month: string, accountId: string): Promise<number> {
  const { data, error } = await supabase
    .from("monthly_income")
    .select("income")
    .eq("month", month)
    .eq("account_id", accountId)
    .maybeSingle();
  if (error) throw error;
  return data?.income ?? 15000;
}

export async function setIncomeForMonth(month: string, accountId: string, income: number): Promise<void> {
  const { error } = await supabase
    .from("monthly_income")
    .upsert({ month, account_id: accountId, income }, { onConflict: "month,account_id" });
  if (error) throw error;
}

export async function addExpenseEntry(input: {
  month: string;
  date_label: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  accountId: string;
}): Promise<void> {
  const { error } = await supabase.from("expense_entries").insert({
    month: input.month,
    date_label: input.date_label,
    name: input.name,
    amount: input.amount,
    category: input.category,
    account_id: input.accountId,
    paid: false,
  });
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

export async function setExpenseEntryPaid(id: string, paid: boolean): Promise<void> {
  const { error } = await supabase.from("expense_entries").update({ paid }).eq("id", id);
  if (error) throw error;
}

export async function deleteExpenseEntry(id: string): Promise<void> {
  const { error } = await supabase.from("expense_entries").delete().eq("id", id);
  if (error) throw error;
}

// Copies every entry from one month into another as new rows (new ids),
// so editing a copy never touches the original month's entry. Scoped to
// one account — each account keeps its own Planned Expenses list.
export async function copyExpensesToMonth(
  fromMonth: string,
  toMonth: string,
  accountId: string
): Promise<number> {
  const source = await getExpensesForMonth(fromMonth, accountId);
  if (source.length === 0) return 0;

  const copies = source.map((entry) => ({
    month: toMonth,
    date_label: entry.date_label,
    name: entry.name,
    amount: entry.amount,
    category: entry.category,
    sort_order: entry.sort_order,
    account_id: accountId,
    paid: false,
  }));

  const { error } = await supabase.from("expense_entries").insert(copies);
  if (error) throw error;
  return copies.length;
}

export function totalForMonth(entries: ExpenseEntry[]): number {
  return entries.reduce((sum, e) => sum + e.amount, 0);
}

// Sum of only the entries actually marked paid — what's really left your
// account so far, as opposed to totalForMonth's optimistic "everything
// gets paid" projection.
export function totalPaidForMonth(entries: ExpenseEntry[]): number {
  return entries.reduce((sum, e) => (e.paid ? sum + e.amount : sum), 0);
}

// Sums a single category's expense amounts per month, across every
// account — used by the Savings and Investments tabs, which track
// household-wide funding/debt/savings regardless of which account the
// money moved from.
export async function getExpenseAmountByMonthForCategory(
  category: ExpenseCategory
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("expense_entries")
    .select("month, amount")
    .eq("category", category);
  if (error) throw error;

  const byMonth = new Map<string, number>();
  for (const row of (data ?? []) as { month: string; amount: number }[]) {
    byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + row.amount);
  }
  return byMonth;
}

export type MonthSummary = {
  month: string;
  income: number;
  total: number;
  leftover: number;
  paidTotal: number;
  paidLeftover: number;
};

export async function getAllMonthSummaries(accountId: string): Promise<MonthSummary[]> {
  const months = await getExpenseMonths(accountId);
  const summaries: MonthSummary[] = [];
  for (const month of months) {
    const [entries, income] = await Promise.all([
      getExpensesForMonth(month, accountId),
      getIncomeForMonth(month, accountId),
    ]);
    const total = totalForMonth(entries);
    const paidTotal = totalPaidForMonth(entries);
    summaries.push({
      month,
      income,
      total,
      leftover: income - total,
      paidTotal,
      paidLeftover: income - paidTotal,
    });
  }
  return summaries;
}

export type YearMonth = {
  month: string;
  entries: ExpenseEntry[];
  income: number;
  total: number;
  leftover: number;
};

// All 12 months of a calendar year, for the yearly grid view — regardless
// of whether a given month has any data yet. Scoped to one account.
export async function getExpensesForYear(year: number, accountId: string): Promise<YearMonth[]> {
  const months = Array.from(
    { length: 12 },
    (_, i) => `${year}-${String(i + 1).padStart(2, "0")}-01`
  );

  return Promise.all(
    months.map(async (month) => {
      const [entries, income] = await Promise.all([
        getExpensesForMonth(month, accountId),
        getIncomeForMonth(month, accountId),
      ]);
      const total = totalForMonth(entries);
      return { month, entries, income, total, leftover: income - total };
    })
  );
}

export { CATEGORY_LABELS, EXPENSE_CATEGORIES } from "@/lib/types";
export type { MonthlyIncome };
