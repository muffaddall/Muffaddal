"use client";

import { useActionState, useRef } from "react";
import { createNote } from "./actions";

export default function AddNoteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createNote(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3">
      <textarea
        name="body"
        placeholder="Write anything…"
        rows={3}
        required
        className="w-full rounded-lg bg-white/5 border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] resize-y"
      />
      <button
        type="submit"
        disabled={pending}
        className="self-end rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "+ Add Note"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
