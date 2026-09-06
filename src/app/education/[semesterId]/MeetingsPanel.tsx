"use client";

import { useActionState, useState, useTransition } from "react";
import { createMeeting, removeMeeting } from "../actions";
import { DAY_NAMES_SHORT, type EduCourseMeeting } from "@/lib/types";
import { formatTimeLabel } from "@/lib/date";

const inputCls =
  "rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]";

export default function MeetingsPanel({
  courseId,
  semesterId,
  meetings,
}: {
  courseId: string;
  semesterId: string;
  meetings: EduCourseMeeting[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        {meetings.map((m) => (
          <MeetingRow key={m.id} meeting={m} semesterId={semesterId} />
        ))}
        {meetings.length === 0 && (
          <p className="text-sm text-[var(--color-fg-dim)]">
            No weekly meeting times set — add one so this course shows up in your homepage&apos;s
            &ldquo;Today&rdquo; view.
          </p>
        )}
      </ul>
      <AddMeetingForm courseId={courseId} semesterId={semesterId} />
    </div>
  );
}

function MeetingRow({ meeting, semesterId }: { meeting: EduCourseMeeting; semesterId: string }) {
  const [isDeleting, startDelete] = useTransition();
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span>
        {DAY_NAMES_SHORT[meeting.dayOfWeek]} · {formatTimeLabel(meeting.startTime)} –{" "}
        {formatTimeLabel(meeting.endTime)}
      </span>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDelete(() => removeMeeting(meeting.id, semesterId))}
        className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isDeleting ? "…" : "Remove"}
      </button>
    </li>
  );
}

function AddMeetingForm({ courseId, semesterId }: { courseId: string; semesterId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createMeeting(prev, formData);
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
        + Add meeting time
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="semesterId" value={semesterId} />
      <select name="dayOfWeek" defaultValue="1" className={inputCls}>
        {DAY_NAMES_SHORT.map((d, i) => (
          <option key={d} value={i}>
            {d}
          </option>
        ))}
      </select>
      <input name="startTime" type="time" required className={inputCls} />
      <span className="text-white/40 text-sm">to</span>
      <input name="endTime" type="time" required className={inputCls} />
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
      {state?.error && <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
