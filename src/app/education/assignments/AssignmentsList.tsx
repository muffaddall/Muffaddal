"use client";

import { useActionState, useState, useTransition } from "react";
import { createAssignment, removeAssignment, toggleAssignmentStatus } from "../actions";
import {
  ASSIGNMENT_STATUS_LABELS,
  type AssignmentStatus,
  type EduAssignment,
} from "@/lib/types";
import { formatDateShort, todayStr } from "@/lib/date";

const inputCls =
  "rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]";

const STATUS_COLORS: Record<AssignmentStatus, string> = {
  not_started: "var(--color-fg-dim)",
  in_progress: "var(--color-education)",
  done: "var(--color-positive)",
};

function nextStatus(status: AssignmentStatus): AssignmentStatus {
  if (status === "not_started") return "in_progress";
  if (status === "in_progress") return "done";
  return "not_started";
}

export default function AssignmentsList({
  assignments,
  courseNameById,
  courseOptions,
}: {
  assignments: EduAssignment[];
  courseNameById: Record<string, string>;
  courseOptions: { id: string; label: string }[];
}) {
  const today = todayStr();

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {assignments.map((a) => (
          <Row key={a.id} assignment={a} courseName={courseNameById[a.courseId] ?? ""} overdue={a.status !== "done" && a.dueDate < today} />
        ))}
        {assignments.length === 0 && (
          <li className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
            No assignments logged yet — add one below, or from a course page.
          </li>
        )}
      </ul>
      <AddForm courseOptions={courseOptions} />
    </div>
  );
}

function Row({ assignment, courseName, overdue }: { assignment: EduAssignment; courseName: string; overdue: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  return (
    <li className="rounded-xl border border-white/10 bg-[var(--color-surface)] p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{assignment.title}</p>
        <p className="text-xs text-[var(--color-fg-dim)] truncate">
          {courseName}
          {" · "}
          <span style={{ color: overdue ? "var(--color-negative)" : undefined }}>
            Due {formatDateShort(assignment.dueDate)}
            {overdue ? " (overdue)" : ""}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => toggleAssignmentStatus(assignment.id, nextStatus(assignment.status)))}
          className="text-xs font-medium rounded-full px-2 py-1 border"
          style={{ color: STATUS_COLORS[assignment.status], borderColor: STATUS_COLORS[assignment.status] }}
        >
          {ASSIGNMENT_STATUS_LABELS[assignment.status]}
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeAssignment(assignment.id))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}

function AddForm({ courseOptions }: { courseOptions: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createAssignment(prev, formData);
    if (!result) setOpen(false);
    return result;
  }, undefined);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 self-start rounded-full bg-[var(--color-education)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
      >
        <span className="text-base leading-none">+</span> Add assignment
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border border-dashed border-white/15 p-3">
      <select name="courseId" required defaultValue="" className={inputCls}>
        <option value="" disabled>
          Pick a course
        </option>
        {courseOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        <input name="title" placeholder="Title" required autoFocus className={`${inputCls} flex-1 min-w-32`} />
        <input name="dueDate" type="date" required className={inputCls} />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-[var(--color-education)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60">
          {pending ? "Adding…" : "Add assignment"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 text-sm px-3 py-1.5 hover:bg-white/5">
          Cancel
        </button>
      </div>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
