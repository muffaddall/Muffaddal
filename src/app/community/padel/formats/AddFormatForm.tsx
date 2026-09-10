"use client";

import { useActionState, useRef } from "react";
import { createFormatAction } from "./actions";

const inputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

export default function AddFormatForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createFormatAction(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <input name="name" placeholder="Format name (e.g. 4 Groups of 4)" required className={`${inputCls} min-w-0 flex-1`} />
      <input
        name="numGroups"
        type="number"
        min={2}
        step={1}
        placeholder="Groups"
        required
        className={`${inputCls} w-20`}
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-[var(--color-community)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "+ Add Format"}
      </button>
      {state?.error && <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
