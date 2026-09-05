"use client";

import { useActionState, useRef } from "react";
import { createSemester } from "./actions";
import { EDU_SEMESTER_STATUSES, type EduSemesterStatus } from "@/lib/types";

const STATUS_LABELS: Record<EduSemesterStatus, string> = {
  current: "Current",
  past: "Past",
  upcoming: "Upcoming",
};

export default function AddSemesterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createSemester(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-white/15 p-3"
    >
      <input
        name="name"
        placeholder="Semester name (e.g. Fall 2026)"
        required
        className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-white/40">Start</span>
          <input
            name="startDate"
            type="date"
            required
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-white/40">End</span>
          <input
            name="endDate"
            type="date"
            required
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
          />
        </label>
      </div>
      <select
        name="status"
        defaultValue="upcoming"
        className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
      >
        {EDU_SEMESTER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-education)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add semester"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
