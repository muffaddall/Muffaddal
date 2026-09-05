"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { editSemester, removeSemester } from "./actions";
import { formatDateShort } from "@/lib/date";
import { EDU_SEMESTER_STATUSES, type EduSemester } from "@/lib/types";

const STATUS_LABELS: Record<EduSemester["status"], string> = {
  current: "Current",
  past: "Past",
  upcoming: "Upcoming",
};

export default function SemesterRow({
  semester,
  courseCount,
  gpa,
}: {
  semester: EduSemester;
  courseCount: number;
  gpa: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await editSemester(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);

  if (editing) {
    return (
      <li className="rounded-xl border border-white/10 bg-[var(--color-surface)] p-3">
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={semester.id} />
          <input
            name="name"
            defaultValue={semester.name}
            required
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="startDate"
              type="date"
              defaultValue={semester.startDate}
              required
              className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
            />
            <input
              name="endDate"
              type="date"
              defaultValue={semester.endDate}
              required
              className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
            />
          </div>
          <select
            name="status"
            defaultValue={semester.status}
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
          >
            {EDU_SEMESTER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[var(--color-education)] text-black text-sm font-medium px-3 py-1.5 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-white/10 text-sm px-3 py-1.5 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
          {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-white/10 bg-[var(--color-surface)] p-3">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/education/${semester.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold truncate">{semester.name}</p>
            <span
              className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                color: semester.status === "current" ? "var(--color-education)" : "var(--color-fg-dim)",
                border: `1px solid ${semester.status === "current" ? "var(--color-education)" : "var(--color-border)"}`,
              }}
            >
              {STATUS_LABELS[semester.status]}
            </span>
          </div>
          <p className="text-xs text-[var(--color-fg-dim)]">
            {formatDateShort(semester.startDate)} – {formatDateShort(semester.endDate)} ·{" "}
            {courseCount} course{courseCount === 1 ? "" : "s"}
          </p>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-display text-xl">{gpa !== null ? gpa.toFixed(2) : "—"}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/8">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-[var(--color-fg-dim)] hover:text-white/80"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeSemester(semester.id))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
