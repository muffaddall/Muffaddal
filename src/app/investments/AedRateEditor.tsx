"use client";

import { useActionState } from "react";
import { saveAedPerUsdRate } from "./actions";

export default function AedRateEditor({ rate }: { rate: number }) {
  const [state, formAction, pending] = useActionState(saveAedPerUsdRate, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <label className="text-sm text-[var(--color-fg-dim)]" htmlFor="rate">
        AED per USD
      </label>
      <input
        id="rate"
        name="rate"
        type="number"
        step="any"
        defaultValue={rate}
        className="w-24 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state?.error && <span className="text-xs text-[var(--color-negative)]">{state.error}</span>}
    </form>
  );
}
