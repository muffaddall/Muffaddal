"use client";

import { useActionState, useRef } from "react";
import { createCategory } from "./actions";
import type { DdCategoryKind } from "@/lib/types";

export default function AddCategoryForm({
  kind,
  parentId,
  label,
  onDone,
}: {
  kind: DdCategoryKind;
  parentId: string | null;
  label: string;
  onDone?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createCategory(prev, formData);
    if (!result) {
      formRef.current?.reset();
      onDone?.();
    }
    return result;
  }, undefined);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="parentId" value={parentId ?? ""} />
      <input
        name="name"
        placeholder={label}
        required
        className="min-w-0 flex-1 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-[var(--color-accent)] text-black text-sm font-medium px-3 py-1.5 disabled:opacity-60"
      >
        {pending ? "…" : "Add"}
      </button>
      {state?.error && (
        <p className="text-xs text-[var(--color-negative)] shrink-0">{state.error}</p>
      )}
    </form>
  );
}
