"use client";

import { useActionState, useState, useTransition } from "react";
import { editExpense, removeExpense } from "./actions";
import { CATEGORY_LABELS, EXPENSE_CATEGORIES, type Currency, type ExpenseEntry } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import CategoryBadge from "@/components/CategoryBadge";

export default function ExpenseRow({
  entry,
  currency,
}: {
  entry: ExpenseEntry;
  currency?: Currency;
}) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await editExpense(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);

  if (editing) {
    return (
      <li className="grid grid-cols-2 gap-2 rounded-lg bg-white/5 p-2 sm:grid-cols-[5rem_1fr_7rem_10rem_auto_auto]">
        <form
          action={formAction}
          className="contents"
        >
          <input type="hidden" name="id" value={entry.id} />
          <input
            name="date_label"
            defaultValue={entry.date_label}
            className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <input
            name="name"
            defaultValue={entry.name}
            required
            className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <input
            name="amount"
            type="number"
            step="any"
            defaultValue={entry.amount}
            required
            className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <select
            name="category"
            defaultValue={entry.category}
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
            className="rounded-lg bg-[var(--color-accent)] text-black text-sm px-3 py-1.5 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border border-[var(--color-border)] text-sm px-3 py-1.5 hover:bg-white/5"
        >
          Cancel
        </button>
        {state?.error && (
          <p className="col-span-full text-xs text-[var(--color-negative)]">{state.error}</p>
        )}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-10 shrink-0 text-xs text-[var(--color-fg-dim)]">
          {entry.date_label}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm">{entry.name}</p>
          <CategoryBadge category={entry.category} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm tabular-nums">{formatMoney(entry.amount, currency)}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-[var(--color-fg-dim)] hover:text-[var(--color-fg)]"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeExpense(entry.id))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
