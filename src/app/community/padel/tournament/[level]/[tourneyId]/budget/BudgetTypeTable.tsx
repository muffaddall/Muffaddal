import { budgetLineTotal } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import type { TourneyBudgetLine, TourneyBudgetLineType, TourneyLevel } from "@/lib/types";
import BudgetLineRow from "./BudgetLineRow";
import AddBudgetLineForm from "./AddBudgetLineForm";

/** The Income or Expenses line-item table — one per budget page. `extraBudgeted` folds in a non-line total (Team Registrations) as one rollup row above the manual lines. */
export default function BudgetTypeTable({
  type,
  lines,
  level,
  tourneyId,
  extraLabel,
  extraTotal = 0,
}: {
  type: TourneyBudgetLineType;
  lines: TourneyBudgetLine[];
  level: TourneyLevel;
  tourneyId: string;
  extraLabel?: string;
  extraTotal?: number;
}) {
  const manualTotal = lines.reduce((s, l) => s + budgetLineTotal(l), 0);
  const total = manualTotal + extraTotal;
  const totalColor = type === "income" ? "var(--color-positive)" : "var(--color-negative)";
  const typeLabel = type === "income" ? "Income" : "Outflow";
  const columnCount = type === "outflow" ? 6 : 5;

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[22rem]">
          <thead>
            <tr className="text-xs text-white/40">
              <th className="text-left font-normal pb-1">Name</th>
              <th className="text-right font-normal pb-1 px-1">Units</th>
              <th className="text-right font-normal pb-1 px-1">Unit Cost</th>
              <th className="text-right font-normal pb-1 pl-1">Total</th>
              {type === "outflow" && <th className="text-center font-normal pb-1 pl-2">Paid</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {extraLabel && (
              <tr>
                <td className="py-1.5 text-sm">{extraLabel}</td>
                <td colSpan={2}></td>
                <td className="py-1.5 text-right text-sm tabular-nums whitespace-nowrap">{formatMoney(extraTotal)}</td>
                {type === "outflow" && <td></td>}
                <td></td>
              </tr>
            )}
            {lines.map((line) => (
              <BudgetLineRow key={line.id} level={level} tourneyId={tourneyId} line={line} />
            ))}
            {lines.length === 0 && !extraLabel && (
              <tr>
                <td colSpan={columnCount} className="text-xs text-white/40 text-center py-2">
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
              {type === "outflow" && <td></td>}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <AddBudgetLineForm level={level} tourneyId={tourneyId} type={type} />
      </div>
    </div>
  );
}
