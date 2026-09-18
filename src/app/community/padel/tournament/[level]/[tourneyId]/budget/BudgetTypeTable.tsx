import { budgetLineActualTotal, budgetLineBudgetedTotal } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import type { TourneyBudgetLine, TourneyBudgetLineType, TourneyLevel } from "@/lib/types";
import BudgetLineRow from "./BudgetLineRow";
import AddBudgetLineForm from "./AddBudgetLineForm";

/** One Budgeted or Actual P&L card, scoped to a single line type (income or outflow) — the split-page counterpart of the old combined BudgetPLTable. `extraBudgeted`/`extraActual` fold in a non-line total (Team Registrations) as one rollup row above the manual lines. */
export default function BudgetTypeTable({
  title,
  mode,
  type,
  lines,
  level,
  tourneyId,
  extraLabel,
  extraBudgeted = 0,
  extraActual = 0,
}: {
  title: string;
  mode: "budgeted" | "actual";
  type: TourneyBudgetLineType;
  lines: TourneyBudgetLine[];
  level: TourneyLevel;
  tourneyId: string;
  extraLabel?: string;
  extraBudgeted?: number;
  extraActual?: number;
}) {
  const lineTotal = mode === "budgeted" ? budgetLineBudgetedTotal : budgetLineActualTotal;
  const manualTotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const extra = mode === "budgeted" ? extraBudgeted : extraActual;
  const total = manualTotal + extra;
  const totalColor = type === "income" ? "var(--color-positive)" : "var(--color-negative)";
  const typeLabel = type === "income" ? "Income" : "Outflow";

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4">
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[22rem]">
          <thead>
            <tr className="text-xs text-white/40">
              <th className="text-left font-normal pb-1">Name</th>
              <th className="text-right font-normal pb-1 px-1">Units</th>
              <th className="text-right font-normal pb-1 px-1">Unit Cost</th>
              <th className="text-right font-normal pb-1 pl-1">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {extraLabel && (
              <tr>
                <td className="py-1.5 text-sm">{extraLabel}</td>
                <td colSpan={2}></td>
                <td className="py-1.5 text-right text-sm tabular-nums whitespace-nowrap">{formatMoney(extra)}</td>
                <td></td>
              </tr>
            )}
            {lines.map((line) => (
              <BudgetLineRow key={line.id} level={level} tourneyId={tourneyId} line={line} mode={mode} showDelete={mode === "budgeted"} />
            ))}
            {lines.length === 0 && !extraLabel && (
              <tr>
                <td colSpan={5} className="text-xs text-white/40 text-center py-2">
                  No {typeLabel.toLowerCase()} lines yet.
                </td>
              </tr>
            )}
            <tr className="font-semibold border-t border-white/10">
              <td className="pt-1.5">Total {typeLabel}</td>
              <td colSpan={2}></td>
              <td className="pt-1.5 text-right tabular-nums" style={{ color: totalColor }}>
                {formatMoney(total)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {mode === "budgeted" && (
        <div className="mt-4">
          <AddBudgetLineForm level={level} tourneyId={tourneyId} type={type} />
        </div>
      )}
    </div>
  );
}
