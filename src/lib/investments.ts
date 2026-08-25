import "server-only";
import { supabase } from "@/lib/supabase";
import type { InvestmentMonth, InvestmentMonthComputed } from "@/lib/types";

export async function getInvestmentMonths(): Promise<InvestmentMonthComputed[]> {
  const { data, error } = await supabase
    .from("investment_months")
    .select("*")
    .order("month", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as InvestmentMonth[];
  let totalInvested = 0;
  let prevPortfolioValue: number | null = null;

  return rows.map((row) => {
    totalInvested += row.contribution;
    const portfolioValue = row.portfolio_value_eom;

    const growth_pct =
      portfolioValue !== null && prevPortfolioValue !== null && prevPortfolioValue !== 0
        ? (portfolioValue - prevPortfolioValue) / prevPortfolioValue
        : null;

    const pnl_pct =
      portfolioValue !== null && totalInvested !== 0
        ? (portfolioValue - totalInvested) / totalInvested
        : null;

    const dollar_pl = portfolioValue !== null ? portfolioValue - totalInvested : null;

    if (portfolioValue !== null) prevPortfolioValue = portfolioValue;

    return {
      ...row,
      total_invested: totalInvested,
      growth_pct,
      pnl_pct,
      dollar_pl,
    };
  });
}

export async function upsertInvestmentMonth(input: {
  month: string;
  contribution: number;
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
