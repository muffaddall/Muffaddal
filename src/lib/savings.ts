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

export async function getSavingsMonths(): Promise<SavingsMonthComputed[]> {
  const [debts, monthsRes] = await Promise.all([
    getDebts(),
    supabase.from("savings_months").select("*").order("month", { ascending: true }),
  ]);
  if (monthsRes.error) throw monthsRes.error;

  const rows = (monthsRes.data ?? []) as SavingsMonth[];
  const startingDebt = totalDebt(debts);

  let runningDebt = startingDebt;
  let runningSavings = 0;

  return rows.map((row) => {
    const debt_owed_start = runningDebt;
    const debt_left = debt_owed_start + row.debt_paydown;
    runningSavings += row.savings_kept;
    const total_savings = runningSavings;
    const account_total = row.money_kept + total_savings + debt_left + row.big_payment;

    runningDebt = debt_left;

    return {
      ...row,
      debt_owed_start,
      debt_left,
      total_savings,
      account_total,
    };
  });
}

export async function upsertSavingsMonth(input: {
  month: string;
  debt_paydown: number;
  big_payment: number;
  savings_kept: number;
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
