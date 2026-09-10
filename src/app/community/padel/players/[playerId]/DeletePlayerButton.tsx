"use client";

import { useTransition } from "react";
import { deletePlayerAction } from "./actions";

export default function DeletePlayerButton({
  playerId,
  playerName,
  tourneysPlayed,
}: {
  playerId: string;
  playerName: string;
  tourneysPlayed: number;
}) {
  const [isDeleting, startDelete] = useTransition();

  return (
    <button
      type="button"
      disabled={isDeleting}
      onClick={() => {
        const warning =
          tourneysPlayed > 0
            ? `Delete ${playerName}? They've played in ${tourneysPlayed} tournament${tourneysPlayed === 1 ? "" : "s"} — this also removes their team entries, match results, and points from those tournaments, including their partners' share of that history.`
            : `Delete ${playerName}?`;
        if (!window.confirm(warning)) return;
        startDelete(() => deletePlayerAction(playerId));
      }}
      className="rounded-full border border-[var(--color-negative)] px-3 py-1.5 text-xs text-[var(--color-negative)] disabled:opacity-60"
    >
      {isDeleting ? "Deleting…" : "Delete Player"}
    </button>
  );
}
