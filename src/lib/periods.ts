import { addMonths, monthToInputValue, periodKeyForDate } from "@/lib/format";
import { transactionAccountDelta, type Transaction } from "@/lib/types";

export type PeriodNet = { income: number; expense: number };

export type Period = {
  key: string; // start date "yyyy-mm-01/11/21"
  monthKey: string; // "yyyy-mm"
  index: 0 | 1 | 2;
  base: number; // this period's share of that month's Planned Expenses leftover
  carryIn: number; // leftover rolled in from the immediately preceding period
  income: number;
  expense: number;
  available: number; // base + carryIn, what the period starts with
  remaining: number; // available + income - expense, rolls into the next period
};

/**
 * Chains every 10-day period from `fromMonthKey` through `toMonthKey`
 * (inclusive, both "yyyy-mm"), threading each period's leftover into the
 * next so a surplus or deficit compounds forward — resetting on the 1st,
 * 11th, and 21st but never losing track of what's actually left to spend.
 */
export function buildPeriodChain(
  plannedLeftoverByMonth: Map<string, number>,
  netByPeriod: Map<string, PeriodNet>,
  fromMonthKey: string,
  toMonthKey: string
): Period[] {
  const periods: Period[] = [];
  let carry = 0;
  let monthKey = fromMonthKey;

  while (true) {
    const base = (plannedLeftoverByMonth.get(monthKey) ?? 0) / 3;
    const starts = [`${monthKey}-01`, `${monthKey}-11`, `${monthKey}-21`] as const;
    starts.forEach((key, i) => {
      const net = netByPeriod.get(key) ?? { income: 0, expense: 0 };
      const available = base + carry;
      const remaining = available + net.income - net.expense;
      periods.push({
        key,
        monthKey,
        index: i as 0 | 1 | 2,
        base,
        carryIn: carry,
        income: net.income,
        expense: net.expense,
        available,
        remaining,
      });
      carry = remaining;
    });

    if (monthKey === toMonthKey) break;
    monthKey = monthToInputValue(addMonths(`${monthKey}-01`, 1));
  }

  return periods;
}

/**
 * Buckets one account's own transactions into per-period income/expense
 * totals, from that account's perspective — a transfer out counts as an
 * expense, a transfer in counts as income, alongside ordinary income/
 * expense transactions. Feeds `buildPeriodChain` so an account's 10-day
 * periods reflect only money that actually moved through that account.
 */
export function accountNetByPeriod(
  transactions: Transaction[],
  accountId: string
): Map<string, PeriodNet> {
  const byPeriod = new Map<string, PeriodNet>();
  for (const tx of transactions) {
    const delta = transactionAccountDelta(tx, accountId);
    if (delta === 0) continue;
    const key = periodKeyForDate(tx.date);
    const entry = byPeriod.get(key) ?? { income: 0, expense: 0 };
    if (delta > 0) entry.income += delta;
    else entry.expense += -delta;
    byPeriod.set(key, entry);
  }
  return byPeriod;
}
