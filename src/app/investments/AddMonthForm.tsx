"use client";

import { useActionState, useRef } from "react";
import { saveInvestmentMonth } from "./actions";
import { currentMonth, monthToInputValue } from "@/lib/format";

export default function AddMonthForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await saveInvestmentMonth(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-2 gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3 sm:grid-cols-[10rem_10rem_10rem_auto]"
    >
      <input
        name="month"
        type="month"
        required
        defaultValue={monthToInputValue(currentMonth())}
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <input
        name="contribution"
        type="number"
        step="any"
        placeholder="Contribution"
        required
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <input
        name="portfolio_value_eom"
        type="number"
        step="any"
        placeholder="Portfolio value (optional)"
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60 col-span-2 sm:col-span-1"
      >
        {pending ? "Saving…" : "Save month"}
      </button>
      {state?.error && (
        <p className="col-span-full text-xs text-[var(--color-negative)]">{state.error}</p>
      )}
    </form>
  );
}
