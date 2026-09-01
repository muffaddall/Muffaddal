"use client";

import { useActionState } from "react";
import { saveDefaultIncome } from "./actions";

export default function DefaultIncomeEditor({
  accountId,
  defaultIncome,
}: {
  accountId: string;
  defaultIncome: number;
}) {
  const [state, formAction, pending] = useActionState(saveDefaultIncome, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="accountId" value={accountId} />
      <label className="text-sm text-[var(--color-fg-dim)]" htmlFor="defaultIncome">
        Default income (applies to future months)
      </label>
      <input
        id="defaultIncome"
        name="income"
        type="number"
        step="any"
        defaultValue={defaultIncome}
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
