import "server-only";
import { supabase } from "@/lib/supabase";
import { getExpenseAmountByMonthForCategory } from "@/lib/expenses";
import { ensureIncomeCategory } from "@/lib/ddCategories";
import type { InvestmentMonth, InvestmentMonthComputed, InvestmentWithdrawal } from "@/lib/types";

const INVESTMENT_WITHDRAWAL_CATEGORY = "Investment withdrawal";

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
  const [monthsRes, aedFundedByMonth, rate, withdrawals] = await Promise.all([
    supabase.from("investment_months").select("*").order("month", { ascending: true }),
    getExpenseAmountByMonthForCategory("investment"),
    getAedPerUsdRate(),
    getInvestmentWithdrawals(),
  ]);
  if (monthsRes.error) throw monthsRes.error;

  const rowsByMonth = new Map(
    ((monthsRes.data ?? []) as InvestmentMonth[]).map((row) => [row.month, row])
  );

  const withdrawnByMonth = new Map<string, number>();
  for (const w of withdrawals) {
    const month = `${w.date.slice(0, 7)}-01`;
    withdrawnByMonth.set(month, (withdrawnByMonth.get(month) ?? 0) + w.amountUsd);
  }

  const allMonths = Array.from(
    new Set([...rowsByMonth.keys(), ...aedFundedByMonth.keys(), ...withdrawnByMonth.keys()])
  ).sort();

  let totalInvested = 0;
  let prevPortfolioValue: number | null = null;

  return allMonths.map((month) => {
    const stored = rowsByMonth.get(month);
    const aedFunded = aedFundedByMonth.get(month);
    const contribution = aedFunded !== undefined ? aedFunded / rate : (stored?.contribution ?? 0);
    const withdrawn = withdrawnByMonth.get(month) ?? 0;
    const portfolio_value_eom = stored?.portfolio_value_eom ?? null;

    totalInvested += contribution - withdrawn;

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
      withdrawn,
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

// ---- Withdrawals ----

type WithdrawalRow = {
  id: string;
  date: string;
  amount_usd: number;
  exchange_rate: number;
  account_id: string;
  transaction_id: string | null;
  note: string;
};

function withdrawalFromRow(row: WithdrawalRow): InvestmentWithdrawal {
  return {
    id: row.id,
    date: row.date,
    amountUsd: row.amount_usd,
    exchangeRate: row.exchange_rate,
    accountId: row.account_id,
    transactionId: row.transaction_id ?? null,
    note: row.note,
  };
}

export async function getInvestmentWithdrawals(): Promise<InvestmentWithdrawal[]> {
  const { data, error } = await supabase
    .from("investment_withdrawals")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => withdrawalFromRow(r as WithdrawalRow));
}

/**
 * Withdraws USD from the portfolio and logs the converted amount as an
 * income transaction on the chosen Day-to-Day account, using the exchange
 * rate given for this withdrawal specifically (not the saved AED/USD rate,
 * since that's for regular contributions and may not match what the
 * broker/bank actually applied that day).
 */
export async function addInvestmentWithdrawal(input: {
  date: string;
  amountUsd: number;
  exchangeRate: number;
  accountId: string;
  note: string;
}): Promise<void> {
  const localAmount = input.amountUsd * input.exchangeRate;
  const category = await ensureIncomeCategory(INVESTMENT_WITHDRAWAL_CATEGORY);

  const { data, error } = await supabase
    .from("dd_transactions")
    .insert({
      type: "income",
      date: input.date,
      amount: localAmount,
      account_id: input.accountId,
      to_account_id: null,
      to_amount: null,
      category_id: category.id,
      note: input.note || `Investment withdrawal ($${input.amountUsd} @ ${input.exchangeRate})`,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const transactionId = (data as { id: string }).id;

  const { error: withdrawalError } = await supabase.from("investment_withdrawals").insert({
    date: input.date,
    amount_usd: input.amountUsd,
    exchange_rate: input.exchangeRate,
    account_id: input.accountId,
    transaction_id: transactionId,
    note: input.note,
  });
  if (withdrawalError) throw new Error(withdrawalError.message);
}

/** Deletes a withdrawal and the income transaction it created, so the two never drift apart. */
export async function deleteInvestmentWithdrawal(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("investment_withdrawals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return;
  const row = data as WithdrawalRow;

  if (row.transaction_id) {
    const { error: txError } = await supabase.from("dd_transactions").delete().eq("id", row.transaction_id);
    if (txError) throw new Error(txError.message);
  }

  const { error: deleteError } = await supabase.from("investment_withdrawals").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);
}
