"use client";

import { useActionState, useRef, useState } from "react";
import { createSavingsPurchase } from "./actions";

export default function AddSavingsPurchaseForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [planned, setPlanned] = useState(false);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createSavingsPurchase(prev, formData);
    if (!result) {
      formRef.current?.reset();
      setPlanned(false);
    }
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
        placeholder="What did you buy?"
        required
        className="min-w-0 flex-1 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <input
        name="amount"
        type="number"
        step="any"
        placeholder="Amount"
        required
        className="w-32 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <label className="flex items-center gap-1.5 text-xs text-[var(--color-fg-dim)] cursor-pointer">
        <input
          type="checkbox"
          name="planned"
          checked={planned}
          onChange={(e) => setPlanned(e.target.checked)}
          className="h-3.5 w-3.5 accent-[var(--color-accent)]"
        />
        Future planned purchase
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Adding…" : planned ? "Add planned purchase" : "Add savings expense"}
      </button>
      {state?.error && <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
