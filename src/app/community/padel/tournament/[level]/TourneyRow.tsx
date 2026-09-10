"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteTourneyAction } from "./actions";
import { formatDateShort } from "@/lib/date";
import type { Tourney, TourneyLevel, TourneyStatus } from "@/lib/types";

const STATUS_LABELS: Record<TourneyStatus, string> = {
  setup: "Setup",
  groups: "Groups",
  knockout: "Knockout",
  completed: "Completed",
};

export default function TourneyRow({ tourney, level }: { tourney: Tourney; level: TourneyLevel }) {
  const [isDeleting, startDelete] = useTransition();

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4">
      <Link
        href={`/community/padel/tournament/${level}/${tourney.id}`}
        className="flex-1 min-w-0 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
      >
        <div className="min-w-0">
          <p className="font-semibold text-base truncate">{tourney.name}</p>
          <p className="text-xs text-white/45">{formatDateShort(tourney.date)}</p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--color-community)] px-2.5 py-1 text-[10px] uppercase tracking-wide text-[var(--color-community)]">
          {STATUS_LABELS[tourney.status]}
        </span>
      </Link>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => {
          if (!window.confirm(`Delete "${tourney.name}"? This removes all its teams, groups, matches, and points.`)) {
            return;
          }
          startDelete(() => deleteTourneyAction(level, tourney.id));
        }}
        className="shrink-0 text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isDeleting ? "…" : "Delete"}
      </button>
    </div>
  );
}
