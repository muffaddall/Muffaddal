"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { disqualifyTeamAction, setTeamDisqualifiedAction, setTeamPaidAction } from "../actions";
import EditTeamForm from "../EditTeamForm";
import { formatMoney } from "@/lib/format";
import { registrationsActualTotal, registrationsTotal } from "@/lib/types";
import type { TourneyLevel, TourneyPlayer, TourneyTeam } from "@/lib/types";

export default function PaymentsSection({
  level,
  tourneyId,
  teams,
  players,
}: {
  level: TourneyLevel;
  tourneyId: string;
  teams: TourneyTeam[];
  players: TourneyPlayer[];
}) {
  if (teams.length === 0) {
    return <p className="text-sm text-white/40 text-center py-2">No teams entered.</p>;
  }

  const collected = registrationsActualTotal(teams);
  const expected = registrationsTotal(teams);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/40">
        Collected {formatMoney(collected)} / {formatMoney(expected)} expected — set each person&apos;s fee on the{" "}
        <Link href={`/community/padel/tournament/${level}/${tourneyId}/budget/income`} className="underline">
          Budget Income page
        </Link>
        .
      </p>
      {teams.map((team) => (
        <TeamPaymentRow key={team.id} level={level} tourneyId={tourneyId} team={team} players={players} />
      ))}
    </div>
  );
}

function TeamPaymentRow({
  level,
  tourneyId,
  team,
  players,
}: {
  level: TourneyLevel;
  tourneyId: string;
  team: TourneyTeam;
  players: TourneyPlayer[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <EditTeamForm level={level} tourneyId={tourneyId} team={team} players={players} onDone={() => setEditing(false)} />
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-surface)] border border-white/8 p-3">
      <div className="flex flex-1 min-w-0 items-center gap-2">
        {team.disqualified && (
          <span className="shrink-0 rounded-full border border-[var(--color-negative)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-negative)]">
            DQ
          </span>
        )}
        <PaidToggle level={level} tourneyId={tourneyId} teamId={team.id} side="a" name={team.playerAName} fee={team.playerAFee} paid={team.playerAPaid} />
        <PaidToggle level={level} tourneyId={tourneyId} teamId={team.id} side="b" name={team.playerBName} fee={team.playerBFee} paid={team.playerBPaid} />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-white/50 hover:text-white/80"
        >
          Edit
        </button>
        <DisqualifyButton level={level} tourneyId={tourneyId} team={team} />
      </div>
    </div>
  );
}

function DisqualifyButton({
  level,
  tourneyId,
  team,
}: {
  level: TourneyLevel;
  tourneyId: string;
  team: TourneyTeam;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (team.disqualified) {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => setTeamDisqualifiedAction(team.id, false, level, tourneyId))}
        className="text-xs text-white/50 hover:text-white/80 disabled:opacity-60"
      >
        {isPending ? "…" : "Undo DQ"}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (
            !window.confirm(
              `Disqualify ${team.playerAName} & ${team.playerBName}? Any of their matches that haven't been scored yet — group or knockout — will be forfeited to the opponent right away.`
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await disqualifyTeamAction(team.id, level, tourneyId);
            if (result?.error) setError(result.error);
          });
        }}
        className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isPending ? "…" : "Disqualify"}
      </button>
      {error && <span className="text-[10px] text-[var(--color-negative)]">{error}</span>}
    </div>
  );
}

function PaidToggle({
  level,
  tourneyId,
  teamId,
  side,
  name,
  fee,
  paid,
}: {
  level: TourneyLevel;
  tourneyId: string;
  teamId: string;
  side: "a" | "b";
  name: string;
  fee: number;
  paid: boolean;
}) {
  const [isSaving, startSave] = useTransition();

  return (
    <label className="flex flex-1 min-w-0 items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={paid}
        disabled={isSaving}
        onChange={(e) => startSave(() => setTeamPaidAction(teamId, side, e.target.checked, level, tourneyId))}
        className="h-4 w-4 shrink-0 accent-[var(--color-community)]"
      />
      <span className={`truncate ${paid ? "" : "text-white/50"}`}>{name}</span>
      <span className="text-xs text-white/40 tabular-nums shrink-0">{formatMoney(fee)}</span>
    </label>
  );
}
