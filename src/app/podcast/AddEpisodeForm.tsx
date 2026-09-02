"use client";

import { useActionState, useRef, useState } from "react";
import { createEpisode } from "./actions";

export default function AddEpisodeForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createEpisode(prev, formData);
    if (!result) {
      formRef.current?.reset();
      setOpen(false);
    }
    return result;
  }, undefined);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
      >
        <span className="text-base leading-none">+</span> New Episode
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-white/15 p-3"
    >
      <input
        name="name"
        placeholder="Episode name"
        required
        autoFocus
        className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-shoot)]"
      />
      <textarea
        name="idea"
        placeholder="Idea / notes (optional)"
        rows={2}
        className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-shoot)] resize-none"
      />
      <div className="grid grid-cols-3 gap-2">
        <DateField label="Shoot" name="shootDate" />
        <DateField label="Edit" name="editDate" />
        <DateField label="Post" name="postDate" />
      </div>
      <p className="text-[11px] text-white/40">
        Leave dates blank to save it as an idea — set a shoot date any time to move it into the
        schedule below.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-post)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add episode"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/10 text-sm px-3 py-1.5 hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}

function DateField({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-white/40">{label}</span>
      <input
        name={name}
        type="date"
        className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs outline-none focus:border-[var(--color-shoot)]"
      />
    </label>
  );
}
