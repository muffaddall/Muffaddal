"use client";

import { useTransition } from "react";
import { deleteTourneyAction } from "../actions";
import type { TourneyLevel } from "@/lib/types";

export default function DeleteTourneyButton({
  level,
  tourneyId,
  tourneyName,
}: {
  level: TourneyLevel;
  tourneyId: string;
  tourneyName: string;
}) {
  const [isDeleting, startDelete] = useTransition();

  return (
    <button
      type="button"
      disabled={isDeleting}
      onClick={() => {
        if (!window.confirm(`Delete "${tourneyName}"? This removes all its teams, groups, matches, and points.`)) {
          return;
        }
        startDelete(() => deleteTourneyAction(level, tourneyId));
      }}
      className="rounded-full border border-[var(--color-negative)] px-3 py-1.5 text-xs text-[var(--color-negative)] disabled:opacity-60"
    >
      {isDeleting ? "Deleting…" : "Delete"}
    </button>
  );
}
