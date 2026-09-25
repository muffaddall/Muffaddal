"use client";

import { useActionState, useRef } from "react";
import { createEquipment } from "./actions";
import { EQUIPMENT_TYPES, EQUIPMENT_TYPE_LABELS } from "@/lib/types";

export default function AddEquipmentForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createEquipment(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <input
        name="name"
        placeholder="Name (e.g. Nike Pegasus 40)"
        required
        className="min-w-0 flex-1 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <select
        name="type"
        defaultValue="shoe"
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      >
        {EQUIPMENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {EQUIPMENT_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add equipment"}
      </button>
      {state?.error && <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
