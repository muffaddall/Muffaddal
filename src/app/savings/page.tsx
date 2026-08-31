import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import {
  getBpfPurchases,
  getMoneyInfluxes,
  getSavingsMonths,
  totalBpfPurchases,
  totalMoneyInfluxes,
} from "@/lib/savings";
import { currentMonth, formatMoney } from "@/lib/format";
import BpfPurchaseRow from "./BpfPurchaseRow";
import AddBpfPurchaseForm from "./AddBpfPurchaseForm";
import SavingsMonthRow from "./SavingsMonthRow";
import AddSavingsMonthForm from "./AddSavingsMonthForm";
import MoneyInfluxRow from "./MoneyInfluxRow";
import AddMoneyInfluxForm from "./AddMoneyInfluxForm";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const [purchases, influxes, months] = await Promise.all([
    getBpfPurchases(),
    getMoneyInfluxes(),
    getSavingsMonths(),
  ]);
  const purchaseTotal = totalBpfPurchases(purchases);
  const influxSavingsTotal = totalMoneyInfluxes(influxes, "savings");
  const influxBpfTotal = totalMoneyInfluxes(influxes, "bpf");

  const thisMonth = currentMonth();
  const pastMonths = months.filter((m) => m.month <= thisMonth);
  const futureMonths = months.filter((m) => m.month > thisMonth);
  const current = pastMonths.at(-1);

  return (
    <div className="pb-10">
      <PageHeader title="Savings & debt" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="savings" />
      </div>
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
              Big Purchase Fund purchases
            </h2>
            <span className="text-sm tabular-nums text-[var(--color-negative)]">
              Total: {formatMoney(purchaseTotal)}
            </span>
          </div>
          <ul className="flex flex-col gap-1 mb-3">
            {purchases.map((purchase) => (
              <BpfPurchaseRow key={purchase.id} purchase={purchase} />
            ))}
            {purchases.length === 0 && (
              <li className="text-sm text-[var(--color-fg-dim)] py-4 text-center">
                No purchases logged.
              </li>
            )}
          </ul>
          <AddBpfPurchaseForm />
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
              Extra money
            </h2>
            {(influxSavingsTotal > 0 || influxBpfTotal > 0) && (
              <span className="text-sm tabular-nums text-[var(--color-positive)]">
                +{formatMoney(influxSavingsTotal)} savings · +{formatMoney(influxBpfTotal)} BPF
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-fg-dim)] mb-3">
            Got money from anywhere unplanned — a gift, a refund, side income — and want to add
            it straight to Savings or the Big Purchase Fund? Log it here.
          </p>
          <ul className="flex flex-col gap-1 mb-3">
            {influxes.map((influx) => (
              <MoneyInfluxRow key={influx.id} influx={influx} />
            ))}
            {influxes.length === 0 && (
              <li className="text-sm text-[var(--color-fg-dim)] py-4 text-center">
                No extra money logged.
              </li>
            )}
          </ul>
          <AddMoneyInfluxForm />
        </section>

        {current && (
          <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                Debt left
              </p>
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
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                Total savings
              </p>
              <p className="font-display text-2xl">{formatMoney(current.total_savings)}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                Account total
              </p>
              <p className="font-display text-2xl">{formatMoney(current.account_total)}</p>
            </div>
          </div>
        )}

        <section className="mb-10">
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--color-accent)" }}>
            Monthly savings progress
          </h2>
          <p className="text-xs text-[var(--color-fg-dim)] mb-3">
            Debt paydown comes from that month&apos;s &ldquo;Big Purchase Fund&rdquo; entries on
            the Expenses tab. Savings kept comes from &ldquo;Savings contribution&rdquo; entries
            there too. Big Purchase Fund purchases (above) reduce the balance separately.
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
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
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
