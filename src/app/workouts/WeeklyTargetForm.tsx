"use client";

import { useActionState, useState } from "react";
import { saveWeeklyTarget } from "./actions";
import {
  WORKOUT_DISCIPLINE_LABELS,
  WORKOUT_DISCIPLINES,
  type DisciplineTargetProgress,
  type WeeklyTarget,
} from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-fitness)]";

export default function WeeklyTargetForm({
  weekStart,
  target,
  progress,
}: {
  weekStart: string;
  target: WeeklyTarget | null;
  progress: DisciplineTargetProgress[];
}) {
  const [editing, setEditing] = useState(target === null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await saveWeeklyTarget(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);

  if (editing) {
    return (
      <form
        action={formAction}
        className="rounded-2xl bg-[var(--color-surface)] border border-white/10 p-4 flex flex-col gap-3"
      >
        <input type="hidden" name="weekStart" value={weekStart} />
        <p className="text-sm text-white/70">
          Set this week&apos;s target (km) for each discipline.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {WORKOUT_DISCIPLINES.map((d) => (
            <label key={d} className="flex flex-col gap-1">
              <span
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: "var(--color-fitness)" }}
              >
                {WORKOUT_DISCIPLINE_LABELS[d]}
              </span>
              <input
                name={d}
                type="number"
                step="any"
                min={0}
                defaultValue={target?.[d] ?? ""}
                placeholder="km"
                required
                className={inputCls}
              />
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[var(--color-fitness)] text-black text-sm font-bold px-4 py-2 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save target"}
          </button>
          {target !== null && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-white/15 text-sm font-semibold px-4 py-2 hover:bg-white/5"
            >
              Cancel
            </button>
          )}
        </div>
        {state?.error && <p className="text-sm text-[var(--color-negative)]">{state.error}</p>}
      </form>
    );
  }

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-white/10 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">Split between run / cycle / swim</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-bold hover:opacity-80"
          style={{ color: "var(--color-fitness)" }}
        >
          Edit target
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {progress.map((p) => (
          <TargetBar key={p.discipline} progress={p} />
        ))}
      </div>
    </div>
  );
}

function TargetBar({ progress }: { progress: DisciplineTargetProgress }) {
  const pct = progress.target > 0 ? Math.min((progress.actual / progress.target) * 100, 100) : 0;
  const hit = progress.target > 0 && progress.actual >= progress.target;

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="text-sm font-bold uppercase tracking-wide"
        style={{ color: "var(--color-fitness)" }}
      >
        {WORKOUT_DISCIPLINE_LABELS[progress.discipline]}
      </span>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: hit ? "var(--color-positive)" : "var(--color-fitness)",
          }}
        />
      </div>
      <p className="text-xs text-white/60">
        {progress.actual} / {progress.target} km
      </p>
      <p
        className="text-sm font-bold"
        style={{ color: hit ? "var(--color-positive)" : "var(--color-fitness)" }}
      >
        {hit
          ? progress.over > 0
            ? `+${progress.over} km over`
            : "Target hit!"
          : `${progress.remaining} km left`}
      </p>
    </div>
  );
}
