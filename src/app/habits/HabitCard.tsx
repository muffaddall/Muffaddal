"use client";

import { useState, useTransition } from "react";
import { removeHabit, saveHabitName } from "./actions";
import HabitDayButton from "./HabitDayButton";

export type HabitCardDay = { date: string; weekday: string; dayNumber: number; done: boolean };

export default function HabitCard({
  id,
  name,
  currentStreak,
  bestStreak,
  monthRate,
  days,
}: {
  id: string;
  name: string;
  currentStreak: number;
  bestStreak: number;
  monthRate: number;
  days: HabitCardDay[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        {editing ? (
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              startSave(async () => {
                const result = await saveHabitName(id, draft);
                if (result?.error) setError(result.error);
                else {
                  setError(null);
                  setEditing(false);
                }
              });
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              className="min-w-0 flex-1 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-habits)]"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-habits)] text-black text-sm px-3 py-1.5 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(name);
                setEditing(false);
              }}
              className="rounded-lg border border-[var(--color-border)] text-sm px-3 py-1.5 hover:bg-white/5"
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <div className="min-w-0">
              <p className="font-semibold truncate">{name}</p>
              <p className="text-xs text-[var(--color-fg-dim)] mt-0.5">
                {currentStreak > 0 ? `🔥 ${currentStreak} day streak` : "No streak yet"} · best {bestStreak} ·{" "}
                {Math.round(monthRate * 100)}% this month
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-[var(--color-fg-dim)] hover:text-[var(--color-fg)]"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  if (confirm(`Delete "${name}" and all its history?`)) startDelete(() => removeHabit(id));
                }}
                className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
              >
                {deleting ? "…" : "Delete"}
              </button>
            </div>
          </>
        )}
      </div>
      {error && <p className="text-xs text-[var(--color-negative)] mb-2">{error}</p>}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <HabitDayButton
            key={d.date}
            habitId={id}
            date={d.date}
            done={d.done}
            label={String(d.dayNumber)}
            sublabel={d.weekday}
          />
        ))}
      </div>
    </div>
  );
}
