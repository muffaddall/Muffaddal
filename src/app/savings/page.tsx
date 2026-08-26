import { MenuButton } from "@/components/MenuButton";
import { getDebts, getSavingsMonths, totalDebt } from "@/lib/savings";
import { currentMonth, formatMoney } from "@/lib/format";
import DebtRow from "./DebtRow";
import AddDebtForm from "./AddDebtForm";
import SavingsMonthRow from "./SavingsMonthRow";
import AddSavingsMonthForm from "./AddSavingsMonthForm";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const [debts, months] = await Promise.all([getDebts(), getSavingsMonths()]);
  const debtTotal = totalDebt(debts);

  const thisMonth = currentMonth();
  const pastMonths = months.filter((m) => m.month <= thisMonth);
  const futureMonths = months.filter((m) => m.month > thisMonth);
  const current = pastMonths.at(-1);

  return (
    <div className="pb-10">
      <div className="flex items-center px-4 pt-4 pb-2">
        <MenuButton />
        <span className="ml-3 font-display text-2xl tracking-wide">Savings &amp; debt</span>
      </div>
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <h1 className="sr-only">Savings &amp; debt</h1>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[var(--color-fg-dim)]">Standing debts</h2>
            <span
              className="text-sm tabular-nums"
              style={{ color: debtTotal < 0 ? "var(--color-negative)" : "var(--color-positive)" }}
            >
              Total: {formatMoney(debtTotal)}
            </span>
          </div>
          <ul className="flex flex-col gap-1 mb-3">
            {debts.map((debt) => (
              <DebtRow key={debt.id} debt={debt} />
            ))}
            {debts.length === 0 && (
              <li className="text-sm text-[var(--color-fg-dim)] py-4 text-center">
                No debts logged.
              </li>
            )}
          </ul>
          <AddDebtForm />
        </section>

        {current && (
          <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-fg-dim)] mb-1">Debt left</p>
              <p
                className="font-display text-2xl"
                style={{
                  color: current.debt_left < 0 ? "var(--color-negative)" : "var(--color-positive)",
                }}
              >
                {formatMoney(current.debt_left)}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-fg-dim)] mb-1">Total savings</p>
              <p className="font-display text-2xl">{formatMoney(current.total_savings)}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-fg-dim)] mb-1">Account total</p>
              <p className="font-display text-2xl">{formatMoney(current.account_total)}</p>
            </div>
          </div>
        )}

        <section className="mb-10">
          <h2 className="text-sm font-medium text-[var(--color-fg-dim)] mb-1">
            Monthly savings progress
          </h2>
          <p className="text-xs text-[var(--color-fg-dim)] mb-3">
            Debt paydown and savings kept both come from that month&apos;s &ldquo;Debt paying
            back&rdquo; and &ldquo;Savings contribution&rdquo; entries on the Expenses tab — edit
            them there.
          </p>
          <div className="overflow-x-auto mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <table className="w-full min-w-[780px] border-collapse">
              <thead>
                <tr className="text-left text-xs text-[var(--color-fg-dim)]">
                  <th className="pb-2 pr-3 font-medium">Month</th>
                  <th className="pb-2 pr-3 font-medium">Debt paydown</th>
                  <th className="pb-2 pr-3 font-medium">Debt left</th>
                  <th className="pb-2 pr-3 font-medium">Big payment</th>
                  <th className="pb-2 pr-3 font-medium">Savings kept</th>
                  <th className="pb-2 pr-3 font-medium">Total savings</th>
                  <th className="pb-2 pr-3 font-medium">Account total</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {pastMonths.map((row) => (
                  <SavingsMonthRow key={row.month} row={row} />
                ))}
                {pastMonths.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-[var(--color-fg-dim)]">
                      No months logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AddSavingsMonthForm />
        </section>

        {futureMonths.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-[var(--color-fg-dim)] mb-3">
              Future / not yet happened
            </h2>
            <div className="overflow-x-auto mb-6 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-3 opacity-70">
              <table className="w-full min-w-[780px] border-collapse">
                <thead>
                  <tr className="text-left text-xs text-[var(--color-fg-dim)]">
                    <th className="pb-2 pr-3 font-medium">Month</th>
                    <th className="pb-2 pr-3 font-medium">Debt paydown</th>
                    <th className="pb-2 pr-3 font-medium">Debt left</th>
                    <th className="pb-2 pr-3 font-medium">Big payment</th>
                    <th className="pb-2 pr-3 font-medium">Savings kept</th>
                    <th className="pb-2 pr-3 font-medium">Total savings</th>
                    <th className="pb-2 pr-3 font-medium">Account total</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {futureMonths.map((row) => (
                    <SavingsMonthRow key={row.month} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
