import { addMonths, monthToInputValue, periodKeyForDate } from "@/lib/format";
import { transactionAccountDelta, type Transaction } from "@/lib/types";

export type PeriodNet = { income: number; expense: number };

export type Period = {
  key: string; // start date "yyyy-mm-01/11/21"
  monthKey: string; // "yyyy-mm"
  index: 0 | 1 | 2;
  base: number; // this period's even share of (this month's Planned Expenses leftover + last month's carry-in)
  monthCarryIn: number; // whatever rolled in from the previous month, already spread evenly into every period's base this month — same value for all 3 periods, kept for display
  carryIn: number; // leftover rolled in from the immediately preceding period within this month (always 0 for the 1st period, since the cross-month carry is already inside base)
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
 *
 * A month's carry-in from the previous month is folded into that month's
 * Planned Expenses leftover *before* splitting it three ways, so a bad
 * month's deficit is spread evenly across all three of the new month's
 * periods instead of landing entirely on the first 10 days and only
 * gradually recovering by the third period.
 */
export function buildPeriodChain(
  plannedLeftoverByMonth: Map<string, number>,
  netByPeriod: Map<string, PeriodNet>,
  fromMonthKey: string,
  toMonthKey: string
): Period[] {
  const periods: Period[] = [];
  let incomingCarry = 0;
  let monthKey = fromMonthKey;

  while (true) {
    const monthCarryIn = incomingCarry;
    const base = ((plannedLeftoverByMonth.get(monthKey) ?? 0) + monthCarryIn) / 3;
    let carry = 0;
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
        monthCarryIn,
        carryIn: carry,
        income: net.income,
        expense: net.expense,
        available,
        remaining,
      });
      carry = remaining;
    });
    incomingCarry = carry;

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
