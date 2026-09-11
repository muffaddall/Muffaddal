"use client";

import { useTransition } from "react";
import { removeFormatAction } from "./actions";
import { formatHasCourtFeePreset, formatTeamCount } from "@/lib/types";
import type { TourneyFormat } from "@/lib/types";

export default function FormatRow({ format }: { format: TourneyFormat }) {
  const [isDeleting, startDelete] = useTransition();
  const teamCount = formatTeamCount(format.groupSizes);
  const groupsLabel = format.groupSizes.map((n) => `${n}`).join("+");

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{format.name}</p>
        <p className="text-xs text-white/40 truncate">
          {teamCount} teams · groups of {groupsLabel} · top {format.qualifiersPerGroup}
          {format.wildcardCount > 0 ? ` + ${format.wildcardCount} wildcard` : ""}
          {formatHasCourtFeePreset(format) ? ` · court fees @ ${format.courtHourRate}/hr` : ""}
        </p>
      </div>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDelete(() => removeFormatAction(format.id))}
        className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60 shrink-0"
      >
        {isDeleting ? "…" : "Delete"}
      </button>
    </li>
  );
}
