"use client";

import { useActionState } from "react";
import { saveIncome } from "./actions";

export default function IncomeEditor({
  month,
  accountId,
  income,
}: {
  month: string;
  accountId: string;
  income: number;
}) {
  const [state, formAction, pending] = useActionState(saveIncome, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="accountId" value={accountId} />
      <label className="text-sm text-[var(--color-fg-dim)]" htmlFor="income">
        Income this month
      </label>
      <input
        id="income"
        name="income"
        type="number"
        step="any"
        defaultValue={income}
        className="w-28 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
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
