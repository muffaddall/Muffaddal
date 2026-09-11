"use client";

import { useState, useTransition } from "react";
import { applyCourtFeePresetAction } from "./actions";
import type { TourneyLevel } from "@/lib/types";

export default function ApplyCourtFeesButton({
  level,
  tourneyId,
  formatName,
}: {
  level: TourneyLevel;
  tourneyId: string;
  formatName: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isApplying, startApply] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isApplying}
        onClick={() =>
          startApply(async () => {
            const result = await applyCourtFeePresetAction(level, tourneyId);
            if (result?.error) setError(result.error);
          })
        }
        className="rounded-lg border border-[var(--color-community)] text-[var(--color-community)] px-3 py-1.5 text-xs font-medium disabled:opacity-60"
      >
        {isApplying ? "Applying…" : `Apply Court Fees from "${formatName}"`}
      </button>
      {error && <p className="text-xs text-[var(--color-negative)]">{error}</p>}
    </div>
  );
}
