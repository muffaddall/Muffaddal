"use client";

import { useState, useTransition } from "react";
import { clearKnockoutBracketAction, setMatchScoreAction } from "../actions";
import type { TourneyLevel, TourneyMatch, TourneyStatus, TourneyTeam } from "@/lib/types";

export default function KnockoutSection({
  level,
  tourneyId,
  matches,
  teams,
  status,
}: {
  level: TourneyLevel;
  tourneyId: string;
  matches: TourneyMatch[];
  teams: TourneyTeam[];
  status: TourneyStatus;
}) {
  const locked = status === "completed";
  const rounds = new Map<number, TourneyMatch[]>();
  for (const m of matches) {
    if (m.roundIndex === null) continue;
    const list = rounds.get(m.roundIndex) ?? [];
    list.push(m);
    rounds.set(m.roundIndex, list);
  }
  const roundIndexes = Array.from(rounds.keys()).sort((a, b) => a - b);
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  const finalMatch = matches.find((m) => m.roundName === "Final");
  const champion = status === "completed" && finalMatch?.winnerTeamId ? teamsById.get(finalMatch.winnerTeamId) : null;

  return (
    <div className="flex flex-col gap-5">
      <RegenerateBracketButton level={level} tourneyId={tourneyId} />

      {champion && (
        <div className="rounded-xl border border-[var(--color-community)] bg-[var(--color-community)]/10 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-[var(--color-community)] mb-1">🏆 Champion</p>
          <p className="font-display text-2xl">
            {champion.playerAName} &amp; {champion.playerBName}
          </p>
        </div>
      )}

      {roundIndexes.map((roundIndex) => {
        const roundMatches = rounds.get(roundIndex)!;
        return (
          <div key={roundIndex} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-community)" }}>
              {roundMatches[0]?.roundName ?? `Round ${roundIndex + 1}`}
            </h3>
            <div className="flex flex-col gap-1.5">
              {roundMatches.map((m) => (
                <KnockoutMatchRow
                  key={m.id}
                  match={m}
                  teams={teams}
                  level={level}
                  tourneyId={tourneyId}
                  locked={locked}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KnockoutMatchRow({
  match,
  teams,
  level,
  tourneyId,
  locked,
}: {
  match: TourneyMatch;
  teams: TourneyTeam[];
  level: TourneyLevel;
  tourneyId: string;
  locked: boolean;
}) {
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const teamA = match.teamAId ? teamsById.get(match.teamAId) : null;
  const teamB = match.teamBId ? teamsById.get(match.teamBId) : null;
  const [scoreA, setScoreA] = useState(match.teamAScore?.toString() ?? "");
  const [scoreB, setScoreB] = useState(match.teamBScore?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  if (!teamA || !teamB) {
    return <p className="text-xs text-white/40 text-center py-1">Waiting on the previous round…</p>;
  }

  const save = () => {
    const a = Number(scoreA);
    const b = Number(scoreB);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      setError("Enter both scores.");
      return;
    }
    setError(null);
    startSave(async () => {
      const result = await setMatchScoreAction(match.id, level, tourneyId, a, b);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-white/5 px-2.5 py-2" data-testid="knockout-match-row">
      <div className="flex items-center gap-2 text-xs">
        <span className={`flex-1 truncate ${match.winnerTeamId === teamA.id ? "font-semibold" : ""}`}>
          {teamA.playerAName} &amp; {teamA.playerBName}
        </span>
        <input
          type="number"
          value={scoreA}
          onChange={(e) => setScoreA(e.target.value)}
          disabled={locked}
          className="w-12 rounded bg-white/5 border border-[var(--color-border)] px-1.5 py-1 text-center text-sm outline-none focus:border-[var(--color-community)] disabled:opacity-50"
        />
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className={`flex-1 truncate ${match.winnerTeamId === teamB.id ? "font-semibold" : ""}`}>
          {teamB.playerAName} &amp; {teamB.playerBName}
        </span>
        <input
          type="number"
          value={scoreB}
          onChange={(e) => setScoreB(e.target.value)}
          disabled={locked}
          className="w-12 rounded bg-white/5 border border-[var(--color-border)] px-1.5 py-1 text-center text-sm outline-none focus:border-[var(--color-community)] disabled:opacity-50"
        />
      </div>
      {!locked && (
        <button
          type="button"
          disabled={isSaving}
          onClick={save}
          className="self-end rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-white/70 hover:bg-white/5 disabled:opacity-60"
        >
          {isSaving ? "Saving…" : match.winnerTeamId ? "Update Score" : "Save Score"}
        </button>
      )}
      {error && <p className="text-xs text-[var(--color-negative)]">{error}</p>}
    </div>
  );
}

function RegenerateBracketButton({ level, tourneyId }: { level: TourneyLevel; tourneyId: string }) {
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
              "Regenerate the knockout bracket? This deletes every knockout match and any points already awarded from them, and lets you re-confirm which teams advance from the groups."
            )
          ) {
            return;
          }
          startClear(async () => {
            const result = await clearKnockoutBracketAction(level, tourneyId);
            if (result?.error) setError(result.error);
          });
        }}
        className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isClearing ? "Regenerating…" : "Regenerate Bracket"}
      </button>
      {error && <p className="text-xs text-[var(--color-negative)]">{error}</p>}
    </div>
  );
}
