"use client";

import { useActionState, useState, useTransition } from "react";
import { removeSavingsMonth, saveSavingsMonth } from "./actions";
import { formatMoney, formatMonth, monthToInputValue } from "@/lib/format";
import type { SavingsMonthComputed } from "@/lib/types";

export default function SavingsMonthRow({ row }: { row: SavingsMonthComputed }) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await saveSavingsMonth(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);

  if (editing) {
    return (
      <tr className="bg-white/5">
        <td colSpan={8} className="p-2">
          <form action={formAction} className="grid grid-cols-2 gap-2 sm:grid-cols-[8rem_10rem_8rem_8rem_8rem_auto_auto]">
            <input type="hidden" name="month" value={monthToInputValue(row.month)} />
            <span className="flex items-center text-sm text-[var(--color-fg-dim)]">
              {formatMonth(row.month)}
            </span>
            <span className="flex flex-col justify-center rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm text-[var(--color-fg-dim)]">
              {formatMoney(row.debt_paydown)}
              <span className="text-[10px] leading-tight">from Expenses</span>
            </span>
            <input
              name="big_payment"
              type="number"
              step="any"
              defaultValue={row.big_payment}
              placeholder="Big payment"
              required
              className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <input
              name="savings_kept"
              type="number"
              step="any"
              defaultValue={row.savings_kept}
              placeholder="Savings kept"
              required
              className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <input
              name="money_kept"
              type="number"
              step="any"
              defaultValue={row.money_kept}
              placeholder="Money kept"
              required
              className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
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
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[var(--color-border)] last:border-0">
      <td className="py-2 pr-3 text-sm whitespace-nowrap">{formatMonth(row.month)}</td>
      <td className="py-2 pr-3 text-sm tabular-nums">{formatMoney(row.debt_paydown)}</td>
      <td
        className="py-2 pr-3 text-sm tabular-nums"
        style={{ color: row.debt_left < 0 ? "var(--color-negative)" : "var(--color-positive)" }}
      >
        {formatMoney(row.debt_left)}
      </td>
      <td className="py-2 pr-3 text-sm tabular-nums">{formatMoney(row.big_payment)}</td>
      <td className="py-2 pr-3 text-sm tabular-nums">{formatMoney(row.savings_kept)}</td>
      <td className="py-2 pr-3 text-sm tabular-nums">{formatMoney(row.total_savings)}</td>
      <td className="py-2 pr-3 text-sm tabular-nums font-medium">{formatMoney(row.account_total)}</td>
      <td className="py-2 pl-2 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] mr-3"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeSavingsMonth(row.month))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </td>
    </tr>
  );
}
