"use client";

import { useActionState, useRef } from "react";
import { createExpense } from "./actions";
import { CATEGORY_LABELS, EXPENSE_CATEGORIES } from "@/lib/types";

export default function AddExpenseForm({ month }: { month: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createExpense(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-2 gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3 sm:grid-cols-[5rem_1fr_7rem_10rem_auto]"
    >
      <input type="hidden" name="month" value={month} />
      <input
        name="date_label"
        placeholder="1st"
        defaultValue="1st"
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <input
        name="name"
        placeholder="Expense name"
        required
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)] col-span-1"
      />
      <input
        name="amount"
        type="number"
        step="any"
        placeholder="Amount"
        required
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <select
        name="category"
        defaultValue="recurring"
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      >
        {EXPENSE_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {CATEGORY_LABELS[cat]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60 col-span-2 sm:col-span-1"
      >
        {pending ? "Adding…" : "Add expense"}
      </button>
      {state?.error && (
        <p className="col-span-full text-xs text-[var(--color-negative)]">{state.error}</p>
      )}
    </form>
  );
}
