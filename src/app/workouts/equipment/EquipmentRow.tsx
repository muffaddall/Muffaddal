"use client";

import { useTransition } from "react";
import { removeEquipment } from "./actions";
import type { Equipment } from "@/lib/types";

export default function EquipmentRow({ item }: { item: Equipment }) {
  const [isDeleting, startDelete] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
      <p className="text-sm font-medium truncate">{item.name}</p>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDelete(() => removeEquipment(item.id))}
        className="shrink-0 text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isDeleting ? "…" : "Delete"}
      </button>
    </li>
  );
}
