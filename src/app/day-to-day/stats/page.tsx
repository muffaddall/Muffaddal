import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import AccountQuickTabs from "@/components/AccountQuickTabs";
import CategoryPieChart from "@/components/CategoryPieChart";
import { getAccounts } from "@/lib/accounts";
import { getAllDdCategories } from "@/lib/ddCategories";
import { getAllTransactions, getTransactionsForRange } from "@/lib/transactions";
import { categorySubtreeIds, type DdCategory } from "@/lib/types";
import {
  formatMoney,
  isStatsRangeKey,
  statsRangeDates,
  STATS_RANGE_KEYS,
  STATS_RANGE_LABELS,
  type StatsRangeKey,
} from "@/lib/format";
import { formatDateShort } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function DayToDayStatsPage(props: {
  searchParams: Promise<{ account?: string; range?: string; path?: string }>;
}) {
  const params = await props.searchParams;

  const accounts = await getAccounts();
  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const selectedAccountId =
    params.account && accountsById.has(params.account) ? params.account : (accounts[0]?.id ?? null);
  const selectedAccount = selectedAccountId ? (accountsById.get(selectedAccountId) ?? null) : null;

  const rangeKey: StatsRangeKey = params.range && isStatsRangeKey(params.range) ? params.range : "this_month";
  const bounds = statsRangeDates(rangeKey);

  const pathIds = (params.path ?? "").split(",").filter(Boolean);
  const currentParentId = pathIds.length > 0 ? pathIds[pathIds.length - 1] : null;

  const [categories, transactions] = await Promise.all([
    getAllDdCategories(),
    bounds ? getTransactionsForRange(bounds[0], bounds[1]) : getAllTransactions(),
  ]);
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  const expenseTx = transactions.filter(
    (tx) => tx.type === "expense" && tx.accountId === selectedAccountId
  );

  function totalForSubtree(categoryId: string): number {
    const ids = new Set(categorySubtreeIds(categoryId, categories));
    return expenseTx
      .filter((tx) => tx.categoryId && ids.has(tx.categoryId))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  function buildUrl(opts: { path?: string[]; range?: StatsRangeKey } = {}): string {
    const q = new URLSearchParams();
    if (selectedAccountId) q.set("account", selectedAccountId);
    q.set("range", opts.range ?? rangeKey);
    const p = opts.path ?? pathIds;
    if (p.length > 0) q.set("path", p.join(","));
    return `/day-to-day/stats?${q.toString()}`;
  }

  const levelCategories = categories
    .filter((c) => c.kind === "expense" && c.parentId === currentParentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const pieData = levelCategories
    .map((cat) => ({
      label: cat.name,
      value: totalForSubtree(cat.id),
      href: buildUrl({ path: [...pathIds, cat.id] }),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Leaf category (no sub-categories left to drill into) — list its
  // actual transactions instead of an empty pie chart.
  const isLeaf = currentParentId !== null && levelCategories.length === 0;
  const leafTransactions = isLeaf
    ? expenseTx
        .filter((tx) => tx.categoryId === currentParentId)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const totalForView = isLeaf
    ? totalForSubtree(currentParentId!)
    : pieData.reduce((sum, d) => sum + d.value, 0);

  // Breadcrumb trail from the root down to the current category.
  const breadcrumb = pathIds.map((id) => categoriesById.get(id)).filter((c): c is DdCategory => !!c);

  return (
    <div className="pb-10">
      <PageHeader title="Spending Stats" subtitle="Day-to-Day Expenses" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="day-to-day" />
      </div>

      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="flex justify-center mb-3">
          <AccountQuickTabs
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            basePath="/day-to-day/stats"
            extraQuery={`range=${rangeKey}`}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 mb-6">
          {STATS_RANGE_KEYS.map((key) => (
            <Link
              key={key}
              href={buildUrl({ range: key })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                rangeKey === key
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/50 border border-white/10"
              }`}
            >
              {STATS_RANGE_LABELS[key]}
            </Link>
          ))}
        </div>

        {selectedAccount && (
          <>
            <div className="flex items-center flex-wrap gap-1.5 mb-4 text-sm">
              <Link
                href={buildUrl({ path: [] })}
                className={`hover:text-white transition-colors ${
                  pathIds.length === 0 ? "text-white font-semibold" : "text-white/50"
                }`}
              >
                All Categories
              </Link>
              {breadcrumb.map((cat, i) => (
                <span key={cat.id} className="flex items-center gap-1.5">
                  <span className="text-white/30">›</span>
                  <Link
                    href={buildUrl({ path: pathIds.slice(0, i + 1) })}
                    className={`hover:text-white transition-colors ${
                      i === breadcrumb.length - 1 ? "text-white font-semibold" : "text-white/50"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </span>
              ))}
            </div>

            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center mb-6">
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                Total spent{breadcrumb.length > 0 ? ` — ${breadcrumb[breadcrumb.length - 1].name}` : ""}
              </p>
              <p className="font-display text-3xl">{formatMoney(totalForView, selectedAccount.currency)}</p>
              <p className="text-xs text-[var(--color-fg-dim)] mt-1">{STATS_RANGE_LABELS[rangeKey]}</p>
            </div>

            {pieData.length > 0 && (
              <CategoryPieChart data={pieData} currency={selectedAccount.currency} />
            )}

            {pieData.length === 0 && !isLeaf && (
              <p className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
                No spending in this category for the selected period.
              </p>
            )}

            {isLeaf && (
              <section>
                <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
                  Transactions
                </h2>
                <div className="flex flex-col gap-2">
                  {leafTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.note || "—"}</p>
                        <p className="text-xs text-[var(--color-fg-dim)]">{formatDateShort(tx.date)}</p>
                      </div>
                      <span
                        className="text-sm font-semibold tabular-nums shrink-0"
                        style={{ color: "var(--color-negative)" }}
                      >
                        -{formatMoney(tx.amount, selectedAccount.currency)}
                      </span>
                    </div>
                  ))}
                  {leafTransactions.length === 0 && (
                    <p className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
                      No transactions in this category for the selected period.
                    </p>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {!selectedAccount && (
          <p className="text-sm text-[var(--color-fg-dim)] py-10 text-center">
            Add an account first to see stats.
          </p>
        )}
      </main>
    </div>
  );
}
