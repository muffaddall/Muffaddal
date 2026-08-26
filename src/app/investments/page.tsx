import { PageHeader } from "@/components/PageHeader";
import { getAedPerUsdRate, getInvestmentMonths } from "@/lib/investments";
import AddMonthForm from "./AddMonthForm";
import InvestmentRow from "./InvestmentRow";
import AedRateEditor from "./AedRateEditor";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const [rows, rate] = await Promise.all([getInvestmentMonths(), getAedPerUsdRate()]);

  return (
    <div className="pb-10">
      <PageHeader title="Investments" />
      <main className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <p className="text-xs text-[var(--color-fg-dim)] max-w-md">
            Contribution comes from that month&apos;s &ldquo;Investment funding&rdquo; entries on
            the Expenses tab (in AED), converted to USD using the rate below.
          </p>
          <AedRateEditor rate={rate} />
        </div>

        <div className="overflow-x-auto mt-3 mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="text-left text-xs text-[var(--color-fg-dim)]">
                <th className="pb-2 pr-3 font-medium">Month</th>
                <th className="pb-2 pr-3 font-medium">Contribution</th>
                <th className="pb-2 pr-3 font-medium">Total invested</th>
                <th className="pb-2 pr-3 font-medium">Portfolio value</th>
                <th className="pb-2 pr-3 font-medium">P&amp;L %</th>
                <th className="pb-2 pr-3 font-medium">$ P&amp;L</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <InvestmentRow key={row.month} row={row} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-[var(--color-fg-dim)]">
                    No investment months logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AddMonthForm />
      </main>
    </div>
  );
}
