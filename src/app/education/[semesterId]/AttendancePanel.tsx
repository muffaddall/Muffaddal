"use client";

import { useActionState, useState } from "react";
import { createAttendance } from "../actions";
import { ATTENDANCE_STATUSES, computeAttendancePercent, type EduAttendanceRecord } from "@/lib/types";
import { formatDateShort } from "@/lib/date";

const inputCls =
  "rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]";

const STATUS_LABELS: Record<string, string> = {
  attended: "Attended",
  missed: "Missed",
  excused: "Excused",
};

export default function AttendancePanel({
  courseId,
  semesterId,
  records,
  thresholdPercent,
}: {
  courseId: string;
  semesterId: string;
  records: EduAttendanceRecord[];
  thresholdPercent: number | null;
}) {
  const pct = computeAttendancePercent(records);
  const atRisk = pct !== null && thresholdPercent !== null && pct < thresholdPercent;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          <span className="text-white/40">Attendance: </span>
          {pct !== null ? `${pct.toFixed(1)}%` : "No records yet"}
          {thresholdPercent !== null && (
            <span className="text-white/40"> (policy: {thresholdPercent}%)</span>
          )}
        </p>
        {atRisk && (
          <span className="text-xs font-medium" style={{ color: "var(--color-negative)" }}>
            Below policy threshold
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {records.map((r) => (
          <li key={r.id} className="flex items-center justify-between text-sm">
            <span>{formatDateShort(r.date)}</span>
            <span
              style={{
                color:
                  r.status === "attended"
                    ? "var(--color-positive)"
                    : r.status === "missed"
                      ? "var(--color-negative)"
                      : "var(--color-fg-dim)",
              }}
            >
              {STATUS_LABELS[r.status]}
            </span>
          </li>
        ))}
        {records.length === 0 && (
          <p className="text-sm text-[var(--color-fg-dim)]">No attendance logged yet.</p>
        )}
      </ul>

      <AddAttendanceForm courseId={courseId} semesterId={semesterId} />
    </div>
  );
}

function AddAttendanceForm({ courseId, semesterId }: { courseId: string; semesterId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createAttendance(prev, formData);
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
        + Log attendance
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="semesterId" value={semesterId} />
      <input name="date" type="date" required className={inputCls} />
      <select name="status" defaultValue="attended" className={inputCls}>
        {ATTENDANCE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-education)] text-black text-xs font-medium px-2.5 py-1.5 disabled:opacity-60"
      >
        Save
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
