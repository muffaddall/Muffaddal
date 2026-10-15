"use client";

import { useActionState, useState, useTransition } from "react";
import { editTripTransaction, removeTripTransaction } from "./actions";
import { formatTripMoney } from "@/lib/format";
import { TRIP_EXPENSE_CATEGORIES } from "@/lib/types";
import type { TripTransaction } from "@/lib/types";

const editInputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]";

export default function TripTransactionRow({
  tx,
  walletCurrency,
  toWalletCurrency,
}: {
  tx: TripTransaction;
  walletCurrency: string;
  toWalletCurrency: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await editTripTransaction(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);

  if (editing) {
    return (
      <div className="rounded-lg bg-white/5 p-2">
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={tx.id} />
          <input type="hidden" name="tripId" value={tx.tripId} />
          <input
            name="date"
            type="date"
            defaultValue={tx.date}
            required
            className={editInputCls}
          />
          <input
            name="amount"
            type="number"
            step="any"
            defaultValue={tx.amount}
            required
            className={`${editInputCls} w-28`}
          />
          {tx.type === "transfer" && (
            <input
              name="toAmount"
              type="number"
              step="any"
              defaultValue={tx.toAmount ?? undefined}
              required
              className={`${editInputCls} w-28`}
            />
          )}
          {tx.type === "expense" && (
            <select name="category" defaultValue={tx.category ?? ""} className={editInputCls}>
              {TRIP_EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <input
            name="note"
            defaultValue={tx.note}
            placeholder="Note"
            className={`${editInputCls} min-w-0 flex-1`}
          />
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
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">
          {tx.type === "transfer"
            ? `Converted ${walletCurrency} → ${toWalletCurrency}`
            : tx.type === "income"
              ? "Cash added"
              : tx.category}
        </p>
        <p className="text-xs text-[var(--color-fg-dim)] truncate">
          {[tx.note, tx.linkedAccountId ? "Linked to account" : null].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className="text-sm tabular-nums"
          style={{
            color:
              tx.type === "expense"
                ? "var(--color-negative)"
                : tx.type === "income"
                  ? "var(--color-positive)"
                  : undefined,
          }}
        >
          {tx.type === "transfer"
            ? `${formatTripMoney(tx.amount, walletCurrency)} → ${formatTripMoney(tx.toAmount, toWalletCurrency ?? walletCurrency)}`
            : `${tx.type === "expense" ? "-" : "+"}${formatTripMoney(tx.amount, walletCurrency)}`}
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
          onClick={() => startDelete(() => removeTripTransaction(tx.id, tx.tripId))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
