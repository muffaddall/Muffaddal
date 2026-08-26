"use client";

import { useTransition } from "react";
import { removeWeightLog } from "./actions";
import type { WeightLog } from "@/lib/types";
import { formatDateShort, formatTimeLabel } from "@/lib/date";

export default function WeightRow({ log }: { log: WeightLog }) {
  const [isDeleting, startDelete] = useTransition();

  return (
    <tr className="border-t border-[var(--color-border)] text-sm">
      <td className="py-2 pr-3">{formatDateShort(log.date)}</td>
      <td className="py-2 pr-3 text-[var(--color-fg-dim)]">
        {log.time ? formatTimeLabel(log.time) : "—"}
      </td>
      <td className="py-2 pr-3 tabular-nums">{log.weight} kg</td>
      <td className="py-2 text-right">
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeWeightLog(log.id))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </td>
    </tr>
  );
}
