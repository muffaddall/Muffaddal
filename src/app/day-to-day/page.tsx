import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getAccounts } from "@/lib/accounts";
import { getAllDdCategories } from "@/lib/ddCategories";
import { getDayToDayNetByMonth, getTransactionsForRange } from "@/lib/transactions";
import { getAllMonthSummaries, getExpensesForMonth, getIncomeForMonth, totalForMonth } from "@/lib/expenses";
import { CATEGORY_LABELS } from "@/lib/types";
import {
  addMonths,
  currentMonth,
  formatMonth,
  formatMoney,
  formatSignedMoney,
  inputValueToMonth,
  monthDateRange,
  monthToInputValue,
} from "@/lib/format";
import { todayStr } from "@/lib/date";
import DiaryEntryCard from "./DiaryEntryCard";

export const dynamic = "force-dynamic";

export default async function DayToDayPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = params.month ? inputValueToMonth(params.month) : currentMonth();
  const [monthStart, monthEnd] = monthDateRange(month);

  const [accounts, categories, transactions, plannedExpenses, income, monthSummaries, dayToDayNetByMonth] =
    await Promise.all([
      getAccounts(),
      getAllDdCategories(),
      getTransactionsForRange(monthStart, monthEnd),
      getExpensesForMonth(month),
      getIncomeForMonth(month),
      getAllMonthSummaries(),
      getDayToDayNetByMonth(),
    ]);

  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  // Carry every prior month's day-to-day surplus/deficit (planned-expense
  // leftover plus net day-to-day income/expense) into this month, so a good
  // or bad month keeps compounding forward instead of resetting monthly.
  const monthKey = month.slice(0, 7);
  const plannedLeftoverByMonth = new Map(monthSummaries.map((s) => [s.month.slice(0, 7), s.leftover]));
  const allActivityMonthKeys = new Set([...plannedLeftoverByMonth.keys(), ...dayToDayNetByMonth.keys()]);
  let carryIn = 0;
  for (const key of Array.from(allActivityMonthKeys).sort()) {
    if (key >= monthKey) continue;
    carryIn += (plannedLeftoverByMonth.get(key) ?? 0) + (dayToDayNetByMonth.get(key) ?? 0);
  }

  const monthlyLeftover = income - totalForMonth(plannedExpenses);
  const availableForMonth = monthlyLeftover + carryIn;
  const tenDayAllowance = availableForMonth / 3;

  const dayToDaySpentThisMonth = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const dayToDayIncomeThisMonth = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const leftForMonth = availableForMonth + dayToDayIncomeThisMonth - dayToDaySpentThisMonth;

  const isCurrentMonth = month === currentMonth();
  const todayDay = Number(todayStr().slice(8, 10));
  const monthPrefix = month.slice(0, 7);
  const periods = [
    { label: "1–10", start: `${monthPrefix}-01`, end: `${monthPrefix}-10` },
    { label: "11–20", start: `${monthPrefix}-11`, end: `${monthPrefix}-20` },
    { label: `21–${monthEnd.slice(8, 10)}`, start: `${monthPrefix}-21`, end: monthEnd },
  ];
  const currentPeriodIndex = todayDay <= 10 ? 0 : todayDay <= 20 ? 1 : 2;
  const currentPeriod = periods[currentPeriodIndex];
  const spentInCurrentPeriod = transactions
    .filter(
      (tx) =>
        tx.type === "expense" && tx.date >= currentPeriod.start && tx.date <= currentPeriod.end
    )
    .reduce((sum, tx) => sum + tx.amount, 0);
  const remainingInPeriod = tenDayAllowance - spentInCurrentPeriod;

  const byDate = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const list = byDate.get(tx.date);
    if (list) list.push(tx);
    else byDate.set(tx.date, [tx]);
  }
  const dates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);

  return (
    <div className="pb-10">
      <PageHeader
        title="Day-to-Day Expenses"
        right={
          <Link
            href="/day-to-day/new"
            className="flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
          >
            <span className="text-base leading-none">+</span> Add
          </Link>
        }
      />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="day-to-day" />
      </div>

      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Link
            href={`/day-to-day?month=${monthToInputValue(prev)}`}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
            aria-label="Previous month"
          >
            ←
          </Link>
          <span className="font-display text-2xl min-w-[12ch] text-center">
            {formatMonth(month)}
          </span>
          <Link
            href={`/day-to-day?month=${monthToInputValue(next)}`}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
            aria-label="Next month"
          >
            →
          </Link>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <Link
            href="/day-to-day/accounts"
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
          >
            Accounts
          </Link>
          <Link
            href="/day-to-day/categories"
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
          >
            Categories
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              From Planned Expenses
            </p>
            <p className="font-display text-xl">{formatMoney(monthlyLeftover)}</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Carried over
            </p>
            <p
              className="font-display text-xl"
              style={{ color: carryIn < 0 ? "var(--color-negative)" : carryIn > 0 ? "var(--color-positive)" : undefined }}
            >
              {formatSignedMoney(carryIn)}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Left for the month
            </p>
            <p
              className="font-display text-xl"
              style={{ color: leftForMonth < 0 ? "var(--color-negative)" : undefined }}
            >
              {formatMoney(leftForMonth)}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 mb-6">
          <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
            10-day allowance ({formatMoney(availableForMonth)} ÷ 3)
          </p>
          <p className="font-display text-2xl mb-2">{formatMoney(tenDayAllowance)}</p>
          {isCurrentMonth ? (
            <p className="text-sm text-white/80">
              Days {currentPeriod.label}: spent {formatMoney(spentInCurrentPeriod)}, left{" "}
              <span
                style={{
                  color: remainingInPeriod < 0 ? "var(--color-negative)" : "var(--color-positive)",
                }}
              >
                {formatMoney(remainingInPeriod)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-white/80">Per 10-day period this month</p>
          )}
        </div>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
              Planned Expenses
            </h2>
            <Link
              href="/expenses"
              className="text-xs text-[var(--color-fg-dim)] hover:text-white/80 transition-colors"
            >
              Edit in Planned Expenses →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {plannedExpenses.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{entry.name}</p>
                  <p className="text-xs text-[var(--color-fg-dim)] truncate">
                    {entry.date_label} · {CATEGORY_LABELS[entry.category]}
                  </p>
                </div>
                <span
                  className="text-sm font-semibold tabular-nums shrink-0"
                  style={{ color: "var(--color-negative)" }}
                >
                  -{formatMoney(entry.amount)}
                </span>
              </div>
            ))}
            {plannedExpenses.length === 0 && (
              <p className="text-sm text-[var(--color-fg-dim)] py-4 text-center">
                No planned expenses set for this month.
              </p>
            )}
          </div>
        </section>

        <div className="border-t border-[var(--color-border)] mb-6" />

        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
            Diary
          </h2>
          <div className="flex flex-col gap-4">
            {dates.map((date) => (
              <div key={date}>
                <p className="text-xs font-medium text-[var(--color-fg-dim)] mb-1.5">{date}</p>
                <div className="flex flex-col gap-2">
                  {byDate.get(date)!.map((tx) => (
                    <DiaryEntryCard
                      key={tx.id}
                      tx={tx}
                      accountsById={accountsById}
                      categoriesById={categoriesById}
                    />
                  ))}
                </div>
              </div>
            ))}
            {dates.length === 0 && (
              <p className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
                No transactions logged this month yet.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
