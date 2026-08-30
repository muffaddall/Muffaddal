import "server-only";
import { getTransactionsForAccount } from "@/lib/transactions";
import { getAllMonthSummaries, getExpensesForMonth, getIncomeForMonth, totalForMonth } from "@/lib/expenses";
import { accountNetByPeriod, buildPeriodChain } from "@/lib/periods";
import { currentMonth } from "@/lib/format";

/**
 * An account's true current balance: Planned Expenses leftover, carried
 * forward and combined with every logged transaction (income, expense,
 * and transfers counted from this account's own side), chained all the
 * way to today — not just a raw sum of logged transactions, which ignores
 * Planned Expenses entirely and gives a misleadingly large deficit for
 * accounts whose income/rent/bills are tracked as planned, not logged.
 */
export async function getReconciledAccountBalance(accountId: string): Promise<number> {
  const todayMonth = currentMonth();
  const todayMonthKey = todayMonth.slice(0, 7);

  const [transactions, monthSummaries, currentExpenses, currentIncome] = await Promise.all([
    getTransactionsForAccount(accountId),
    getAllMonthSummaries(accountId),
    getExpensesForMonth(todayMonth, accountId),
    getIncomeForMonth(todayMonth, accountId),
  ]);

  const plannedLeftoverByMonth = new Map(monthSummaries.map((s) => [s.month.slice(0, 7), s.leftover]));
  plannedLeftoverByMonth.set(todayMonthKey, currentIncome - totalForMonth(currentExpenses));

  const netByPeriod = accountNetByPeriod(transactions, accountId);
  const activityMonthKeys = [
    ...plannedLeftoverByMonth.keys(),
    ...Array.from(netByPeriod.keys()).map((k) => k.slice(0, 7)),
  ].sort();
  const minMonthKey = activityMonthKeys[0] ?? todayMonthKey;

  const chain = buildPeriodChain(plannedLeftoverByMonth, netByPeriod, minMonthKey, todayMonthKey);
  return chain[chain.length - 1]?.remaining ?? 0;
}
