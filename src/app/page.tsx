import Link from "next/link";
import TopNav from "@/components/TopNav";
import { getExpensesForMonth, getIncomeForMonth, totalForMonth } from "@/lib/expenses";
import { getInvestmentMonths } from "@/lib/investments";
import { getSavingsMonths } from "@/lib/savings";
import { currentMonth, formatMoney, formatMonth, formatPercent, formatSignedMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const month = currentMonth();
  const [entries, income, investmentMonths, savingsMonths] = await Promise.all([
    getExpensesForMonth(month),
    getIncomeForMonth(month),
    getInvestmentMonths(),
    getSavingsMonths(),
  ]);

  const total = totalForMonth(entries);
  const leftover = income - total;
  const latestInvestment = investmentMonths.at(-1);
  const latestSavings = savingsMonths.at(-1);

  return (
    <div className="min-h-dvh">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl mb-1">Overview</h1>
        <p className="text-sm text-[var(--color-fg-dim)] mb-6">{formatMonth(month)}</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/expenses"
            className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 hover:border-[var(--color-accent)] transition-colors"
          >
            <p className="text-xs text-[var(--color-fg-dim)] mb-3">This month&apos;s expenses</p>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm text-[var(--color-fg-dim)]">Income</span>
              <span className="font-display text-xl">{formatMoney(income)}</span>
            </div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm text-[var(--color-fg-dim)]">Spent</span>
              <span className="font-display text-xl">{formatMoney(total)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-[var(--color-fg-dim)]">Left over</span>
              <span
                className="font-display text-xl"
                style={{ color: leftover < 0 ? "var(--color-negative)" : "var(--color-positive)" }}
              >
                {formatSignedMoney(leftover)}
              </span>
            </div>
          </Link>

          <Link
            href="/investments"
            className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 hover:border-[var(--color-accent)] transition-colors"
          >
            <p className="text-xs text-[var(--color-fg-dim)] mb-3">Investments</p>
            {latestInvestment ? (
              <>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm text-[var(--color-fg-dim)]">Total invested</span>
                  <span className="font-display text-xl">
                    {formatMoney(latestInvestment.total_invested)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm text-[var(--color-fg-dim)]">Portfolio value</span>
                  <span className="font-display text-xl">
                    {formatMoney(latestInvestment.portfolio_value_eom)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-[var(--color-fg-dim)]">P&amp;L</span>
                  <span
                    className="font-display text-xl"
                    style={{
                      color:
                        (latestInvestment.pnl_pct ?? 0) >= 0
                          ? "var(--color-positive)"
                          : "var(--color-negative)",
                    }}
                  >
                    {formatPercent(latestInvestment.pnl_pct)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--color-fg-dim)]">No data yet.</p>
            )}
          </Link>

          <Link
            href="/savings"
            className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 hover:border-[var(--color-accent)] transition-colors"
          >
            <p className="text-xs text-[var(--color-fg-dim)] mb-3">Savings &amp; debt</p>
            {latestSavings ? (
              <>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm text-[var(--color-fg-dim)]">Debt left</span>
                  <span
                    className="font-display text-xl"
                    style={{
                      color:
                        latestSavings.debt_left < 0
                          ? "var(--color-negative)"
                          : "var(--color-positive)",
                    }}
                  >
                    {formatMoney(latestSavings.debt_left)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm text-[var(--color-fg-dim)]">Total savings</span>
                  <span className="font-display text-xl">
                    {formatMoney(latestSavings.total_savings)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-[var(--color-fg-dim)]">Account total</span>
                  <span className="font-display text-xl">
                    {formatMoney(latestSavings.account_total)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--color-fg-dim)]">No data yet.</p>
            )}
          </Link>
        </div>
      </main>
    </div>
  );
}
