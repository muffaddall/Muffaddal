"use client";

import { useActionState, useRef } from "react";
import { createReceivable } from "./actions";
import type { Person } from "@/lib/types";

const inputClass =
  "w-full rounded-lg bg-white/5 border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]";

export default function AddSplitForm({
  transactionId,
  people,
  remaining,
}: {
  transactionId: string;
  people: Person[];
  remaining: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = createReceivable.bind(null, transactionId);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await boundAction(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <p className="text-xs text-[var(--color-fg-dim)]">
        {remaining.toFixed(2)} left to split
      </p>
      <div className="grid grid-cols-2 gap-2">
        <select name="personId" defaultValue="" className={inputClass}>
          <option value="">Select person</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input name="newPersonName" type="text" placeholder="or add new person" className={inputClass} />
      </div>
      <input
        name="amount"
        type="number"
        step="any"
        min="0"
        required
        placeholder="Amount owed"
        className={inputClass}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add split"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
