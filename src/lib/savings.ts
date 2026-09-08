import "server-only";
import { supabase } from "@/lib/supabase";
import { getExpenseAmountByMonthForCategory } from "@/lib/expenses";
import type {
  BpfPurchase,
  MoneyInflux,
  MoneyInfluxDestination,
  SavingsMonth,
  SavingsMonthComputed,
  SavingsPurchase,
} from "@/lib/types";

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

// Purchases made using money from Savings. Their total is subtracted from
// the running Savings balance — logged here on the Savings tab, not as
// expense entries. Mirrors bpf_purchases above exactly.
export async function getSavingsPurchases(): Promise<SavingsPurchase[]> {
  const { data, error } = await supabase
    .from("savings_purchases")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function totalSavingsPurchases(purchases: SavingsPurchase[]): number {
  return purchases.reduce((sum, p) => sum + p.amount, 0);
}

export async function addSavingsPurchase(input: { name: string; amount: number }): Promise<void> {
  const { error } = await supabase.from("savings_purchases").insert(input);
  if (error) throw error;
}

export async function updateSavingsPurchase(
  id: string,
  input: { name: string; amount: number }
): Promise<void> {
  const { error } = await supabase.from("savings_purchases").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteSavingsPurchase(id: string): Promise<void> {
  const { error } = await supabase.from("savings_purchases").delete().eq("id", id);
  if (error) throw error;
}

// Impromptu / one-off money from anywhere, added straight to Savings or
// the Big Purchase Fund whenever you want — not tied to a month, unlike
// the recurring Planned Expenses categories that normally feed these
// totals.
export async function getMoneyInfluxes(): Promise<MoneyInflux[]> {
  const { data, error } = await supabase
    .from("money_influxes")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function totalMoneyInfluxes(
  influxes: MoneyInflux[],
  destination: MoneyInfluxDestination
): number {
  return influxes
    .filter((i) => i.destination === destination)
    .reduce((sum, i) => sum + i.amount, 0);
}

export async function addMoneyInflux(input: {
  name: string;
  amount: number;
  destination: MoneyInfluxDestination;
}): Promise<void> {
  const { error } = await supabase.from("money_influxes").insert(input);
  if (error) throw error;
}

export async function updateMoneyInflux(
  id: string,
  input: { name: string; amount: number; destination: MoneyInfluxDestination }
): Promise<void> {
  const { error } = await supabase.from("money_influxes").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteMoneyInflux(id: string): Promise<void> {
  const { error } = await supabase.from("money_influxes").delete().eq("id", id);
  if (error) throw error;
}

// Debt paydown and savings kept aren't entered here — debt paydown is the
// sum of that month's "Big Purchase Fund" expense entries minus standing
// BPF purchases (below); savings kept is the sum of "Savings contribution"
// expense entries. The Expenses tab is the single source of truth for both.
export async function getSavingsMonths(): Promise<SavingsMonthComputed[]> {
  const [purchases, savingsPurchases, influxes, monthsRes, debtPaydownByMonth, savingsKeptByMonth] = await Promise.all([
    getBpfPurchases(),
    getSavingsPurchases(),
    getMoneyInfluxes(),
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

  // BPF/Savings purchases and impromptu money influxes aren't tied to a
  // month — they permanently move the fund/savings balances from now on.
  const startingDebt = totalMoneyInfluxes(influxes, "bpf") - totalBpfPurchases(purchases);
  let runningDebt = startingDebt;
  let runningSavings = totalMoneyInfluxes(influxes, "savings") - totalSavingsPurchases(savingsPurchases);

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
