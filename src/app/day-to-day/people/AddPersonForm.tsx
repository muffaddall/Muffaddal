"use client";

import { useActionState, useRef } from "react";
import { createPerson } from "./actions";

export default function AddPersonForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createPerson(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input
        name="name"
        type="text"
        placeholder="Add a person"
        required
        className="flex-1 rounded-lg bg-white/5 border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
