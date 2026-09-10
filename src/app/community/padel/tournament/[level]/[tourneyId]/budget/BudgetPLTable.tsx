import { budgetLineActualTotal, budgetLineBudgetedTotal } from "@/lib/types";
import { formatMoney, formatSignedMoney } from "@/lib/format";
import type { TourneyBudgetLine, TourneyLevel } from "@/lib/types";
import BudgetLineRow from "./BudgetLineRow";
import AddBudgetLineForm from "./AddBudgetLineForm";

export default function BudgetPLTable({
  title,
  mode,
  income,
  outflow,
  level,
  tourneyId,
}: {
  title: string;
  mode: "budgeted" | "actual";
  income: TourneyBudgetLine[];
  outflow: TourneyBudgetLine[];
  level: TourneyLevel;
  tourneyId: string;
}) {
  const lineTotal = mode === "budgeted" ? budgetLineBudgetedTotal : budgetLineActualTotal;
  const incomeTotal = income.reduce((s, l) => s + lineTotal(l), 0);
  const outflowTotal = outflow.reduce((s, l) => s + lineTotal(l), 0);
  const net = incomeTotal - outflowTotal;

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
            <tr>
              <td colSpan={5} className="pt-2 pb-1 text-xs uppercase tracking-wide" style={{ color: "var(--color-positive)" }}>
                Income
              </td>
            </tr>
            {income.map((line) => (
              <BudgetLineRow key={line.id} level={level} tourneyId={tourneyId} line={line} mode={mode} showDelete={mode === "budgeted"} />
            ))}
            {income.length === 0 && (
              <tr>
                <td colSpan={5} className="text-xs text-white/40 text-center py-2">
                  No income lines yet.
                </td>
              </tr>
            )}
            <tr className="font-semibold border-t border-white/10">
              <td className="pt-1.5">Total Income</td>
              <td colSpan={2}></td>
              <td className="pt-1.5 text-right tabular-nums">{formatMoney(incomeTotal)}</td>
              <td></td>
            </tr>

            <tr>
              <td colSpan={5} className="pt-4 pb-1 text-xs uppercase tracking-wide" style={{ color: "var(--color-negative)" }}>
                Outflow
              </td>
            </tr>
            {outflow.map((line) => (
              <BudgetLineRow key={line.id} level={level} tourneyId={tourneyId} line={line} mode={mode} showDelete={mode === "budgeted"} />
            ))}
            {outflow.length === 0 && (
              <tr>
                <td colSpan={5} className="text-xs text-white/40 text-center py-2">
                  No outflow lines yet.
                </td>
              </tr>
            )}
            <tr className="font-semibold border-t border-white/10">
              <td className="pt-1.5">Total Outflow</td>
              <td colSpan={2}></td>
              <td className="pt-1.5 text-right tabular-nums">{formatMoney(outflowTotal)}</td>
              <td></td>
            </tr>

            <tr className="font-bold border-t-2 border-white/20">
              <td className="pt-2">Net</td>
              <td colSpan={2}></td>
              <td
                className="pt-2 text-right tabular-nums"
                style={{ color: net >= 0 ? "var(--color-positive)" : "var(--color-negative)" }}
              >
                {formatSignedMoney(net)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {mode === "budgeted" && (
        <div className="mt-4 flex flex-col gap-2">
          <AddBudgetLineForm level={level} tourneyId={tourneyId} type="income" />
          <AddBudgetLineForm level={level} tourneyId={tourneyId} type="outflow" />
        </div>
      )}
    </div>
  );
}
