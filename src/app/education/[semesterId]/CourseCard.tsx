"use client";

import { useActionState, useState, useTransition } from "react";
import { editCourse, removeCourse } from "../actions";
import {
  COURSE_GRADE_VALUES,
  GPA_LETTER_GRADES,
  coursePoints,
  type EduCourse,
  type EduCourseGradeScale,
} from "@/lib/types";
import GradeScaleEditor from "./GradeScaleEditor";
import WhatGradeCalculator from "./WhatGradeCalculator";

export default function CourseCard({
  course,
  scale,
}: {
  course: EduCourse;
  scale: EduCourseGradeScale[];
}) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await editCourse(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);

  if (editing) {
    return (
      <li className="rounded-xl border border-white/10 bg-[var(--color-surface)] p-3">
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={course.id} />
          <input type="hidden" name="semesterId" value={course.semesterId} />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="name"
              defaultValue={course.name}
              placeholder="Course name"
              required
              className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
            />
            <input
              name="courseCode"
              defaultValue={course.courseCode}
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
              defaultValue={course.creditHours}
              placeholder="Credit hours"
              required
              className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
            />
            <input
              name="instructor"
              defaultValue={course.instructor}
              placeholder="Instructor"
              className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
            />
          </div>
          <input
            name="room"
            defaultValue={course.room}
            placeholder="Room / building"
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-white/40">
                Current grade
              </span>
              <select
                name="currentLetterGrade"
                defaultValue={course.currentLetterGrade ?? ""}
                className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
              >
                <option value="">Not graded yet</option>
                {COURSE_GRADE_VALUES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-white/40">
                Target grade
              </span>
              <select
                name="targetGrade"
                defaultValue={course.targetGrade ?? ""}
                className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
              >
                <option value="">No target set</option>
                {GPA_LETTER_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </div>
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

  const points = coursePoints(course.currentLetterGrade);

  return (
    <li className="rounded-xl border border-white/10 bg-[var(--color-surface)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {course.name}
            {course.courseCode && (
              <span className="text-white/40 font-normal"> · {course.courseCode}</span>
            )}
          </p>
          <p className="text-xs text-[var(--color-fg-dim)] truncate">
            {course.creditHours} credit{course.creditHours === 1 ? "" : "s"}
            {course.instructor ? ` · ${course.instructor}` : ""}
            {course.room ? ` · ${course.room}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
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
            onClick={() => startDelete(() => removeCourse(course.id, course.semesterId))}
            className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
          >
            {isDeleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/8 text-sm">
        <span>
          <span className="text-white/40">Grade: </span>
          {course.currentLetterGrade ?? "—"}
          {points !== null && <span className="text-white/40"> ({points.toFixed(1)} pts)</span>}
        </span>
        {course.targetGrade && (
          <span>
            <span className="text-white/40">Target: </span>
            {course.targetGrade}
          </span>
        )}
      </div>

      <details className="mt-2 pt-2 border-t border-white/8">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-xs font-semibold flex items-center justify-between" style={{ color: "var(--color-education)" }}>
          Grade scale
          <span className="text-white/40">▾</span>
        </summary>
        <div className="mt-2">
          <GradeScaleEditor courseId={course.id} semesterId={course.semesterId} scale={scale} />
        </div>
      </details>

      <details className="mt-2 pt-2 border-t border-white/8">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-xs font-semibold flex items-center justify-between" style={{ color: "var(--color-education)" }}>
          What grade do I need?
          <span className="text-white/40">▾</span>
        </summary>
        <div className="mt-2">
          <WhatGradeCalculator scale={scale} />
        </div>
      </details>
    </li>
  );
}
