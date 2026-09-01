import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import CategoryPieChart from "@/components/CategoryPieChart";
import AccountQuickTabs from "@/components/AccountQuickTabs";
import { getAccounts } from "@/lib/accounts";
import { getAllDdCategories } from "@/lib/ddCategories";
import { getTransactionsForAccount } from "@/lib/transactions";
import {
  getAllMonthSummaries,
  getExpensesForMonth,
  getIncomeForMonth,
  totalForMonth,
  totalPaidForMonth,
} from "@/lib/expenses";
import { accountNetByPeriod, buildPeriodChain, type PeriodNet } from "@/lib/periods";
import { getOutstandingReceivablesForTransactions } from "@/lib/receivables";
import { CATEGORY_LABELS, topLevelCategoryId } from "@/lib/types";
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
  searchParams: Promise<{ month?: string; account?: string }>;
}) {
  const params = await searchParams;
  const month = params.month ? inputValueToMonth(params.month) : currentMonth();
  const [monthStart, monthEnd] = monthDateRange(month);
  const monthInputValue = monthToInputValue(month);
  const monthKey = month.slice(0, 7);

  const [accounts, categories] = await Promise.all([getAccounts(), getAllDdCategories()]);
  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  const selectedAccountId =
    params.account && accountsById.has(params.account) ? params.account : (accounts[0]?.id ?? null);
  const selectedAccount = selectedAccountId ? (accountsById.get(selectedAccountId) ?? null) : null;

  // Everything below — planned expenses, income, carry-over, 10-day
  // periods, balance, pie charts, diary — is scoped to this one account.
  const [accountTransactions, plannedExpenses, income, monthSummaries] = await Promise.all([
    selectedAccountId ? getTransactionsForAccount(selectedAccountId) : Promise.resolve([]),
    selectedAccountId ? getExpensesForMonth(month, selectedAccountId) : Promise.resolve([]),
    selectedAccountId ? getIncomeForMonth(month, selectedAccountId) : Promise.resolve(15000),
    selectedAccountId ? getAllMonthSummaries(selectedAccountId) : Promise.resolve([]),
  ]);

  const accountDiaryTransactions = accountTransactions.filter(
    (tx) => tx.date >= monthStart && tx.date <= monthEnd
  );

  // Every currently-outstanding "People Owe Me" split tied to an expense
  // paid from this account — used both for the diary's per-entry badge
  // and for the account-wide "owed to you" total on the Balance card.
  const expenseTransactionIds = accountTransactions.filter((tx) => tx.type === "expense").map((tx) => tx.id);
  const outstandingReceivables = await getOutstandingReceivablesForTransactions(expenseTransactionIds);
  const outstandingByTx = new Map<string, number>();
  for (const r of outstandingReceivables) {
    outstandingByTx.set(r.transactionId, (outstandingByTx.get(r.transactionId) ?? 0) + r.amount);
  }
  const totalOutstandingOwed = outstandingReceivables.reduce((sum, r) => sum + r.amount, 0);

  function pieDataFor(type: "expense" | "income") {
    const byTopCategory = new Map<string, number>();
    for (const tx of accountDiaryTransactions) {
      if (tx.type !== type || tx.accountId !== selectedAccountId) continue;
      if (!tx.categoryId) continue;
      const topId = topLevelCategoryId(tx.categoryId, categoriesById);
      if (!topId) continue;
      byTopCategory.set(topId, (byTopCategory.get(topId) ?? 0) + tx.amount);
    }
    return Array.from(byTopCategory.entries())
      .map(([catId, amount]) => ({ label: categoriesById.get(catId)?.name ?? "Other", value: amount }))
      .sort((a, b) => b.value - a.value);
  }
  const expensePieData = pieDataFor("expense");
  const incomePieData = pieDataFor("income");

  const monthlyLeftover = income - totalForMonth(plannedExpenses);
  const monthlyPaidLeftover = income - totalPaidForMonth(plannedExpenses);

  // Chain every 10-day period (resetting on the 1st/11th/21st) from the
  // earliest month with any activity through the viewed month, so each
  // period's leftover — surplus or deficit — rolls into the next instead
  // of resetting to a flat allowance every 10 days. Both the planned
  // leftover and the transaction net are this account's own, so a good or
  // bad month in one account never bleeds into another's budget.
  const plannedLeftoverByMonth = new Map(monthSummaries.map((s) => [s.month.slice(0, 7), s.leftover]));
  plannedLeftoverByMonth.set(monthKey, monthlyLeftover);
  // Same chain, but seeded with only what's actually been paid — mirrors
  // the real bank balance instead of the optimistic "everything planned
  // gets paid" projection above. Only the real current month (and any
  // future one) is judged by what's actually been ticked paid — a month
  // that's already in the past is treated as fully settled, same as
  // Planned, since by now those bills have obviously gone out. Without
  // this, every already-closed month (where nothing was ever marked paid
  // because the feature didn't exist yet, or you simply never went back
  // to tick old months) would look like untouched income and that
  // phantom surplus would compound forward indefinitely.
  const realCurrentMonthKey = currentMonth().slice(0, 7);
  const paidLeftoverByMonth = new Map(
    monthSummaries.map((s) => {
      const key = s.month.slice(0, 7);
      return [key, key < realCurrentMonthKey ? s.leftover : s.paidLeftover];
    })
  );
  paidLeftoverByMonth.set(monthKey, monthKey < realCurrentMonthKey ? monthlyLeftover : monthlyPaidLeftover);
  const netByPeriod = selectedAccountId
    ? accountNetByPeriod(accountTransactions, selectedAccountId)
    : new Map<string, PeriodNet>();
  const activityMonthKeys = [
    ...plannedLeftoverByMonth.keys(),
    ...Array.from(netByPeriod.keys()).map((k) => k.slice(0, 7)),
  ].sort();
  const minMonthKey = activityMonthKeys[0] ?? monthKey;

  const periodChain = buildPeriodChain(plannedLeftoverByMonth, netByPeriod, minMonthKey, monthKey);
  const monthPeriods = periodChain.filter((p) => p.monthKey === monthKey);
  const carryIn = monthPeriods[0].carryIn;
  const leftForMonth = monthPeriods[2].remaining;

  const paidPeriodChain = buildPeriodChain(paidLeftoverByMonth, netByPeriod, minMonthKey, monthKey);
  const paidMonthPeriods = paidPeriodChain.filter((p) => p.monthKey === monthKey);
  const actualLeftForMonth = paidMonthPeriods[2].remaining;

  const isCurrentMonth = month === currentMonth();
  const todayDay = Number(todayStr().slice(8, 10));
  const currentPeriodIndex = todayDay <= 10 ? 0 : todayDay <= 20 ? 1 : 2;
  const periodLabels = ["1–10", "11–20", `21–${monthEnd.slice(8, 10)}`];

  const byDate = new Map<string, typeof accountDiaryTransactions>();
  for (const tx of accountDiaryTransactions) {
    const list = byDate.get(tx.date);
    if (list) list.push(tx);
    else byDate.set(tx.date, [tx]);
  }
  const dates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);
  const editPlannedExpensesHref = `/expenses?month=${monthInputValue}${
    selectedAccountId ? `&account=${selectedAccountId}` : ""
  }`;

  return (
    <div className="pb-10">
      <PageHeader
        title="Day-to-Day Expenses"
        right={
          <Link
            href={`/day-to-day/new?month=${monthInputValue}${
              selectedAccountId ? `&account=${selectedAccountId}` : ""
            }`}
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
            href={`/day-to-day?month=${monthToInputValue(prev)}${
              selectedAccountId ? `&account=${selectedAccountId}` : ""
            }`}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
            aria-label="Previous month"
          >
            ←
          </Link>
          <span className="font-display text-2xl min-w-[12ch] text-center">
            {formatMonth(month)}
          </span>
          <Link
            href={`/day-to-day?month=${monthToInputValue(next)}${
              selectedAccountId ? `&account=${selectedAccountId}` : ""
            }`}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
            aria-label="Next month"
          >
            →
          </Link>
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <Link
            href={`/day-to-day/accounts?month=${monthInputValue}${
              selectedAccountId ? `&account=${selectedAccountId}` : ""
            }`}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
          >
            Accounts
          </Link>
          <Link
            href={`/day-to-day/categories?month=${monthInputValue}${
              selectedAccountId ? `&account=${selectedAccountId}` : ""
            }`}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
          >
            Categories
          </Link>
          <Link
            href="/day-to-day/people"
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
          >
            People Owe Me
          </Link>
        </div>

        <div className="flex justify-center mb-3">
          <AccountQuickTabs
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            basePath="/day-to-day"
            extraQuery={`month=${monthInputValue}`}
          />
        </div>

        {selectedAccount && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                Planned Balance
              </p>
              <p
                className="font-display text-3xl"
                style={{ color: leftForMonth < 0 ? "var(--color-negative)" : undefined }}
              >
                {formatMoney(leftForMonth, selectedAccount.currency)}
              </p>
              <p className="text-xs text-[var(--color-fg-dim)] mt-1">
                If every planned expense gets paid
              </p>
              {totalOutstandingOwed > 0 && (
                <p className="text-sm mt-2 pt-2 border-t border-white/10" style={{ color: "var(--color-positive)" }}>
                  {formatMoney(leftForMonth + totalOutstandingOwed, selectedAccount.currency)} personal
                  <span className="block text-xs text-[var(--color-fg-dim)] mt-0.5">
                    incl. {formatMoney(totalOutstandingOwed, selectedAccount.currency)} owed to you
                  </span>
                </p>
              )}
            </div>
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                Actual Balance
              </p>
              <p
                className="font-display text-3xl"
                style={{ color: actualLeftForMonth < 0 ? "var(--color-negative)" : undefined }}
              >
                {formatMoney(actualLeftForMonth, selectedAccount.currency)}
              </p>
              <p className="text-xs text-[var(--color-fg-dim)] mt-1">
                Only what you&apos;ve marked paid — matches your bank
              </p>
              {totalOutstandingOwed > 0 && (
                <p className="text-sm mt-2 pt-2 border-t border-white/10" style={{ color: "var(--color-positive)" }}>
                  {formatMoney(actualLeftForMonth + totalOutstandingOwed, selectedAccount.currency)} personal
                  <span className="block text-xs text-[var(--color-fg-dim)] mt-0.5">
                    incl. {formatMoney(totalOutstandingOwed, selectedAccount.currency)} owed to you
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        <details className="mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
              Planned Expenses Breakdown
            </span>
            <span className="text-xs text-[var(--color-fg-dim)]">▾</span>
          </summary>
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                From Planned Expenses
              </p>
              <p className="font-display text-xl">{formatMoney(monthlyLeftover, selectedAccount?.currency)}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                Carried over
              </p>
              <p
                className="font-display text-xl"
                style={{ color: carryIn < 0 ? "var(--color-negative)" : carryIn > 0 ? "var(--color-positive)" : undefined }}
              >
                {formatSignedMoney(carryIn, selectedAccount?.currency)}
              </p>
            </div>
          </div>
        </details>

        <details className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
              10-Day Periods
            </span>
            <span className="text-xs text-[var(--color-fg-dim)]">▾</span>
          </summary>
          <div className="flex flex-col gap-2 px-4 pb-4">
            {monthPeriods.map((p, i) => {
              const active = isCurrentMonth && i === currentPeriodIndex;
              return (
                <div
                  key={p.key}
                  className="rounded-xl bg-white/5 p-4"
                  style={{
                    border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className="text-xs" style={{ color: "var(--color-accent)" }}>
                      Days {periodLabels[i]}
                      {active ? " · current" : ""}
                    </p>
                    <p className="text-xs text-[var(--color-fg-dim)] text-right">
                      {formatMoney(p.base, selectedAccount?.currency)} base
                      {p.carryIn !== 0
                        ? ` ${p.carryIn > 0 ? "+" : "-"} ${formatMoney(Math.abs(p.carryIn), selectedAccount?.currency)} carried`
                        : ""}
                    </p>
                  </div>
                  <p
                    className="font-display text-2xl"
                    style={{
                      color: p.remaining < 0 ? "var(--color-negative)" : "var(--color-positive)",
                    }}
                  >
                    {formatMoney(p.remaining, selectedAccount?.currency)} left
                  </p>
                  {(p.expense > 0 || p.income > 0) && (
                    <p className="text-sm text-white/80 mt-1">
                      Spent {formatMoney(p.expense, selectedAccount?.currency)}
                      {p.income > 0 ? `, +${formatMoney(p.income, selectedAccount?.currency)} income` : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </details>

        {selectedAccount && expensePieData.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
              {selectedAccount.name}: spending by category
            </h2>
            <CategoryPieChart data={expensePieData} currency={selectedAccount.currency} />
          </section>
        )}

        {selectedAccount && incomePieData.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
              {selectedAccount.name}: income by category
            </h2>
            <CategoryPieChart data={incomePieData} currency={selectedAccount.currency} />
          </section>
        )}

        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
            Diary{selectedAccount ? ` — ${selectedAccount.name}` : ""}
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
                      perspectiveAccountId={selectedAccountId ?? undefined}
                      month={monthInputValue}
                      outstandingOwed={outstandingByTx.get(tx.id) ?? 0}
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

        <div className="border-t border-[var(--color-border)] mb-6" />

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
              Planned Expenses{selectedAccount ? ` — ${selectedAccount.name}` : ""}
            </h2>
            <Link
              href={editPlannedExpensesHref}
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
                  <p className="text-sm font-medium truncate">
                    {entry.name}
                    {entry.paid && (
                      <span
                        className="ml-2 text-xs align-middle"
                        style={{ color: "var(--color-positive)" }}
                      >
                        ✓ paid
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-fg-dim)] truncate">
                    {entry.date_label} · {CATEGORY_LABELS[entry.category]}
                  </p>
                </div>
                <span
                  className="text-sm font-semibold tabular-nums shrink-0"
                  style={{ color: "var(--color-negative)" }}
                >
                  -{formatMoney(entry.amount, selectedAccount?.currency)}
                </span>
              </div>
            ))}
            {plannedExpenses.length === 0 && (
              <p className="text-sm text-[var(--color-fg-dim)] py-4 text-center">
                No planned expenses set for this account this month.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
