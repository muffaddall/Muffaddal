"use client";

import { useState, useTransition } from "react";
import { deleteBudgetLineAction, updateBudgetLineAction } from "./actions";
import type { TourneyBudgetLine, TourneyLevel } from "@/lib/types";

const inputCls =
  "w-24 rounded-lg bg-white/5 border border-[var(--color-border)] px-2 py-1 text-sm text-right outline-none focus:border-[var(--color-community)]";

export default function BudgetLineRow({
  level,
  tourneyId,
  line,
}: {
  level: TourneyLevel;
  tourneyId: string;
  line: TourneyBudgetLine;
}) {
  const [budgeted, setBudgeted] = useState(String(line.budgetedAmount));
  const [actual, setActual] = useState(String(line.actualAmount));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const save = () => {
    const b = Number(budgeted);
    const a = Number(actual);
    if (!Number.isFinite(b) || !Number.isFinite(a)) {
      setError("Enter valid amounts.");
      return;
    }
    setError(null);
    startSave(async () => {
      const result = await updateBudgetLineAction(line.id, level, tourneyId, b, a);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-[var(--color-surface)] border border-white/8 p-3" data-testid="budget-line-row">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium truncate">{line.name}</span>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => deleteBudgetLineAction(line.id, level, tourneyId))}
          className="shrink-0 text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-white/60">
          Budgeted
          <input value={budgeted} onChange={(e) => setBudgeted(e.target.value)} type="number" step="any" className={inputCls} />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-white/60">
          Actual
          <input value={actual} onChange={(e) => setActual(e.target.value)} type="number" step="any" className={inputCls} />
        </label>
        <button
          type="button"
          disabled={isSaving}
          onClick={save}
          className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-white/70 hover:bg-white/5 disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-xs text-[var(--color-negative)]">{error}</p>}
    </div>
  );
}
