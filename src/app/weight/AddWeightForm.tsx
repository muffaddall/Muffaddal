"use client";

import { useActionState, useRef } from "react";
import { createWeightLog } from "./actions";
import { todayStr } from "@/lib/date";

export default function AddWeightForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createWeightLog(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-2 gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3 sm:grid-cols-[9rem_7rem_8rem_auto]"
    >
      <input
        name="date"
        type="date"
        required
        defaultValue={todayStr()}
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <input
        name="time"
        type="time"
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <input
        name="weight"
        type="number"
        step="any"
        placeholder="Weight (kg)"
        required
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60 col-span-2 sm:col-span-1"
      >
        {pending ? "Saving…" : "Add entry"}
      </button>
      {state?.error && (
        <p className="col-span-full text-xs text-[var(--color-negative)]">{state.error}</p>
      )}
    </form>
  );
}
