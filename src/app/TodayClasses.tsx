"use client";

import { useTransition } from "react";
import { markAttendedToday } from "@/app/education/actions";
import { formatTimeLabel } from "@/lib/date";
import type { TodayClass } from "@/lib/education";

export function TodayClasses({ classes }: { classes: TodayClass[] }) {
  if (classes.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl tracking-wide leading-none mb-3 px-1" style={{ color: "var(--color-education)" }}>
        Today&apos;s Classes
      </h2>
      <div className="flex flex-col gap-2">
        {classes.map((c) => (
          <ClassRow key={`${c.courseId}-${c.startTime}`} cls={c} />
        ))}
      </div>
    </div>
  );
}

function ClassRow({ cls }: { cls: TodayClass }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-base truncate">{cls.courseName}</p>
        <p className="text-xs text-white/45">
          {formatTimeLabel(cls.startTime)} – {formatTimeLabel(cls.endTime)}
          {cls.room ? ` · ${cls.room}` : ""}
        </p>
      </div>
      <button
        type="button"
        disabled={isPending || cls.attendedToday}
        onClick={() => startTransition(() => markAttendedToday(cls.courseId))}
        className="shrink-0 rounded-full text-xs font-semibold px-3 py-1.5 active:scale-95 transition-transform disabled:opacity-60"
        style={{
          backgroundColor: cls.attendedToday ? "transparent" : "var(--color-education)",
          color: cls.attendedToday ? "var(--color-positive)" : "black",
          border: cls.attendedToday ? "1px solid var(--color-positive)" : "none",
        }}
      >
        {cls.attendedToday ? "Attended ✓" : "Attended"}
      </button>
    </div>
  );
}
