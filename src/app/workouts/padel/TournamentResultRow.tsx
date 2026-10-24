"use client";

import { useTransition } from "react";
import { savePadelTournamentResult } from "./actions";
import { formatMoney } from "@/lib/format";
import { formatDateShort } from "@/lib/date";
import { PADEL_TOURNAMENT_RESULTS, PADEL_TOURNAMENT_RESULT_LABELS } from "@/lib/types";
import type { PadelLoggedTournament } from "@/lib/padel";

export default function TournamentResultRow({ tournament }: { tournament: PadelLoggedTournament }) {
  const [saving, startSave] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
      <div className="min-w-0">
        <p className="text-sm truncate">{tournament.note || "Tournament"}</p>
        <p className="text-xs text-[var(--color-fg-dim)]">
          {formatDateShort(tournament.date)} · {formatMoney(tournament.amount)}
        </p>
      </div>
      <select
        defaultValue={tournament.result ?? ""}
        disabled={saving}
        onChange={(e) => {
          const value = e.target.value;
          startSave(() => savePadelTournamentResult(tournament.transactionId, value));
        }}
        className="shrink-0 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)] disabled:opacity-60"
      >
        <option value="">Where did you finish?</option>
        {PADEL_TOURNAMENT_RESULTS.map((r) => (
          <option key={r} value={r}>
            {PADEL_TOURNAMENT_RESULT_LABELS[r]}
          </option>
        ))}
      </select>
    </li>
  );
}
