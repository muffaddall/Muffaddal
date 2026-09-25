"use client";

import { useTransition } from "react";
import { removeWorkoutLog } from "./actions";
import { computeWorkoutPace, formatDistance, formatPace, type WorkoutLog } from "@/lib/types";
import { formatDateShort } from "@/lib/date";

export default function WorkoutRow({
  log,
  equipmentName,
  showGear,
}: {
  log: WorkoutLog;
  equipmentName: string | null;
  showGear: boolean;
}) {
  const [isDeleting, startDelete] = useTransition();
  const pace = computeWorkoutPace(log);

  return (
    <tr className="border-t border-[var(--color-border)] text-sm">
      <td className="py-2 pr-3">{formatDateShort(log.date)}</td>
      <td className="py-2 pr-3 tabular-nums">{formatDistance(log.distance, log.discipline)}</td>
      <td className="py-2 pr-3 tabular-nums">{log.durationMin} min</td>
      <td className="py-2 pr-3 tabular-nums">{formatPace(pace, log.discipline)}</td>
      {showGear && (
        <td className="py-2 pr-3 text-[var(--color-fg-dim)]">{equipmentName ?? "—"}</td>
      )}
      <td className="py-2 text-right">
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeWorkoutLog(log.id, log.discipline))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </td>
    </tr>
  );
}
