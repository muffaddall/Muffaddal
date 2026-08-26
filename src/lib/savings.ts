import "server-only";
import { supabase } from "@/lib/supabase";
import type { Debt, SavingsMonth, SavingsMonthComputed } from "@/lib/types";

export async function getDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function totalDebt(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.amount, 0);
}

export async function addDebt(input: { name: string; amount: number }): Promise<void> {
  const { error } = await supabase.from("debts").insert(input);
  if (error) throw error;
}

export async function updateDebt(
  id: string,
  input: { name: string; amount: number }
): Promise<void> {
  const { error } = await supabase.from("debts").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteDebt(id: string): Promise<void> {
  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) throw error;
}

// Debt paydown and savings kept aren't entered here — they're the sums of
// that month's "Debt paying back" / "Savings contribution" expense entries,
// so the Expenses tab is the single source of truth and the two tabs can't
// drift apart.
async function getAmountByMonthForCategory(category: string): Promise<Map<string, number>> {
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

export async function getSavingsMonths(): Promise<SavingsMonthComputed[]> {
  const [debts, monthsRes, debtPaydownByMonth, savingsKeptByMonth] = await Promise.all([
    getDebts(),
    supabase.from("savings_months").select("*").order("month", { ascending: true }),
    getAmountByMonthForCategory("debt"),
    getAmountByMonthForCategory("savings"),
  ]);
  if (monthsRes.error) throw monthsRes.error;

  const savingsByMonth = new Map(
    ((monthsRes.data ?? []) as SavingsMonth[]).map((row) => [row.month, row])
  );

  const allMonths = Array.from(
    new Set([
      ...savingsByMonth.keys(),
      ...debtPaydownByMonth.keys(),
      ...savingsKeptByMonth.keys(),
    ])
  ).sort();

  const startingDebt = totalDebt(debts);
  let runningDebt = startingDebt;
  let runningSavings = 0;

  return allMonths.map((month) => {
    const saved = savingsByMonth.get(month);
    const debt_paydown = debtPaydownByMonth.get(month) ?? 0;
    const savings_kept = savingsKeptByMonth.get(month) ?? 0;
    const big_payment = saved?.big_payment ?? 0;
    const money_kept = saved?.money_kept ?? 50000;

    const debt_owed_start = runningDebt;
    const debt_left = debt_owed_start + debt_paydown;
    runningSavings += savings_kept;
    const total_savings = runningSavings;
    const account_total = money_kept + total_savings + debt_left + big_payment;

    runningDebt = debt_left;

    return {
      month,
      debt_paydown,
      big_payment,
      savings_kept,
      money_kept,
      debt_owed_start,
      debt_left,
      total_savings,
      account_total,
    };
  });
}

export async function upsertSavingsMonth(input: {
  month: string;
  big_payment: number;
  money_kept: number;
}): Promise<void> {
  const { error } = await supabase
    .from("savings_months")
    .upsert(input, { onConflict: "month" });
  if (error) throw error;
}

export async function deleteSavingsMonth(month: string): Promise<void> {
  const { error } = await supabase.from("savings_months").delete().eq("month", month);
  if (error) throw error;
}
