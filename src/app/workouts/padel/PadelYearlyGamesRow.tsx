"use client";

import { useActionState, useTransition } from "react";
import { removeYearlyGames, saveYearlyGames } from "./actions";
import type { PadelYearlyGames } from "@/lib/types";

export default function PadelYearlyGamesRow({ row }: { row: PadelYearlyGames }) {
  const [isDeleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState(saveYearlyGames, undefined);

  return (
    <li className="flex items-center gap-2">
      <form action={formAction} className="flex flex-1 items-center gap-2">
        <input type="hidden" name="year" value={row.year} />
        <span className="w-14 shrink-0 text-sm text-[var(--color-fg-dim)]">{row.year}</span>
        <input
          name="games"
          type="number"
          step="1"
          defaultValue={row.games}
          className="w-24 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-[var(--color-border)] text-xs px-2.5 py-1.5 hover:bg-white/5 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state?.error && <span className="text-xs text-[var(--color-negative)]">{state.error}</span>}
      </form>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDelete(() => removeYearlyGames(row.year))}
        className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isDeleting ? "…" : "Delete"}
      </button>
    </li>
  );
}
