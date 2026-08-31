"use client";

import { useActionState, useState, useTransition } from "react";
import { editMoneyInflux, removeMoneyInflux } from "./actions";
import { formatMoney } from "@/lib/format";
import type { MoneyInflux } from "@/lib/types";

export default function MoneyInfluxRow({ influx }: { influx: MoneyInflux }) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await editMoneyInflux(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);

  if (editing) {
    return (
      <li className="rounded-lg bg-white/5 p-2">
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={influx.id} />
          <input
            name="name"
            defaultValue={influx.name}
            required
            className="min-w-0 flex-1 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <input
            name="amount"
            type="number"
            step="any"
            defaultValue={influx.amount}
            required
            className="w-28 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <select
            name="destination"
            defaultValue={influx.destination}
            className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          >
            <option value="savings">Savings</option>
            <option value="bpf">Big Purchase Fund</option>
          </select>
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
      <div className="min-w-0">
        <p className="text-sm truncate">{influx.name}</p>
        <p className="text-xs text-[var(--color-fg-dim)]">
          {influx.destination === "savings" ? "Savings" : "Big Purchase Fund"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm tabular-nums text-[var(--color-positive)]">
          +{formatMoney(influx.amount)}
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
          onClick={() => startDelete(() => removeMoneyInflux(influx.id))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
