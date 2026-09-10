"use client";

import { useActionState } from "react";
import { createTourneyAction } from "./actions";
import { todayStr } from "@/lib/date";
import type { TourneyLevel } from "@/lib/types";

const inputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

export default function CreateTourneyForm({ level }: { level: TourneyLevel }) {
  const [state, formAction, pending] = useActionState(createTourneyAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3">
      <input type="hidden" name="level" value={level} />
      <input name="name" placeholder="Tournament name" required className={inputCls} />
      <input name="date" type="date" required defaultValue={todayStr()} className={inputCls} />
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
