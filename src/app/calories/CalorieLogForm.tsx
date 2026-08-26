"use client";

import { useActionState } from "react";
import { saveCalorieLog } from "./actions";
import type { CalorieLog } from "@/lib/types";

export default function CalorieLogForm({
  date,
  log,
}: {
  date: string;
  log: CalorieLog | null;
}) {
  const [state, formAction, pending] = useActionState(saveCalorieLog, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <input type="hidden" name="date" value={date} />
      <Field label="Breakfast" name="breakfast" defaultValue={log?.breakfast ?? 0} />
      <Field label="Lunch" name="lunch" defaultValue={log?.lunch ?? 0} />
      <Field label="Dinner" name="dinner" defaultValue={log?.dinner ?? 0} />
      <Field label="Snacks" name="snacks" defaultValue={log?.snacks ?? 0} />
      <div className="border-t border-[var(--color-border)] pt-3">
        <Field label="Calories burned" name="burned" defaultValue={log?.burned ?? 0} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save day"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/70">{label}</span>
      <input
        name={name}
        type="number"
        step="any"
        min={0}
        defaultValue={defaultValue}
        className="w-28 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm text-right outline-none focus:border-[var(--color-accent)]"
      />
    </label>
  );
}
