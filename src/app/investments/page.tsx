import TopNav from "@/components/TopNav";
import { getInvestmentMonths } from "@/lib/investments";
import AddMonthForm from "./AddMonthForm";
import InvestmentRow from "./InvestmentRow";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const rows = await getInvestmentMonths();

  return (
    <div className="min-h-dvh">
      <TopNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl mb-6">Investment progress</h1>

        <div className="overflow-x-auto mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
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
