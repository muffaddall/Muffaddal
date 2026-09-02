"use client";

import { useTransition } from "react";
import { removeFoodItem } from "../actions";
import type { FoodItem } from "@/lib/types";

export default function FoodItemRow({ item }: { item: FoodItem }) {
  const [isDeleting, startDelete] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        {item.ingredients && (
          <p className="text-xs text-white/40 truncate">{item.ingredients}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm tabular-nums">{item.calories} kcal</span>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeFoodItem(item.id))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
