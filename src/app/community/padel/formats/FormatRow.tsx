"use client";

import { useTransition } from "react";
import { removeFormatAction } from "./actions";
import type { TourneyFormat } from "@/lib/types";

export default function FormatRow({ format }: { format: TourneyFormat }) {
  const [isDeleting, startDelete] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
      <p className="text-sm font-medium truncate">{format.name}</p>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm tabular-nums text-white/70">{format.numGroups} groups</span>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeFormatAction(format.id))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
