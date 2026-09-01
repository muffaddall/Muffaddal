import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getAccounts } from "@/lib/accounts";
import { getActualAccountBalance } from "@/lib/accountBalance";
import { getAedPerUsdRate, getInvestmentMonths } from "@/lib/investments";
import { getAedPerGbpRate, getAedPerInrRate } from "@/lib/fx";
import { getSavingsMonths } from "@/lib/savings";
import { currentMonth, formatMoney } from "@/lib/format";
import type { Currency } from "@/lib/types";
import FxRateEditor from "./FxRateEditor";

export const dynamic = "force-dynamic";

function toAed(amount: number, currency: Currency, rates: { usd: number; gbp: number; inr: number }): number {
  switch (currency) {
    case "AED":
      return amount;
    case "USD":
      return amount * rates.usd;
    case "GBP":
      return amount * rates.gbp;
    case "INR":
      return amount * rates.inr;
  }
}

export default async function NetWorthPage() {
  const [accounts, aedPerUsd, aedPerGbp, aedPerInr, investmentMonths, savingsMonths] = await Promise.all([
    getAccounts(),
    getAedPerUsdRate(),
    getAedPerGbpRate(),
    getAedPerInrRate(),
    getInvestmentMonths(),
    getSavingsMonths(),
  ]);
  const rates = { usd: aedPerUsd, gbp: aedPerGbp, inr: aedPerInr };

  const accountBalances = await Promise.all(
    accounts.map(async (account) => ({
      account,
      balance: await getActualAccountBalance(account.id),
    }))
  );
  const cashRows = accountBalances.map(({ account, balance }) => ({
    label: account.name,
    native: balance,
    currency: account.currency,
    aed: toAed(balance, account.currency, rates),
  }));
  const cashTotal = cashRows.reduce((sum, r) => sum + r.aed, 0);

  const latestPortfolioUsd =
    [...investmentMonths].reverse().find((m) => m.portfolio_value_eom !== null)?.portfolio_value_eom ?? 0;
  const portfolioAed = latestPortfolioUsd * aedPerUsd;

  const thisMonth = currentMonth();
  const currentSavings = savingsMonths.filter((m) => m.month <= thisMonth).at(-1);
  const savingsAed = currentSavings?.total_savings ?? 0;
  const bpfAed = currentSavings?.debt_left ?? 0;

  const netWorth = cashTotal + portfolioAed + savingsAed + bpfAed;

  return (
    <div className="pb-10">
      <PageHeader title="Net Worth" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="networth" />
      </div>
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 text-center">
          <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
            Net Worth
          </p>
          <p
            className="font-display text-5xl"
            style={{ color: netWorth < 0 ? "var(--color-negative)" : undefined }}
          >
            {formatMoney(netWorth)}
          </p>
          <p className="text-xs text-[var(--color-fg-dim)] mt-2">
            Cash across every account + investment portfolio + savings + Big Purchase Fund (net of debt)
          </p>
        </div>

        <div className="overflow-x-auto mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full border-collapse">
            <tbody>
              <CategoryRow label="Cash Balance" total={cashTotal} />
              {cashRows.map((row) => (
                <ItemRow
                  key={row.label}
                  label={row.label}
                  value={
                    row.currency === "AED"
                      ? formatMoney(row.aed)
                      : `${formatMoney(row.native, row.currency)} (≈ ${formatMoney(row.aed)})`
                  }
                />
              ))}

              <CategoryRow label="Investment" total={portfolioAed} />
              <ItemRow
                label="Portfolio Value"
                value={
                  latestPortfolioUsd
                    ? `${formatMoney(latestPortfolioUsd, "USD")} (≈ ${formatMoney(portfolioAed)})`
                    : formatMoney(0)
                }
              />

              <CategoryRow label="Savings and BPF" total={savingsAed + bpfAed} />
              <ItemRow label="Savings" value={formatMoney(savingsAed)} />
              <ItemRow label="BPF" value={formatMoney(bpfAed)} negative={bpfAed < 0} />
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-fg-dim)] mb-2">
            Exchange rates used to convert non-AED accounts above
          </p>
          <FxRateEditor aedPerGbp={aedPerGbp} aedPerInr={aedPerInr} />
        </div>
      </main>
    </div>
  );
}

function CategoryRow({ label, total }: { label: string; total: number }) {
  return (
    <tr className="border-t border-[var(--color-border)] first:border-t-0">
      <td colSpan={2} className="px-4 pt-4 pb-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
            {label}
          </span>
          <span className="text-sm font-semibold tabular-nums">{formatMoney(total)}</span>
        </div>
      </td>
    </tr>
  );
}

function ItemRow({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <tr>
      <td className="pl-8 pr-4 py-1.5 text-sm text-[var(--color-fg-dim)]">{label}</td>
      <td
        className="px-4 py-1.5 text-sm text-right tabular-nums"
        style={{ color: negative ? "var(--color-negative)" : undefined }}
      >
        {value}
      </td>
    </tr>
  );
}
