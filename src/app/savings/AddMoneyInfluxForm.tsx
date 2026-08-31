"use client";

import { useActionState, useRef } from "react";
import { createMoneyInflux } from "./actions";

export default function AddMoneyInfluxForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createMoneyInflux(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <input
        name="name"
        placeholder="Where'd it come from?"
        required
        className="min-w-0 flex-1 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <input
        name="amount"
        type="number"
        step="any"
        min="0"
        placeholder="Amount"
        required
        className="w-32 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <select
        name="destination"
        defaultValue="savings"
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      >
        <option value="savings">Add to Savings</option>
        <option value="bpf">Add to Big Purchase Fund</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add money"}
      </button>
      {state?.error && <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
