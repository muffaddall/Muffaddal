"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createDegreeRequirement,
  editDegreeRequirement,
  removeDegreeRequirement,
} from "../actions";
import {
  DEGREE_REQUIREMENT_STATUSES,
  DEGREE_REQUIREMENT_STATUS_LABELS,
  type DegreeRequirementStatus,
  type EduDegreeRequirement,
} from "@/lib/types";

const inputCls =
  "rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]";

const STATUS_COLORS: Record<DegreeRequirementStatus, string> = {
  not_started: "var(--color-fg-dim)",
  in_progress: "var(--color-education)",
  completed: "var(--color-positive)",
};

export default function DegreeRequirementsList({
  requirements,
  courseOptions,
  courseNameById,
}: {
  requirements: EduDegreeRequirement[];
  courseOptions: { id: string; label: string }[];
  courseNameById: Record<string, string>;
}) {
  const byCategory = new Map<string, EduDegreeRequirement[]>();
  for (const r of requirements) {
    const key = r.category || "Uncategorized";
    const list = byCategory.get(key);
    if (list) list.push(r);
    else byCategory.set(key, [r]);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...byCategory.entries()].map(([category, reqs]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--color-education)" }}>
            {category}
          </h2>
          <ul className="flex flex-col gap-2">
            {reqs.map((r) => (
              <RequirementRow
                key={r.id}
                requirement={r}
                courseOptions={courseOptions}
                fulfilledByCourseName={r.fulfilledByCourseId ? courseNameById[r.fulfilledByCourseId] : null}
              />
            ))}
          </ul>
        </div>
      ))}
      {requirements.length === 0 && (
        <p className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
          No degree requirements yet — add one below.
        </p>
      )}

      <AddForm courseOptions={courseOptions} />
    </div>
  );
}

function RequirementRow({
  requirement,
  courseOptions,
  fulfilledByCourseName,
}: {
  requirement: EduDegreeRequirement;
  courseOptions: { id: string; label: string }[];
  fulfilledByCourseName: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await editDegreeRequirement(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);

  if (editing) {
    return (
      <li className="rounded-xl border border-white/10 bg-[var(--color-surface)] p-3">
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={requirement.id} />
          <div className="grid grid-cols-2 gap-2">
            <input name="category" defaultValue={requirement.category} placeholder="Category" className={inputCls} />
            <input name="creditHours" type="number" step="any" min={0} defaultValue={requirement.creditHours} required className={inputCls} />
          </div>
          <input name="name" defaultValue={requirement.name} placeholder="Requirement name" required className={inputCls} />
          <div className="grid grid-cols-2 gap-2">
            <select name="status" defaultValue={requirement.status} className={inputCls}>
              {DEGREE_REQUIREMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {DEGREE_REQUIREMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select name="fulfilledByCourseId" defaultValue={requirement.fulfilledByCourseId ?? ""} className={inputCls}>
              <option value="">No course linked</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={pending} className="rounded-lg bg-[var(--color-education)] text-black text-sm font-medium px-3 py-1.5 disabled:opacity-60">
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-white/10 text-sm px-3 py-1.5 hover:bg-white/5">
              Cancel
            </button>
          </div>
          {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-white/10 bg-[var(--color-surface)] p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">
          {requirement.name} <span className="text-white/40 font-normal">· {requirement.creditHours} cr</span>
        </p>
        <p className="text-xs text-[var(--color-fg-dim)] truncate">
          <span style={{ color: STATUS_COLORS[requirement.status] }}>
            {DEGREE_REQUIREMENT_STATUS_LABELS[requirement.status]}
          </span>
          {fulfilledByCourseName && ` · Fulfilled by ${fulfilledByCourseName}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-[var(--color-fg-dim)] hover:text-white/80">
          Edit
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeDegreeRequirement(requirement.id))}
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
    const result = await createDegreeRequirement(prev, formData);
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
        <span className="text-base leading-none">+</span> Add requirement
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border border-dashed border-white/15 p-3">
      <div className="grid grid-cols-2 gap-2">
        <input name="category" placeholder="Category (e.g. Major)" className={inputCls} />
        <input name="creditHours" type="number" step="any" min={0} defaultValue={3} placeholder="Credit hours" required className={inputCls} />
      </div>
      <input name="name" placeholder="Requirement name" required autoFocus className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <select name="status" defaultValue="not_started" className={inputCls}>
          {DEGREE_REQUIREMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {DEGREE_REQUIREMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select name="fulfilledByCourseId" defaultValue="" className={inputCls}>
          <option value="">No course linked</option>
          {courseOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-[var(--color-education)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60">
          {pending ? "Adding…" : "Add requirement"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 text-sm px-3 py-1.5 hover:bg-white/5">
          Cancel
        </button>
      </div>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
