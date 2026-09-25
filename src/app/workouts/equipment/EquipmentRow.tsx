"use client";

import { useTransition } from "react";
import { removeEquipment } from "./actions";
import { formatDateShort } from "@/lib/date";
import type { Equipment, EquipmentStats } from "@/lib/types";

export default function EquipmentRow({ item, stats }: { item: Equipment; stats: EquipmentStats }) {
  const [isDeleting, startDelete] = useTransition();

  return (
    <tr className="border-t border-[var(--color-border)] text-sm">
      <td className="py-3 pr-3">
        <p className="font-display text-2xl leading-none">
          {stats.totalKm} <span className="text-sm text-white/40">km</span>
        </p>
        <p className="text-xs text-white/40 mt-1">
          {stats.workoutCount} workout{stats.workoutCount === 1 ? "" : "s"}
          {stats.lastUsed && ` · last ${formatDateShort(stats.lastUsed)}`}
        </p>
      </td>
      <td className="py-3 pr-3 font-medium align-top">{item.name}</td>
      <td className="py-3 text-right align-top">
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeEquipment(item.id))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </td>
    </tr>
  );
}
