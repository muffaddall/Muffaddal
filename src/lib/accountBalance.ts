import "server-only";
import { getTransactionsForAccount } from "@/lib/transactions";
import {
  getAllMonthSummaries,
  getExpensesForMonth,
  getIncomeForMonth,
  totalForMonth,
  totalPaidForMonth,
  type MonthSummary,
} from "@/lib/expenses";
import { accountNetByPeriod, buildPeriodChain } from "@/lib/periods";
import { getOutstandingReceivablesForTransactions } from "@/lib/receivables";
import { currentMonth } from "@/lib/format";

// Shared by both balance flavors below: chains every 10-day period from
// the earliest month with any activity through today, using
// `leftoverForMonth` to decide each past month's contribution (planned
// vs. actually-paid) and `currentLeftover` for the real current month.
async function chainBalanceToToday(
  accountId: string,
  leftoverForMonth: (summary: MonthSummary, isPast: boolean) => number,
  currentLeftover: number
): Promise<number> {
  const todayMonthKey = currentMonth().slice(0, 7);

  const [transactions, monthSummaries] = await Promise.all([
    getTransactionsForAccount(accountId),
    getAllMonthSummaries(accountId),
  ]);

  const leftoverByMonth = new Map(
    monthSummaries.map((s) => {
      const key = s.month.slice(0, 7);
      return [key, leftoverForMonth(s, key < todayMonthKey)];
    })
  );
  leftoverByMonth.set(todayMonthKey, currentLeftover);

  const netByPeriod = accountNetByPeriod(transactions, accountId);
  const activityMonthKeys = [
    ...leftoverByMonth.keys(),
    ...Array.from(netByPeriod.keys()).map((k) => k.slice(0, 7)),
  ].sort();
  const minMonthKey = activityMonthKeys[0] ?? todayMonthKey;

  const chain = buildPeriodChain(leftoverByMonth, netByPeriod, minMonthKey, todayMonthKey);
  return chain[chain.length - 1]?.remaining ?? 0;
}

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
  const [transactions, currentExpenses, currentIncome] = await Promise.all([
    getTransactionsForAccount(accountId),
    getExpensesForMonth(todayMonth, accountId),
    getIncomeForMonth(todayMonth, accountId),
  ]);

  const currentLeftover = currentIncome - totalForMonth(currentExpenses);
  const bank = await chainBalanceToToday(accountId, (s) => s.leftover, currentLeftover);

  const expenseTransactionIds = transactions.filter((tx) => tx.type === "expense").map((tx) => tx.id);
  const outstanding = await getOutstandingReceivablesForTransactions(expenseTransactionIds);
  const outstandingOwed = outstanding.reduce((sum, r) => sum + r.amount, 0);

  return { bank, personal: bank + outstandingOwed, outstandingOwed };
}

/** Backwards-compatible single-number accessor — the plain bank balance. */
export async function getReconciledAccountBalance(accountId: string): Promise<number> {
  return (await getAccountBalances(accountId)).bank;
}

/**
 * Same chain as `bank`, but seeded with only what's actually been marked
 * paid for the current month onward — past months are treated as fully
 * settled (same as `bank`), since by now those bills have obviously gone
 * out regardless of whether anyone went back and ticked them. This is the
 * figure that should match what's really sitting in the account today.
 */
export async function getActualAccountBalance(accountId: string): Promise<number> {
  const todayMonth = currentMonth();
  const [currentExpenses, currentIncome] = await Promise.all([
    getExpensesForMonth(todayMonth, accountId),
    getIncomeForMonth(todayMonth, accountId),
  ]);
  const currentPaidLeftover = currentIncome - totalPaidForMonth(currentExpenses);

  return chainBalanceToToday(
    accountId,
    (s, isPast) => (isPast ? s.leftover : s.paidLeftover),
    currentPaidLeftover
  );
}
