import "server-only";
import { supabase } from "@/lib/supabase";
import { getExpenseAmountByMonthForCategory } from "@/lib/expenses";
import type { InvestmentMonth, InvestmentMonthComputed } from "@/lib/types";

const DEFAULT_AED_PER_USD = 3.6725;

export async function getAedPerUsdRate(): Promise<number> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "aed_per_usd")
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? DEFAULT_AED_PER_USD;
}

export async function setAedPerUsdRate(rate: number): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "aed_per_usd", value: rate }, { onConflict: "key" });
  if (error) throw error;
}

// Contribution isn't entered here — it's that month's "Investment funding"
// expense entries (in AED), converted to USD with the rate above. Months
// from before this automation existed keep whatever was manually saved.
export async function getInvestmentMonths(): Promise<InvestmentMonthComputed[]> {
  const [monthsRes, aedFundedByMonth, rate] = await Promise.all([
    supabase.from("investment_months").select("*").order("month", { ascending: true }),
    getExpenseAmountByMonthForCategory("investment"),
    getAedPerUsdRate(),
  ]);
  if (monthsRes.error) throw monthsRes.error;

  const rowsByMonth = new Map(
    ((monthsRes.data ?? []) as InvestmentMonth[]).map((row) => [row.month, row])
  );

  const allMonths = Array.from(
    new Set([...rowsByMonth.keys(), ...aedFundedByMonth.keys()])
  ).sort();

  let totalInvested = 0;
  let prevPortfolioValue: number | null = null;

  return allMonths.map((month) => {
    const stored = rowsByMonth.get(month);
    const aedFunded = aedFundedByMonth.get(month);
    const contribution = aedFunded !== undefined ? aedFunded / rate : (stored?.contribution ?? 0);
    const portfolio_value_eom = stored?.portfolio_value_eom ?? null;

    totalInvested += contribution;

    const growth_pct =
      portfolio_value_eom !== null && prevPortfolioValue !== null && prevPortfolioValue !== 0
        ? (portfolio_value_eom - prevPortfolioValue) / prevPortfolioValue
        : null;

    const pnl_pct =
      portfolio_value_eom !== null && totalInvested !== 0
        ? (portfolio_value_eom - totalInvested) / totalInvested
        : null;

    const dollar_pl = portfolio_value_eom !== null ? portfolio_value_eom - totalInvested : null;

    if (portfolio_value_eom !== null) prevPortfolioValue = portfolio_value_eom;

    return {
      month,
      contribution,
      portfolio_value_eom,
      total_invested: totalInvested,
      growth_pct,
      pnl_pct,
      dollar_pl,
    };
  });
}

export async function upsertInvestmentMonth(input: {
  month: string;
  portfolio_value_eom: number | null;
}): Promise<void> {
  const { error } = await supabase
    .from("investment_months")
    .upsert(input, { onConflict: "month" });
  if (error) throw error;
}

export async function deleteInvestmentMonth(month: string): Promise<void> {
  const { error } = await supabase.from("investment_months").delete().eq("month", month);
  if (error) throw error;
}
