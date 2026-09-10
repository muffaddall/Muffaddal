"use client";

import { useTransition } from "react";
import { setTeamPaidAction } from "../actions";
import type { TourneyLevel, TourneyTeam } from "@/lib/types";

export default function PaymentsSection({
  level,
  tourneyId,
  teams,
}: {
  level: TourneyLevel;
  tourneyId: string;
  teams: TourneyTeam[];
}) {
  if (teams.length === 0) {
    return <p className="text-sm text-white/40 text-center py-2">No teams entered.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {teams.map((team) => (
        <div key={team.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-surface)] border border-white/8 p-3">
          <PaidToggle
            level={level}
            tourneyId={tourneyId}
            teamId={team.id}
            side="a"
            name={team.playerAName}
            paid={team.playerAPaid}
          />
          <PaidToggle
            level={level}
            tourneyId={tourneyId}
            teamId={team.id}
            side="b"
            name={team.playerBName}
            paid={team.playerBPaid}
          />
        </div>
      ))}
    </div>
  );
}

function PaidToggle({
  level,
  tourneyId,
  teamId,
  side,
  name,
  paid,
}: {
  level: TourneyLevel;
  tourneyId: string;
  teamId: string;
  side: "a" | "b";
  name: string;
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
    </label>
  );
}
