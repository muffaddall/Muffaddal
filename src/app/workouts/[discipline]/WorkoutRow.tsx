"use client";

import { useState, useTransition } from "react";
import { editWorkoutLog, removeWorkoutLog } from "./actions";
import {
  DISTANCE_UNITS,
  DISTANCE_UNIT_LABELS,
  WORKOUT_DISCIPLINE_UNITS,
  computeWorkoutPace,
  formatDistance,
  formatPace,
  type DistanceUnit,
  type Equipment,
  type WorkoutLog,
} from "@/lib/types";
import { formatDateShort } from "@/lib/date";

const editInputCls =
  "w-full rounded-lg bg-white/5 border border-[var(--color-border)] px-1.5 py-1 text-xs outline-none focus:border-[var(--color-accent)]";

export default function WorkoutRow({
  log,
  equipmentName,
  showGear,
  equipmentOptions,
}: {
  log: WorkoutLog;
  equipmentName: string | null;
  showGear: boolean;
  equipmentOptions: Equipment[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const units = WORKOUT_DISCIPLINE_UNITS[log.discipline];
  const [date, setDate] = useState(log.date);
  const [distance, setDistance] = useState(String(log.distance));
  const [unit, setUnit] = useState<DistanceUnit>(units.distanceUnit as DistanceUnit);
  const [durationMin, setDurationMin] = useState(String(log.durationMin));
  const [equipmentId, setEquipmentId] = useState(log.equipmentId ?? "");

  const pace = computeWorkoutPace(log);

  function handleSave() {
    const fd = new FormData();
    fd.set("id", log.id);
    fd.set("discipline", log.discipline);
    fd.set("date", date);
    fd.set("distance", distance);
    fd.set("unit", unit);
    fd.set("durationMin", durationMin);
    fd.set("equipmentId", equipmentId);
    startSave(async () => {
      const result = await editWorkoutLog(undefined, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        setIsEditing(false);
      }
    });
  }

  if (isEditing) {
    return (
      <tr className="border-t border-[var(--color-border)] text-sm">
        <td className="py-2 pr-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={editInputCls}
          />
        </td>
        <td className="py-2 pr-3">
          <div className="flex gap-1">
            <input
              type="number"
              step="any"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className={`${editInputCls} w-16`}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as DistanceUnit)}
              className={editInputCls}
            >
              {DISTANCE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {DISTANCE_UNIT_LABELS[u]}
                </option>
              ))}
            </select>
          </div>
        </td>
        <td className="py-2 pr-3">
          <input
            type="number"
            step="any"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            className={`${editInputCls} w-16`}
          />
        </td>
        <td className="py-2 pr-3 tabular-nums text-white/30">—</td>
        {showGear && (
          <td className="py-2 pr-3">
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className={editInputCls}
            >
              <option value="">No gear</option>
              {equipmentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </td>
        )}
        <td className="py-2 text-right whitespace-nowrap">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="text-xs text-[var(--color-positive)] hover:opacity-80 disabled:opacity-60 mr-2"
          >
            {isSaving ? "…" : "Save"}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => setIsEditing(false)}
            className="text-xs text-white/50 hover:opacity-80 disabled:opacity-60"
          >
            Cancel
          </button>
          {error && <p className="text-[10px] text-[var(--color-negative)] mt-1">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-[var(--color-border)] text-sm">
      <td className="py-2 pr-3">{formatDateShort(log.date)}</td>
      <td className="py-2 pr-3 tabular-nums">{formatDistance(log.distance, log.discipline)}</td>
      <td className="py-2 pr-3 tabular-nums">{log.durationMin} min</td>
      <td className="py-2 pr-3 tabular-nums">{formatPace(pace, log.discipline)}</td>
      {showGear && (
        <td className="py-2 pr-3 text-[var(--color-fg-dim)]">{equipmentName ?? "—"}</td>
      )}
      <td className="py-2 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-xs text-[var(--color-accent)] hover:opacity-80 mr-2"
        >
          Edit
        </button>
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
