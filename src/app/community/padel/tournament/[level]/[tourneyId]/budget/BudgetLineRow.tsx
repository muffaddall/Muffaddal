"use client";

import { useState, useTransition } from "react";
import { deleteBudgetLineAction, updateBudgetLineActualAction, updateBudgetLineBudgetedAction } from "./actions";
import { formatMoney } from "@/lib/format";
import type { TourneyBudgetLine, TourneyLevel } from "@/lib/types";

const inputCls =
  "w-16 rounded-lg bg-white/5 border border-[var(--color-border)] px-1.5 py-1 text-xs text-right outline-none focus:border-[var(--color-community)]";

export default function BudgetLineRow({
  level,
  tourneyId,
  line,
  mode,
  showDelete,
}: {
  level: TourneyLevel;
  tourneyId: string;
  line: TourneyBudgetLine;
  mode: "budgeted" | "actual";
  showDelete: boolean;
}) {
  const [units, setUnits] = useState(String(mode === "budgeted" ? line.budgetedUnits : line.actualUnits));
  const [unitCost, setUnitCost] = useState(String(mode === "budgeted" ? line.budgetedUnitCost : line.actualUnitCost));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const unitsNum = Number(units);
  const costNum = Number(unitCost);
  const total = Number.isFinite(unitsNum) && Number.isFinite(costNum) ? unitsNum * costNum : 0;

  const save = () => {
    if (!Number.isFinite(unitsNum) || !Number.isFinite(costNum)) {
      setError("Enter valid numbers.");
      return;
    }
    setError(null);
    startSave(async () => {
      const action = mode === "budgeted" ? updateBudgetLineBudgetedAction : updateBudgetLineActualAction;
      const result = await action(line.id, level, tourneyId, unitsNum, costNum);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <tr data-testid={`budget-line-row-${mode}`}>
      <td className="py-1.5 pr-2 text-sm truncate max-w-[6rem] sm:max-w-none">{line.name}</td>
      <td className="py-1.5 px-1">
        <input value={units} onChange={(e) => setUnits(e.target.value)} type="number" step="any" className={inputCls} />
      </td>
      <td className="py-1.5 px-1">
        <input value={unitCost} onChange={(e) => setUnitCost(e.target.value)} type="number" step="any" className={inputCls} />
      </td>
      <td className="py-1.5 pl-1 text-right text-sm tabular-nums whitespace-nowrap">{formatMoney(total)}</td>
      <td className="py-1.5 pl-2 text-right whitespace-nowrap">
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={save}
              className="text-xs text-white/60 hover:text-white/90 disabled:opacity-60"
            >
              {isSaving ? "…" : "Save"}
            </button>
            {showDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => startDelete(() => deleteBudgetLineAction(line.id, level, tourneyId))}
                className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
              >
                {isDeleting ? "…" : "Delete"}
              </button>
            )}
          </div>
          {error && <span className="text-[10px] text-[var(--color-negative)]">{error}</span>}
        </div>
      </td>
    </tr>
  );
}
