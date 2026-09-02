"use client";

import { useActionState, useRef } from "react";
import { saveYearlyGames } from "./actions";

export default function AddPadelYearForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await saveYearlyGames(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input
        name="year"
        type="number"
        step="1"
        placeholder="Year"
        required
        className="w-20 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <input
        name="games"
        type="number"
        step="1"
        placeholder="Games"
        required
        className="w-24 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-[var(--color-border)] text-xs px-2.5 py-1.5 hover:bg-white/5 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add year"}
      </button>
      {state?.error && <span className="text-xs text-[var(--color-negative)]">{state.error}</span>}
    </form>
  );
}
