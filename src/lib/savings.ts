import "server-only";
import { supabase } from "@/lib/supabase";
import { getExpenseAmountByMonthForCategory } from "@/lib/expenses";
import type { BpfPurchase, SavingsMonth, SavingsMonthComputed } from "@/lib/types";

// Purchases made using money from the Big Purchase Fund. Their total is
// subtracted from the fund's running balance — logged here on the Savings
// tab, not as expense entries.
export async function getBpfPurchases(): Promise<BpfPurchase[]> {
  const { data, error } = await supabase
    .from("bpf_purchases")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function totalBpfPurchases(purchases: BpfPurchase[]): number {
  return purchases.reduce((sum, p) => sum + p.amount, 0);
}

export async function addBpfPurchase(input: { name: string; amount: number }): Promise<void> {
  const { error } = await supabase.from("bpf_purchases").insert(input);
  if (error) throw error;
}

export async function updateBpfPurchase(
  id: string,
  input: { name: string; amount: number }
): Promise<void> {
  const { error } = await supabase.from("bpf_purchases").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteBpfPurchase(id: string): Promise<void> {
  const { error } = await supabase.from("bpf_purchases").delete().eq("id", id);
  if (error) throw error;
}

// Debt paydown and savings kept aren't entered here — debt paydown is the
// sum of that month's "Big Purchase Fund" expense entries minus standing
// BPF purchases (below); savings kept is the sum of "Savings contribution"
// expense entries. The Expenses tab is the single source of truth for both.
export async function getSavingsMonths(): Promise<SavingsMonthComputed[]> {
  const [purchases, monthsRes, debtPaydownByMonth, savingsKeptByMonth] = await Promise.all([
    getBpfPurchases(),
    supabase.from("savings_months").select("*").order("month", { ascending: true }),
    getExpenseAmountByMonthForCategory("debt"),
    getExpenseAmountByMonthForCategory("savings"),
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

  // BPF purchases aren't tied to a month — they permanently reduce the
  // fund's balance from now on.
  const startingDebt = -totalBpfPurchases(purchases);
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
