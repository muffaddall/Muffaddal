"use client";

import { useActionState } from "react";
import { createTourneyAction } from "./actions";
import { todayStr } from "@/lib/date";
import type { Tourney, TourneyLevel } from "@/lib/types";

const inputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

export default function CreateTourneyForm({ level, pastTourneys }: { level: TourneyLevel; pastTourneys: Tourney[] }) {
  const [state, formAction, pending] = useActionState(createTourneyAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3">
      <input type="hidden" name="level" value={level} />
      <input name="name" placeholder="Tournament name" required className={inputCls} />
      <input name="date" type="date" required defaultValue={todayStr()} className={inputCls} />
      {pastTourneys.length > 0 && (
        <label className="flex flex-col gap-1 text-xs text-white/60">
          Copy budget from (optional)
          <select name="copyBudgetFromId" defaultValue="" className={inputCls}>
            <option value="">Don&apos;t copy — start blank</option>
            {pastTourneys.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-community)] text-black font-medium px-3 py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Creating…" : "+ New Tournament"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
