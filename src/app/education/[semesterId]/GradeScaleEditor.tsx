"use client";

import { useActionState } from "react";
import { saveGradeScale } from "../actions";
import type { EduCourseGradeScale, GpaLetterGrade } from "@/lib/types";

// F and XF are excluded: F is the implicit floor below D's minimum, and XF
// is an academic-integrity violation grade, not something you land on by
// score — neither has a meaningful "minimum %".
const SCALE_LETTERS: GpaLetterGrade[] = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D"];

export default function GradeScaleEditor({
  courseId,
  semesterId,
  scale,
}: {
  courseId: string;
  semesterId: string;
  scale: EduCourseGradeScale[];
}) {
  const [state, formAction, pending] = useActionState(saveGradeScale, undefined);
  const byLetter = new Map(scale.map((s) => [s.letterGrade, s.minPercent]));

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="semesterId" value={semesterId} />
      <p className="text-xs text-[var(--color-fg-dim)]">
        Minimum % this course needs for each letter. Leave a letter blank if this course doesn&apos;t
        use it.
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {SCALE_LETTERS.map((letter) => (
          <label key={letter} className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-white/40">{letter}</span>
            <input type="hidden" name="letter" value={letter} />
            <input
              name="percent"
              type="number"
              step="any"
              min={0}
              max={100}
              placeholder="—"
              defaultValue={byLetter.get(letter) ?? ""}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
            />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-education)] text-black text-sm font-medium px-3 py-1.5 disabled:opacity-60 self-start"
        >
          {pending ? "Saving…" : "Save grade scale"}
        </button>
        {state?.error && <span className="text-xs text-[var(--color-negative)]">{state.error}</span>}
      </div>
    </form>
  );
}
