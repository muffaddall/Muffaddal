"use client";

import { useState, useTransition } from "react";
import { toggleHabitDay } from "./actions";

/** One tappable day for one habit — flips instantly, then saves in the background (and flips back if saving fails). */
export default function HabitDayButton({
  habitId,
  date,
  done: initialDone,
  label,
  sublabel,
  wide = false,
}: {
  habitId: string;
  date: string;
  done: boolean;
  label: string;
  sublabel?: string;
  wide?: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      try {
        await toggleHabitDay(habitId, date, next);
      } catch {
        setDone(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={done}
      className={`flex flex-col items-center justify-center rounded-lg border transition-colors active:scale-95 ${
        wide ? "px-3 py-2 flex-row gap-2" : "py-1.5"
      } ${pending ? "opacity-70" : ""}`}
      style={{
        background: done ? "var(--color-habits)" : "rgba(255,255,255,0.04)",
        borderColor: done ? "var(--color-habits)" : "var(--color-border)",
        color: done ? "#000" : undefined,
      }}
    >
      <span className={`text-sm ${done ? "font-semibold" : ""}`}>{done && wide ? `✓ ${label}` : label}</span>
      {sublabel && (
        <span className={`text-[10px] ${done ? "text-black/70" : "text-[var(--color-fg-dim)]"}`}>{sublabel}</span>
      )}
    </button>
  );
}
