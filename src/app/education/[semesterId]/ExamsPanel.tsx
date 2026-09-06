"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createExam,
  createExamTopic,
  createMilestone,
  removeExam,
  removeExamTopic,
  removeMilestone,
  toggleExamTopic,
  toggleMilestone,
} from "../actions";
import {
  daysUntil,
  studyMilestoneDate,
  type EduExam,
  type EduExamTopic,
  type EduStudyMilestone,
} from "@/lib/types";
import { formatDateShort, todayStr } from "@/lib/date";

type ExamWithChecklist = EduExam & { topics: EduExamTopic[]; milestones: EduStudyMilestone[] };

const inputCls =
  "rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]";

export default function ExamsPanel({
  courseId,
  semesterId,
  exams,
}: {
  courseId: string;
  semesterId: string;
  exams: ExamWithChecklist[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {exams.map((exam) => (
          <ExamRow key={exam.id} exam={exam} semesterId={semesterId} />
        ))}
        {exams.length === 0 && (
          <p className="text-sm text-[var(--color-fg-dim)]">No exams or quizzes logged for this course yet.</p>
        )}
      </ul>
      <AddExamForm courseId={courseId} semesterId={semesterId} />
    </div>
  );
}

function ExamRow({ exam, semesterId }: { exam: ExamWithChecklist; semesterId: string }) {
  const [isDeleting, startDelete] = useTransition();
  const today = todayStr();
  const remaining = daysUntil(exam.examDate, today);
  const topicsDone = exam.topics.filter((t) => t.done).length;

  return (
    <li className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {exam.title} <span className="text-white/40 font-normal">· {exam.type === "quiz" ? "Quiz" : "Exam"}</span>
          </p>
          <p className="text-xs text-[var(--color-fg-dim)]">
            {formatDateShort(exam.examDate)} · {remaining >= 0 ? `${remaining} day${remaining === 1 ? "" : "s"} away` : "past"}
            {exam.topics.length > 0 && ` · ${topicsDone}/${exam.topics.length} topics studied`}
          </p>
        </div>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeExam(exam.id, semesterId))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60 shrink-0"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>

      <div className="mt-2 pt-2 border-t border-white/8">
        <p className="text-[10px] uppercase tracking-wide text-white/40 mb-1">Study schedule</p>
        <ul className="flex flex-col gap-1">
          {[...exam.milestones]
            .sort((a, b) => b.offsetDays - a.offsetDays)
            .map((m) => (
              <MilestoneRow key={m.id} milestone={m} examDate={exam.examDate} semesterId={semesterId} />
            ))}
        </ul>
        <AddMilestoneForm examId={exam.id} semesterId={semesterId} />
      </div>

      <div className="mt-2 pt-2 border-t border-white/8">
        <p className="text-[10px] uppercase tracking-wide text-white/40 mb-1">Topics</p>
        <ul className="flex flex-col gap-1">
          {exam.topics.map((t) => (
            <TopicRow key={t.id} topic={t} semesterId={semesterId} />
          ))}
        </ul>
        <AddTopicForm examId={exam.id} semesterId={semesterId} />
      </div>
    </li>
  );
}

function MilestoneRow({
  milestone,
  examDate,
  semesterId,
}: {
  milestone: EduStudyMilestone;
  examDate: string;
  semesterId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  return (
    <li className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={milestone.done}
        disabled={isPending}
        onChange={(e) => startTransition(() => toggleMilestone(milestone.id, e.target.checked, semesterId))}
        className="accent-[var(--color-education)]"
      />
      <span className={milestone.done ? "line-through text-white/40" : ""}>
        {milestone.label} — {formatDateShort(studyMilestoneDate(examDate, milestone.offsetDays))}
      </span>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDelete(() => removeMilestone(milestone.id, semesterId))}
        className="ml-auto text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isDeleting ? "…" : "×"}
      </button>
    </li>
  );
}

function AddMilestoneForm({ examId, semesterId }: { examId: string; semesterId: string }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [offset, setOffset] = useState("2");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1 text-xs text-[var(--color-education)] hover:opacity-80">
        + Add milestone
      </button>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label"
        autoFocus
        className={`${inputCls} flex-1 min-w-20`}
      />
      <input
        value={offset}
        onChange={(e) => setOffset(e.target.value)}
        type="number"
        min={0}
        placeholder="Days before"
        className={`${inputCls} w-28`}
      />
      <button
        type="button"
        disabled={isPending || !label.trim()}
        onClick={() =>
          startTransition(async () => {
            await createMilestone(examId, semesterId, label, Number(offset));
            setLabel("");
            setOffset("2");
            setOpen(false);
          })
        }
        className="rounded-lg bg-[var(--color-education)] text-black text-xs font-medium px-2.5 py-1.5 disabled:opacity-60"
      >
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 text-xs px-2.5 py-1.5 hover:bg-white/5">
        Cancel
      </button>
    </div>
  );
}

function TopicRow({ topic, semesterId }: { topic: EduExamTopic; semesterId: string }) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  return (
    <li className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={topic.done}
        disabled={isPending}
        onChange={(e) => startTransition(() => toggleExamTopic(topic.id, e.target.checked, semesterId))}
        className="accent-[var(--color-education)]"
      />
      <span className={topic.done ? "line-through text-white/40" : ""}>{topic.label}</span>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDelete(() => removeExamTopic(topic.id, semesterId))}
        className="ml-auto text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isDeleting ? "…" : "×"}
      </button>
    </li>
  );
}

function AddTopicForm({ examId, semesterId }: { examId: string; semesterId: string }) {
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-1 flex items-center gap-1.5">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Add a topic"
        className={`${inputCls} flex-1`}
      />
      <button
        type="button"
        disabled={isPending || !label.trim()}
        onClick={() =>
          startTransition(async () => {
            await createExamTopic(examId, semesterId, label);
            setLabel("");
          })
        }
        className="rounded-lg bg-[var(--color-education)] text-black text-xs font-medium px-2.5 py-1.5 disabled:opacity-60"
      >
        Add
      </button>
    </div>
  );
}

function AddExamForm({ courseId, semesterId }: { courseId: string; semesterId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createExam(prev, formData);
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
        + Add exam / quiz
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="semesterId" value={semesterId} />
      <div className="flex flex-wrap gap-2">
        <input name="title" placeholder="Title (e.g. Midterm 1)" required autoFocus className={`${inputCls} flex-1 min-w-32`} />
        <select name="type" defaultValue="exam" className={inputCls}>
          <option value="exam">Exam</option>
          <option value="quiz">Quiz</option>
        </select>
        <input name="examDate" type="date" required className={inputCls} />
      </div>
      <textarea
        name="topics"
        placeholder="Topics covered, one per line (optional)"
        rows={3}
        className={`${inputCls} resize-none`}
      />
      <div className="flex items-center gap-2">
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
