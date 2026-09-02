"use client";

import { useActionState } from "react";
import { saveBaseline } from "./actions";
import type { PadelBaseline } from "@/lib/types";

export default function PadelBaselineEditor({ baseline }: { baseline: PadelBaseline }) {
  const [state, formAction, pending] = useActionState(saveBaseline, undefined);

  return (
    <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
          Edit history before this page (Sept 2024 baseline)
        </span>
        <span className="text-xs text-[var(--color-fg-dim)]">▾</span>
      </summary>
      <form action={formAction} className="flex flex-col gap-3 px-4 pb-4">
        <p className="text-xs text-[var(--color-fg-dim)]">
          Lump totals from before games/tournaments were logged individually — added on top of
          whatever&apos;s actually logged in Day-to-Day from here on.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Games played" name="games" defaultValue={baseline.games} />
          <Field label="Spent (AED)" name="spent" defaultValue={baseline.spent} />
          <Field label="Winnings (AED)" name="income" defaultValue={baseline.income} />
          <Field label="Tournaments" name="tournaments" defaultValue={baseline.tournaments} />
          <Field label="Wins" name="wins" defaultValue={baseline.wins} />
          <Field label="Runner-up" name="runnersUp" defaultValue={baseline.runnersUp} />
          <Field label="Reached knockouts" name="knockouts" defaultValue={baseline.knockouts} />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          {state?.error && <span className="text-xs text-[var(--color-negative)]">{state.error}</span>}
        </div>
      </form>
    </details>
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
    <label className="flex flex-col gap-1">
      <span className="text-xs text-[var(--color-fg-dim)]">{label}</span>
      <input
        name={name}
        type="number"
        step="any"
        defaultValue={defaultValue}
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
    </label>
  );
}
