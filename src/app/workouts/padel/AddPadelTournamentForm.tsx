"use client";

import { useActionState, useRef } from "react";
import { savePadelTournament } from "./actions";
import { ResultSelect } from "./PadelTournamentRow";

const inputClass =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]";

export default function AddPadelTournamentForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await savePadelTournament(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <input name="name" placeholder="Tournament name" required className={`min-w-0 flex-1 ${inputClass}`} />
      <input name="date" type="date" className={inputClass} />
      <input name="entryFee" type="number" step="any" placeholder="Entry fee" className={`w-28 ${inputClass}`} />
      <ResultSelect defaultValue="" />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add tournament"}
      </button>
      {state?.error && <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
