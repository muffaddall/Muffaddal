"use client";

import { useActionState, useRef } from "react";
import { createWorkoutLog } from "./actions";
import { todayStr } from "@/lib/date";
import {
  DISTANCE_UNITS,
  DISTANCE_UNIT_LABELS,
  WORKOUT_DISCIPLINE_UNITS,
  type Equipment,
  type WorkoutDiscipline,
} from "@/lib/types";

export default function AddWorkoutForm({
  discipline,
  equipment,
}: {
  discipline: WorkoutDiscipline;
  equipment: Equipment[];
}) {
  const units = WORKOUT_DISCIPLINE_UNITS[discipline];
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createWorkoutLog(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <input type="hidden" name="discipline" value={discipline} />
      <input
        name="date"
        type="date"
        required
        defaultValue={todayStr()}
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <input
        name="distance"
        type="number"
        step="any"
        placeholder="Distance"
        required
        className="w-24 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <select
        name="unit"
        defaultValue={units.distanceUnit}
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      >
        {DISTANCE_UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {DISTANCE_UNIT_LABELS[unit]}
          </option>
        ))}
      </select>
      <input
        name="durationMin"
        type="number"
        step="any"
        placeholder="Duration (min)"
        required
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      {equipment.length > 0 && (
        <select
          name="equipmentId"
          defaultValue=""
          className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
        >
          <option value="">No gear</option>
          {equipment.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add workout"}
      </button>
      {state?.error && (
        <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>
      )}
    </form>
  );
}
