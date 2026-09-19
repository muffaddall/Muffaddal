"use client";

import { useState, useTransition } from "react";
import { clearKnockoutBracketAction, setMatchScoreAction, swapKnockoutTeamsAction } from "../actions";
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

  const round0Matches = rounds.get(0) ?? [];
  const round0Started = round0Matches.some((m) => m.teamAScore !== null || m.teamBScore !== null);

  return (
    <div className="flex flex-col gap-5">
      <RegenerateBracketButton level={level} tourneyId={tourneyId} />

      {!locked && !round0Started && round0Matches.length > 1 && (
        <KnockoutBracketEditor level={level} tourneyId={tourneyId} matches={round0Matches} teams={teams} />
      )}

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
      {match.forfeit && <p className="text-[10px] uppercase tracking-wide text-[var(--color-negative)]">Forfeit</p>}
      <div className="flex items-center gap-2 text-xs">
        <span className={`flex-1 truncate ${match.winnerTeamId === teamA.id ? "font-semibold" : ""}`}>
          {teamA.disqualified && (
            <span className="mr-1 rounded-full border border-[var(--color-negative)] px-1 py-0 text-[9px] uppercase tracking-wide text-[var(--color-negative)]">
              DQ
            </span>
          )}
          {teamA.noShow && (
            <span className="mr-1 rounded-full border border-white/40 px-1 py-0 text-[9px] uppercase tracking-wide text-white/60">
              NS
            </span>
          )}
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
          {teamB.disqualified && (
            <span className="mr-1 rounded-full border border-[var(--color-negative)] px-1 py-0 text-[9px] uppercase tracking-wide text-[var(--color-negative)]">
              DQ
            </span>
          )}
          {teamB.noShow && (
            <span className="mr-1 rounded-full border border-white/40 px-1 py-0 text-[9px] uppercase tracking-wide text-white/60">
              NS
            </span>
          )}
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

function KnockoutBracketEditor({
  level,
  tourneyId,
  matches,
  teams,
}: {
  level: TourneyLevel;
  tourneyId: string;
  matches: TourneyMatch[];
  teams: TourneyTeam[];
}) {
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const slots = matches.flatMap((m) => [m.teamAId, m.teamBId]).filter((id): id is string => !!id);
  const [dragging, setDragging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMoving, startMove] = useTransition();

  const swap = (teamAId: string, teamBId: string) => {
    if (teamAId === teamBId) return;
    setError(null);
    startMove(async () => {
      const result = await swapKnockoutTeamsAction(teamAId, teamBId, level, tourneyId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col gap-2">
      <p className="text-xs uppercase tracking-wide text-white/40">
        Move a team into a different bracket slot — drag it onto another team to swap, or use the dropdown on mobile
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {matches.map((m) => (
          <div
            key={m.id}
            className="rounded-lg bg-white/5 border border-dashed border-white/15 p-2 flex flex-col gap-1 min-h-[3rem]"
          >
            {[m.teamAId, m.teamBId]
              .filter((id): id is string => !!id)
              .map((teamId) => {
                const t = teamsById.get(teamId);
                if (!t) return null;
                return (
                  <div
                    key={teamId}
                    draggable
                    onDragStart={() => setDragging(teamId)}
                    onDragEnd={() => setDragging(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dragging && swap(dragging, teamId)}
                    className="flex items-center justify-between gap-2 rounded bg-white/10 px-2 py-1 cursor-grab active:cursor-grabbing"
                  >
                    <span className="text-xs truncate">
                      {t.playerAName} &amp; {t.playerBName}
                    </span>
                    <select
                      aria-label={`Swap ${t.playerAName} & ${t.playerBName} with another team`}
                      value=""
                      disabled={isMoving}
                      onChange={(e) => e.target.value && swap(teamId, e.target.value)}
                      className="shrink-0 rounded bg-white/10 border border-white/15 text-[10px] px-1 py-0.5 outline-none"
                    >
                      <option value="">Swap with…</option>
                      {slots
                        .filter((otherId) => otherId !== teamId && otherId !== m.teamAId && otherId !== m.teamBId)
                        .map((otherId) => {
                          const other = teamsById.get(otherId);
                          return other ? (
                            <option key={otherId} value={otherId}>
                              {other.playerAName} &amp; {other.playerBName}
                            </option>
                          ) : null;
                        })}
                    </select>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
      {isMoving && <p className="text-xs text-white/40">Moving…</p>}
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
