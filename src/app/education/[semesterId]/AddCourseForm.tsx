"use client";

import { useActionState, useRef, useState } from "react";
import { createCourse } from "../actions";

export default function AddCourseForm({ semesterId }: { semesterId: string }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createCourse(prev, formData);
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
        className="flex items-center gap-1 rounded-full bg-[var(--color-education)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
      >
        <span className="text-base leading-none">+</span> Add course
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-white/15 p-3"
    >
      <input type="hidden" name="semesterId" value={semesterId} />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="name"
          placeholder="Course name"
          required
          autoFocus
          className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
        />
        <input
          name="courseCode"
          placeholder="Code (e.g. CVE 301)"
          className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="creditHours"
          type="number"
          step="any"
          min={0}
          defaultValue={3}
          placeholder="Credit hours"
          required
          className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
        />
        <input
          name="instructor"
          placeholder="Instructor (optional)"
          className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
        />
      </div>
      <input
        name="room"
        placeholder="Room / building (optional)"
        className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-education)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add course"}
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
