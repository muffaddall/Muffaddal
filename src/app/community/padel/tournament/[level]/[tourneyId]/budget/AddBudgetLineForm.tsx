"use client";

import { useActionState, useRef } from "react";
import { addBudgetLineAction } from "./actions";
import type { TourneyBudgetLineType, TourneyLevel } from "@/lib/types";

const inputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

export default function AddBudgetLineForm({
  level,
  tourneyId,
  type,
}: {
  level: TourneyLevel;
  tourneyId: string;
  type: TourneyBudgetLineType;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await addBudgetLineAction(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <input type="hidden" name="tourneyId" value={tourneyId} />
      <input type="hidden" name="level" value={level} />
      <input type="hidden" name="type" value={type} />
      <input name="name" placeholder="Name" required className={`${inputCls} min-w-0 flex-1`} />
      <input
        name="budgetedUnits"
        type="number"
        step="any"
        min={0}
        placeholder="Units"
        defaultValue={1}
        required
        className={`${inputCls} w-20`}
      />
      <input
        name="budgetedUnitCost"
        type="number"
        step="any"
        min={0}
        placeholder="Unit cost"
        required
        className={`${inputCls} w-24`}
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-[var(--color-community)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Adding…" : "+ Add"}
      </button>
      {state?.error && <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
