"use client";

import { useActionState, useState, useTransition } from "react";
import { createAssignment, removeAssignment, toggleAssignmentStatus } from "../actions";
import { ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUSES, type AssignmentStatus, type EduAssignment } from "@/lib/types";
import { formatDateShort } from "@/lib/date";

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

export default function AssignmentsPanel({
  courseId,
  semesterId,
  assignments,
}: {
  courseId: string;
  semesterId: string;
  assignments: EduAssignment[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5">
        {assignments.map((a) => (
          <AssignmentRow key={a.id} assignment={a} />
        ))}
        {assignments.length === 0 && (
          <p className="text-sm text-[var(--color-fg-dim)]">No assignments logged for this course yet.</p>
        )}
      </ul>
      <AddAssignmentForm courseId={courseId} semesterId={semesterId} />
    </div>
  );
}

function AssignmentRow({ assignment }: { assignment: EduAssignment }) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <div className="min-w-0">
        <p className="truncate">{assignment.title}</p>
        <p className="text-xs text-[var(--color-fg-dim)]">Due {formatDateShort(assignment.dueDate)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => toggleAssignmentStatus(assignment.id, nextStatus(assignment.status)))
          }
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

function AddAssignmentForm({ courseId, semesterId }: { courseId: string; semesterId: string }) {
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
        className="self-start text-xs text-[var(--color-education)] hover:opacity-80"
      >
        + Add assignment
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="semesterId" value={semesterId} />
      <div className="flex flex-wrap gap-2">
        <input name="title" placeholder="Title" required autoFocus className={`${inputCls} flex-1 min-w-32`} />
        <input name="dueDate" type="date" required className={inputCls} />
      </div>
      <input name="description" placeholder="Description (optional)" className={inputCls} />
      <div className="flex items-center gap-2">
        <select name="status" defaultValue="not_started" className={inputCls}>
          {ASSIGNMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ASSIGNMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-education)] text-black text-xs font-medium px-2.5 py-1.5 disabled:opacity-60"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/10 text-xs px-2.5 py-1.5 hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
