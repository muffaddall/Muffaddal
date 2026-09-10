"use client";

import { useState, useTransition } from "react";
import { clearGroupsAction } from "../actions";
import type { TourneyLevel } from "@/lib/types";

export default function RegenerateGroupsButton({ level, tourneyId }: { level: TourneyLevel; tourneyId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isClearing, startClear] = useTransition();

  return (
    <div className="self-end flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isClearing}
        onClick={() => {
          if (
            !window.confirm(
              "Regenerate groups? This deletes all group fixtures, scores, and any points already awarded from them."
            )
          ) {
            return;
          }
          startClear(async () => {
            const result = await clearGroupsAction(level, tourneyId);
            if (result?.error) setError(result.error);
          });
        }}
        className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isClearing ? "Regenerating…" : "Regenerate Groups"}
      </button>
      {error && <p className="text-xs text-[var(--color-negative)]">{error}</p>}
    </div>
  );
}
