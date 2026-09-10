import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getBudgetLines, getTourney } from "@/lib/tourneys";
import { computeBudgetSummary, isTourneyLevel, TOURNEY_LEVEL_LABELS } from "@/lib/types";
import { formatMoney, formatSignedMoney } from "@/lib/format";
import BudgetLineRow from "./BudgetLineRow";
import AddBudgetLineForm from "./AddBudgetLineForm";

export const dynamic = "force-dynamic";

export default async function BudgetPage(props: PageProps<"/community/padel/tournament/[level]/[tourneyId]/budget">) {
  const { level: levelParam, tourneyId } = await props.params;
  if (!isTourneyLevel(levelParam)) notFound();
  const level = levelParam;

  const tourney = await getTourney(tourneyId);
  if (!tourney || tourney.level !== level) notFound();

  const lines = await getBudgetLines(tourneyId);
  const income = lines.filter((l) => l.type === "income");
  const outflow = lines.filter((l) => l.type === "outflow");
  const summary = computeBudgetSummary(lines);

  return (
    <div className="pb-10">
      <PageHeader title="Budget Sheet" subtitle={`${tourney.name} · ${TOURNEY_LEVEL_LABELS[level]}`} />
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-6">
        <div className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-white/40">
                <th className="text-left font-normal pb-2"></th>
                <th className="text-right font-normal pb-2">Budgeted</th>
                <th className="text-right font-normal pb-2">Actual</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1" style={{ color: "var(--color-positive)" }}>
                  Income
                </td>
                <td className="py-1 text-right tabular-nums">{formatMoney(summary.budgetedIncome)}</td>
                <td className="py-1 text-right tabular-nums">{formatMoney(summary.actualIncome)}</td>
              </tr>
              <tr>
                <td className="py-1" style={{ color: "var(--color-negative)" }}>
                  Outflow
                </td>
                <td className="py-1 text-right tabular-nums">{formatMoney(summary.budgetedOutflow)}</td>
                <td className="py-1 text-right tabular-nums">{formatMoney(summary.actualOutflow)}</td>
              </tr>
              <tr className="font-semibold border-t border-white/10">
                <td className="pt-2">Netflow</td>
                <td
                  className="pt-2 text-right tabular-nums"
                  style={{ color: summary.budgetedNetflow >= 0 ? "var(--color-positive)" : "var(--color-negative)" }}
                >
                  {formatSignedMoney(summary.budgetedNetflow)}
                </td>
                <td
                  className="pt-2 text-right tabular-nums"
                  style={{ color: summary.actualNetflow >= 0 ? "var(--color-positive)" : "var(--color-negative)" }}
                >
                  {formatSignedMoney(summary.actualNetflow)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-positive)" }}>
            Income
          </h2>
          <div className="flex flex-col gap-2">
            {income.map((line) => (
              <BudgetLineRow key={line.id} level={level} tourneyId={tourneyId} line={line} />
            ))}
            {income.length === 0 && <p className="text-sm text-white/40 text-center py-2">No income lines yet.</p>}
            <AddBudgetLineForm level={level} tourneyId={tourneyId} type="income" />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-negative)" }}>
            Outflow
          </h2>
          <div className="flex flex-col gap-2">
            {outflow.map((line) => (
              <BudgetLineRow key={line.id} level={level} tourneyId={tourneyId} line={line} />
            ))}
            {outflow.length === 0 && <p className="text-sm text-white/40 text-center py-2">No outflow lines yet.</p>}
            <AddBudgetLineForm level={level} tourneyId={tourneyId} type="outflow" />
          </div>
        </section>
      </main>
    </div>
  );
}
