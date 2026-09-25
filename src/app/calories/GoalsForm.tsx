"use client";

import { useActionState } from "react";
import { saveCalorieGoals } from "./actions";
import type { CalorieGoals } from "@/lib/types";

export default function GoalsForm({ goals }: { goals: CalorieGoals }) {
  const [state, formAction, pending] = useActionState(saveCalorieGoals, undefined);

  return (
    <form
      action={formAction}
      className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-fitness)" }}>
        Daily goals
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <GoalField label="Calories" name="calories" unit="kcal" defaultValue={goals.calories} />
        <GoalField label="Calories burnt" name="burned" unit="kcal" defaultValue={goals.burned} />
        <GoalField label="Protein" name="protein" unit="g" defaultValue={goals.protein} />
        <GoalField label="Carbs" name="carbs" unit="g" defaultValue={goals.carbs} />
        <GoalField label="Fat" name="fat" unit="g" defaultValue={goals.fat} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save goals"}
      </button>
      {state?.error && <p className="mt-2 text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}

function GoalField({
  label,
  name,
  unit,
  defaultValue,
}: {
  label: string;
  name: string;
  unit: string;
  defaultValue: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-white/50">
        {label} <span className="text-white/30">({unit})</span>
      </span>
      <input
        name={name}
        type="number"
        step="any"
        min={0}
        defaultValue={defaultValue}
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
    </label>
  );
}
