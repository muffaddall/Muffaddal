"use client";

import { useActionState, useState, useTransition } from "react";
import { editBpfPurchase, removeBpfPurchase, toggleBpfPurchasePaid } from "./actions";
import { formatMoney } from "@/lib/format";
import type { BpfPurchase } from "@/lib/types";

export default function BpfPurchaseRow({ purchase }: { purchase: BpfPurchase }) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [isTogglingPaid, startTogglePaid] = useTransition();
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await editBpfPurchase(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);

  if (editing) {
    return (
      <li className="rounded-lg bg-white/5 p-2">
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={purchase.id} />
          <input
            name="name"
            defaultValue={purchase.name}
            required
            className="min-w-0 flex-1 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <input
            name="amount"
            type="number"
            step="any"
            defaultValue={purchase.amount}
            required
            className="w-28 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <label className="flex items-center gap-1.5 text-xs text-[var(--color-fg-dim)] cursor-pointer">
            <input
              type="checkbox"
              name="planned"
              defaultChecked={!purchase.paid}
              className="h-3.5 w-3.5 accent-[var(--color-accent)]"
            />
            Planned
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[var(--color-accent)] text-black text-sm px-3 py-1.5 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-[var(--color-border)] text-sm px-3 py-1.5 hover:bg-white/5"
          >
            Cancel
          </button>
        </form>
        {state?.error && <p className="text-xs text-[var(--color-negative)] mt-1">{state.error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <label className="flex shrink-0 items-center" title={purchase.paid ? "Paid" : "Mark as paid"}>
          <input
            type="checkbox"
            checked={purchase.paid}
            disabled={isTogglingPaid}
            onChange={(e) => {
              const paid = e.target.checked;
              startTogglePaid(() => toggleBpfPurchasePaid(purchase.id, paid));
            }}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
        </label>
        <span className="text-sm truncate">{purchase.name}</span>
        {!purchase.paid && (
          <span className="shrink-0 rounded-full border border-[var(--color-accent)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-accent)]">
            Planned
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className="text-sm tabular-nums"
          style={{ color: purchase.paid ? "var(--color-negative)" : "var(--color-fg-dim)" }}
        >
          {formatMoney(purchase.amount)}
        </span>
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
          onClick={() => startDelete(() => removeBpfPurchase(purchase.id))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
