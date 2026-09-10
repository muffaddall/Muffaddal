"use client";

import { useState, useTransition } from "react";
import { clearGroupsAction, generateBracketAction, setMatchScoreAction } from "./actions";
import type { TourneyGroupWithStandings } from "@/lib/tourneys";
import type { TourneyLevel, TourneyMatch, TourneyTeam } from "@/lib/types";

export default function GroupStageSection({
  level,
  tourneyId,
  groups,
  locked,
}: {
  level: TourneyLevel;
  tourneyId: string;
  groups: TourneyGroupWithStandings[];
  locked: boolean;
}) {
  const allScored = groups.every((g) => g.matches.every((m) => m.teamAScore !== null && m.teamBScore !== null));

  return (
    <div className="flex flex-col gap-5">
      {!locked && <RegenerateGroupsButton level={level} tourneyId={tourneyId} />}

      {groups.map((g) => (
        <div key={g.group.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-community)" }}>
            {g.group.name}
          </h3>

          <StandingsTable teams={g.teams} standings={g.standings} />

          <div className="flex flex-col gap-1.5 mt-3">
            {g.matches.map((m) => (
              <MatchScoreRow key={m.id} match={m} teams={g.teams} level={level} tourneyId={tourneyId} locked={locked} />
            ))}
            {g.matches.length === 0 && (
              <p className="text-xs text-white/40 text-center py-1">Only one team — advances automatically.</p>
            )}
          </div>
        </div>
      ))}

      {!locked && allScored && <GenerateBracketForm level={level} tourneyId={tourneyId} groups={groups} />}
    </div>
  );
}

function StandingsTable({
  teams,
  standings,
}: {
  teams: TourneyTeam[];
  standings: { teamId: string; wins: number; losses: number; scoreDiff: number }[];
}) {
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-white/40">
          <th className="text-left font-normal pb-1">Team</th>
          <th className="text-right font-normal pb-1">W-L</th>
          <th className="text-right font-normal pb-1">Diff</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((s, i) => {
          const team = teamsById.get(s.teamId);
          if (!team) return null;
          return (
            <tr key={s.teamId} className={i === 0 ? "font-semibold" : "text-white/70"}>
              <td className="py-0.5 truncate">
                {team.playerAName} &amp; {team.playerBName}
              </td>
              <td className="py-0.5 text-right tabular-nums">
                {s.wins}-{s.losses}
              </td>
              <td className="py-0.5 text-right tabular-nums">
                {s.scoreDiff > 0 ? "+" : ""}
                {s.scoreDiff}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function MatchScoreRow({
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

  if (!teamA || !teamB) return null;

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
    <div className="flex flex-col gap-1 rounded-lg bg-white/5 px-2.5 py-2" data-testid="group-match-row">
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

function GenerateBracketForm({
  level,
  tourneyId,
  groups,
}: {
  level: TourneyLevel;
  tourneyId: string;
  groups: TourneyGroupWithStandings[];
}) {
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(groups.filter((g) => g.standings.length > 0).map((g) => [g.group.id, g.standings[0].teamId]))
  );
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();

  const advancingTeamIds = Object.values(selected);

  return (
    <div className="rounded-xl border border-[var(--color-community)] p-3 flex flex-col gap-2">
      <p className="text-xs uppercase tracking-wide text-white/40">Confirm advancing team per group</p>
      {groups.map((g) => {
        const teamsById = new Map(g.teams.map((t) => [t.id, t]));
        return (
          <label key={g.group.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-white/70">{g.group.name}</span>
            <select
              value={selected[g.group.id] ?? ""}
              onChange={(e) => setSelected((prev) => ({ ...prev, [g.group.id]: e.target.value }))}
              className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2 py-1 text-sm outline-none focus:border-[var(--color-community)]"
            >
              {g.standings.map((s) => {
                const team = teamsById.get(s.teamId);
                return (
                  <option key={s.teamId} value={s.teamId}>
                    {team ? `${team.playerAName} & ${team.playerBName}` : "Unknown"} ({s.wins}-{s.losses})
                  </option>
                );
              })}
            </select>
          </label>
        );
      })}
      <button
        type="button"
        disabled={isGenerating}
        onClick={() =>
          startGenerate(async () => {
            const result = await generateBracketAction(level, tourneyId, advancingTeamIds);
            if (result?.error) setError(result.error);
          })
        }
        className="rounded-lg bg-[var(--color-community)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {isGenerating ? "Generating…" : "Generate Knockout Bracket"}
      </button>
      {error && <p className="text-xs text-[var(--color-negative)]">{error}</p>}
    </div>
  );
}

function RegenerateGroupsButton({ level, tourneyId }: { level: TourneyLevel; tourneyId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isClearing, startClear] = useTransition();

  return (
    <div className="self-end flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isClearing}
        onClick={() => {
          if (!window.confirm("Regenerate groups? This deletes all group fixtures, scores, and any points already awarded from them.")) {
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
