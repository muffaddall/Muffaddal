"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createAssignment, createExam } from "../../actions";

const inputCls =
  "rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]";

export default function QuickAddForm({
  kind,
  courseOptions,
}: {
  kind: "assignment" | "quiz" | "exam";
  courseOptions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = kind === "assignment" ? await createAssignment(prev, formData) : await createExam(prev, formData);
    if (!result) {
      router.push("/");
      return undefined;
    }
    return result;
  }, undefined);

  if (courseOptions.length === 0) {
    return (
      <p className="text-sm text-[var(--color-fg-dim)]">
        No courses in your current semester yet — add one from the Education tab first.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {kind !== "assignment" && <input type="hidden" name="type" value={kind} />}
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-white/40">Course</span>
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
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-white/40">Title</span>
        <input name="title" required autoFocus className={inputCls} />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-white/40">
          {kind === "assignment" ? "Due date" : "Date"}
        </span>
        <input name={kind === "assignment" ? "dueDate" : "examDate"} type="date" required className={inputCls} />
      </label>
      {kind !== "assignment" && (
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-white/40">
            Topics covered, one per line (optional)
          </span>
          <textarea name="topics" rows={4} className={`${inputCls} resize-none`} />
        </label>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-education)] text-black font-medium px-3 py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
