import "server-only";
import { getTransactionsForAccount } from "@/lib/transactions";
import { getAllMonthSummaries, getExpensesForMonth, getIncomeForMonth, totalForMonth } from "@/lib/expenses";
import { accountNetByPeriod, buildPeriodChain } from "@/lib/periods";
import { getOutstandingReceivablesForTransactions } from "@/lib/receivables";
import { currentMonth } from "@/lib/format";

export type AccountBalances = {
  /** Planned Expenses leftover + carry-over + logged transactions, chained to today. */
  bank: number;
  /** Bank balance plus whatever's still owed to you from expenses paid on this account. */
  personal: number;
  /** Total currently outstanding across all "People Owe Me" splits on this account. */
  outstandingOwed: number;
};

/**
 * An account's balances: the "bank" figure is Planned Expenses leftover,
 * carried forward and combined with every logged transaction (income,
 * expense, and transfers counted from this account's own side), chained
 * all the way to today — not just a raw sum of logged transactions, which
 * ignores Planned Expenses entirely and gives a misleadingly large
 * deficit for accounts whose income/rent/bills are tracked as planned,
 * not logged. The "personal" figure adds back whatever people still owe
 * you from expenses paid out of this account — money that's really still
 * yours even though it already left the account.
 */
export async function getAccountBalances(accountId: string): Promise<AccountBalances> {
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
  const bank = chain[chain.length - 1]?.remaining ?? 0;

  const expenseTransactionIds = transactions.filter((tx) => tx.type === "expense").map((tx) => tx.id);
  const outstanding = await getOutstandingReceivablesForTransactions(expenseTransactionIds);
  const outstandingOwed = outstanding.reduce((sum, r) => sum + r.amount, 0);

  return { bank, personal: bank + outstandingOwed, outstandingOwed };
}

/** Backwards-compatible single-number accessor — the plain bank balance. */
export async function getReconciledAccountBalance(accountId: string): Promise<number> {
  return (await getAccountBalances(accountId)).bank;
}
