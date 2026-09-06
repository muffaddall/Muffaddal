"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createGradeCategory,
  createGradeEntry,
  editGradeCategory,
  removeGradeCategory,
  removeGradeEntry,
} from "../actions";
import {
  categoryPercent,
  computeCourseGrade,
  scoreNeededForTarget,
  type EduGradeCategory,
  type EduGradeEntry,
} from "@/lib/types";

type CategoryWithEntries = EduGradeCategory & { entries: EduGradeEntry[] };

const inputCls =
  "rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]";

export default function GradeCategoriesEditor({
  courseId,
  semesterId,
  categories,
}: {
  courseId: string;
  semesterId: string;
  categories: CategoryWithEntries[];
}) {
  const entriesByCategory = new Map(categories.map((c) => [c.id, c.entries]));
  const calc = computeCourseGrade(categories, entriesByCategory);
  const [targetStr, setTargetStr] = useState("");
  const target = Number(targetStr);
  const needed =
    targetStr.trim() !== "" && Number.isFinite(target)
      ? scoreNeededForTarget(categories, entriesByCategory, target)
      : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Live grade</p>
          <p className="text-lg font-semibold">
            {calc.liveGrade !== null ? `${calc.liveGrade.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Worst case (0 on rest)</p>
          <p className="text-lg font-semibold">
            {calc.worstCaseGrade !== null ? `${calc.worstCaseGrade.toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      {categories.length > 0 && Math.abs(calc.totalWeight - 100) > 0.01 && (
        <p className="text-xs" style={{ color: "var(--color-negative)" }}>
          Category weights add up to {calc.totalWeight}%, not 100% — fix this so the live grade is
          accurate.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {categories.map((cat) => (
          <CategoryRow key={cat.id} category={cat} semesterId={semesterId} />
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-[var(--color-fg-dim)]">
            No grade categories yet — add one below (e.g. &ldquo;Midterm&rdquo;, 30%).
          </p>
        )}
      </div>

      <AddCategoryForm courseId={courseId} semesterId={semesterId} />

      <div className="rounded-lg bg-white/5 p-2 flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-wide text-white/40">Projected final grade</p>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-white/40">
            Hypothetical target overall %
          </span>
          <input
            type="number"
            step="any"
            value={targetStr}
            onChange={(e) => setTargetStr(e.target.value)}
            placeholder="e.g. 90"
            className={inputCls}
          />
        </label>
        {needed !== undefined && needed !== null && (
          <p className="text-sm font-medium" style={{ color: "var(--color-education)" }}>
            You&apos;d need {needed.toFixed(1)}% (combined) on the remaining ungraded categories to
            land at {target}% overall.
          </p>
        )}
        {needed === null && targetStr.trim() !== "" && (
          <p className="text-xs text-[var(--color-fg-dim)]">
            Every category is already graded, or there&apos;s no weight set yet — nothing left to
            solve for.
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryRow({ category, semesterId }: { category: CategoryWithEntries; semesterId: string }) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [editState, editAction, editPending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await editGradeCategory(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);

  const pct = categoryPercent(category.entries);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
      {editing ? (
        <form action={editAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="semesterId" value={semesterId} />
          <input name="name" defaultValue={category.name} required className={`${inputCls} flex-1`} />
          <input
            name="weight"
            type="number"
            step="any"
            min={0}
            max={100}
            defaultValue={category.weight}
            required
            className={`${inputCls} w-20`}
          />
          <button
            type="submit"
            disabled={editPending}
            className="rounded-lg bg-[var(--color-education)] text-black text-xs font-medium px-2.5 py-1.5 disabled:opacity-60"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-white/10 text-xs px-2.5 py-1.5 hover:bg-white/5"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {category.name} <span className="text-white/40 font-normal">· {category.weight}%</span>
            </p>
            <p className="text-xs text-[var(--color-fg-dim)]">
              {pct !== null ? `${pct.toFixed(1)}% so far` : "No entries yet"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-[var(--color-fg-dim)] hover:text-white/80">
              Edit
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => startDelete(() => removeGradeCategory(category.id, semesterId))}
              className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
            >
              {isDeleting ? "…" : "Delete"}
            </button>
          </div>
        </div>
      )}
      {editState?.error && <p className="text-xs text-[var(--color-negative)] mt-1">{editState.error}</p>}

      <ul className="mt-2 flex flex-col gap-1">
        {category.entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} semesterId={semesterId} />
        ))}
      </ul>
      <AddEntryForm categoryId={category.id} semesterId={semesterId} />
    </div>
  );
}

function EntryRow({ entry, semesterId }: { entry: EduGradeEntry; semesterId: string }) {
  const [isDeleting, startDelete] = useTransition();
  return (
    <li className="flex items-center justify-between gap-2 text-sm pl-2 border-l border-white/8">
      <span className="truncate">
        {entry.name} <span className="text-white/40">— {entry.score}/{entry.maxScore}</span>
      </span>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDelete(() => removeGradeEntry(entry.id, semesterId))}
        className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60 shrink-0"
      >
        {isDeleting ? "…" : "Remove"}
      </button>
    </li>
  );
}

function AddEntryForm({ categoryId, semesterId }: { categoryId: string; semesterId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createGradeEntry(prev, formData);
    if (!result) setOpen(false);
    return result;
  }, undefined);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 text-xs text-[var(--color-education)] hover:opacity-80"
      >
        + Add entry
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="semesterId" value={semesterId} />
      <input name="name" placeholder="e.g. Quiz 3" required autoFocus className={`${inputCls} flex-1 min-w-24`} />
      <input name="score" type="number" step="any" min={0} placeholder="Score" required className={`${inputCls} w-20`} />
      <span className="text-white/40 text-sm">/</span>
      <input name="maxScore" type="number" step="any" min={0} placeholder="Max" required className={`${inputCls} w-20`} />
      <button type="submit" disabled={pending} className="rounded-lg bg-[var(--color-education)] text-black text-xs font-medium px-2.5 py-1.5 disabled:opacity-60">
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 text-xs px-2.5 py-1.5 hover:bg-white/5">
        Cancel
      </button>
      {state?.error && <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}

function AddCategoryForm({ courseId, semesterId }: { courseId: string; semesterId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createGradeCategory(prev, formData);
    if (!result) setOpen(false);
    return result;
  }, undefined);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full border border-white/15 text-xs px-3 py-1.5 hover:bg-white/5"
      >
        + Add grade category
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="semesterId" value={semesterId} />
      <input name="name" placeholder="e.g. Midterm" required autoFocus className={`${inputCls} flex-1 min-w-24`} />
      <input name="weight" type="number" step="any" min={0} max={100} placeholder="Weight %" required className={`${inputCls} w-24`} />
      <button type="submit" disabled={pending} className="rounded-lg bg-[var(--color-education)] text-black text-xs font-medium px-2.5 py-1.5 disabled:opacity-60">
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 text-xs px-2.5 py-1.5 hover:bg-white/5">
        Cancel
      </button>
      {state?.error && <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
