"use client";

import { useMemo, useState, useTransition } from "react";
import { generateBracketAction, setAllMatchScoresAction } from "../actions";
import type { TourneyGroupWithStandings } from "@/lib/tourneys";
import {
  bestNextPlaceCandidates,
  computeDefaultQualifiers,
  computeGroupStandings,
} from "@/lib/types";
import type { GroupStandingsForQualifiers, TourneyLevel, TourneyMatch, TourneyTeam } from "@/lib/types";

type ScoreState = Record<string, { a: string; b: string }>;

function initialScores(groups: TourneyGroupWithStandings[]): ScoreState {
  const state: ScoreState = {};
  for (const g of groups) {
    for (const m of g.matches) {
      state[m.id] = { a: m.teamAScore?.toString() ?? "", b: m.teamBScore?.toString() ?? "" };
    }
  }
  return state;
}

export default function GroupStageSection({
  level,
  tourneyId,
  groups,
  locked,
  qualifiersPerGroup,
  wildcardCount,
}: {
  level: TourneyLevel;
  tourneyId: string;
  groups: TourneyGroupWithStandings[];
  locked: boolean;
  qualifiersPerGroup: number;
  wildcardCount: number;
}) {
  // Resets every input back to the persisted truth whenever a save lands —
  // this is the "tables pop up" moment: what you typed becomes the record.
  const persistedSignature = useMemo(
    () => groups.flatMap((g) => g.matches.map((m) => `${m.id}:${m.teamAScore}:${m.teamBScore}`)).join("|"),
    [groups]
  );
  const [scores, setScores] = useState<ScoreState>(() => initialScores(groups));
  const [syncedSignature, setSyncedSignature] = useState(persistedSignature);
  if (persistedSignature !== syncedSignature) {
    setSyncedSignature(persistedSignature);
    setScores(initialScores(groups));
  }

  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  const setScore = (matchId: string, side: "a" | "b", value: string) => {
    setScores((prev) => ({ ...prev, [matchId]: { a: prev[matchId]?.a ?? "", b: prev[matchId]?.b ?? "", [side]: value } }));
  };

  // Live standings preview: merges whatever's currently typed (even if
  // unsaved) into each group's matches, so the table updates as you type
  // across every court, not just after each individual save.
  const previewGroups = groups.map((g) => {
    const previewMatches: TourneyMatch[] = g.matches.map((m) => {
      const entry = scores[m.id];
      const a = entry ? Number(entry.a) : NaN;
      const b = entry ? Number(entry.b) : NaN;
      const valid = Boolean(entry) && entry.a !== "" && entry.b !== "" && Number.isFinite(a) && Number.isFinite(b) && a !== b;
      return valid ? { ...m, teamAScore: a, teamBScore: b } : m;
    });
    const teamIds = g.teams.map((t) => t.id);
    return { ...g, standings: computeGroupStandings(teamIds, previewMatches) };
  });

  const allScored = groups.every((g) => g.matches.every((m) => m.teamAScore !== null && m.teamBScore !== null));

  const saveAll = () => {
    const entries: { matchId: string; teamAScore: number; teamBScore: number }[] = [];
    for (const g of groups) {
      for (const m of g.matches) {
        const entry = scores[m.id];
        if (!entry || entry.a === "" || entry.b === "") continue;
        const a = Number(entry.a);
        const b = Number(entry.b);
        if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) continue;
        if (m.teamAScore === a && m.teamBScore === b) continue; // unchanged
        entries.push({ matchId: m.id, teamAScore: a, teamBScore: b });
      }
    }
    if (entries.length === 0) {
      setError("No new or changed scores to save.");
      return;
    }
    setError(null);
    startSave(async () => {
      const result = await setAllMatchScoresAction(level, tourneyId, entries);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {previewGroups.map((g) => (
        <div key={g.group.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-community)" }}>
            {g.group.name}
          </h3>

          <StandingsTable teams={g.teams} standings={g.standings} />

          <div className="flex flex-col gap-1.5 mt-3">
            {g.matches.map((m) => (
              <MatchScoreRow
                key={m.id}
                match={m}
                teams={g.teams}
                locked={locked}
                scoreA={scores[m.id]?.a ?? ""}
                scoreB={scores[m.id]?.b ?? ""}
                onChangeA={(v) => setScore(m.id, "a", v)}
                onChangeB={(v) => setScore(m.id, "b", v)}
              />
            ))}
            {g.matches.length === 0 && (
              <p className="text-xs text-white/40 text-center py-1">Only one team — advances automatically.</p>
            )}
          </div>
        </div>
      ))}

      {!locked && (
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            disabled={isSaving}
            onClick={saveAll}
            className="rounded-lg bg-[var(--color-community)] text-black font-medium px-4 py-2 text-sm disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save All Scores"}
          </button>
          {error && <p className="text-xs text-[var(--color-negative)]">{error}</p>}
        </div>
      )}

      {!locked && allScored && (
        <GenerateBracketForm
          level={level}
          tourneyId={tourneyId}
          groups={groups}
          qualifiersPerGroup={qualifiersPerGroup}
          wildcardCount={wildcardCount}
        />
      )}
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
  locked,
  scoreA,
  scoreB,
  onChangeA,
  onChangeB,
}: {
  match: TourneyMatch;
  teams: TourneyTeam[];
  locked: boolean;
  scoreA: string;
  scoreB: string;
  onChangeA: (value: string) => void;
  onChangeB: (value: string) => void;
}) {
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const teamA = match.teamAId ? teamsById.get(match.teamAId) : null;
  const teamB = match.teamBId ? teamsById.get(match.teamBId) : null;
  if (!teamA || !teamB) return null;

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-white/5 px-2.5 py-2" data-testid="group-match-row">
      <div className="flex items-center gap-2 text-xs">
        <span className={`flex-1 truncate ${match.winnerTeamId === teamA.id ? "font-semibold" : ""}`}>
          {teamA.playerAName} &amp; {teamA.playerBName}
        </span>
        <input
          type="number"
          value={scoreA}
          onChange={(e) => onChangeA(e.target.value)}
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
          onChange={(e) => onChangeB(e.target.value)}
          disabled={locked}
          className="w-12 rounded bg-white/5 border border-[var(--color-border)] px-1.5 py-1 text-center text-sm outline-none focus:border-[var(--color-community)] disabled:opacity-50"
        />
      </div>
    </div>
  );
}

function GenerateBracketForm({
  level,
  tourneyId,
  groups,
  qualifiersPerGroup,
  wildcardCount,
}: {
  level: TourneyLevel;
  tourneyId: string;
  groups: TourneyGroupWithStandings[];
  qualifiersPerGroup: number;
  wildcardCount: number;
}) {
  const groupsForQualifiers: GroupStandingsForQualifiers[] = groups.map((g) => ({
    groupId: g.group.id,
    groupName: g.group.name,
    standings: g.standings,
  }));
  const requiredCount = groups.length * qualifiersPerGroup + wildcardCount;

  const [selected, setSelected] = useState<Set<string>>(() =>
    computeDefaultQualifiers(groupsForQualifiers, qualifiersPerGroup, wildcardCount)
  );
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();

  const toggle = (teamId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const wildcardCandidates = wildcardCount > 0 ? bestNextPlaceCandidates(groupsForQualifiers, qualifiersPerGroup) : [];
  const teamsById = new Map(groups.flatMap((g) => g.teams).map((t) => [t.id, t]));
  const canGenerate = selected.size === requiredCount;

  return (
    <div className="rounded-xl border border-[var(--color-community)] p-3 flex flex-col gap-3">
      <p className="text-xs uppercase tracking-wide text-white/40">
        Confirm qualifiers — {selected.size} / {requiredCount} selected
      </p>

      {groups.map((g) => (
        <div key={g.group.id} className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-white/60">{g.group.name}</p>
          {g.standings.map((s, i) => {
            const team = teamsById.get(s.teamId);
            if (!team) return null;
            return (
              <label key={s.teamId} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  data-testid="qualifier-checkbox"
                  checked={selected.has(s.teamId)}
                  onChange={() => toggle(s.teamId)}
                />
                <span className="flex-1 truncate">
                  {team.playerAName} &amp; {team.playerBName}
                </span>
                <span className="text-xs text-white/40 tabular-nums shrink-0">
                  #{i + 1} · {s.wins}-{s.losses} · {s.scoreDiff > 0 ? "+" : ""}
                  {s.scoreDiff}
                </span>
              </label>
            );
          })}
        </div>
      ))}

      {wildcardCandidates.length > 0 && (
        <div className="rounded-lg bg-white/5 p-2 flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-white/40">Best 3rd Place (by point diff)</p>
          {wildcardCandidates.map((c) => {
            const team = teamsById.get(c.teamId);
            if (!team) return null;
            return (
              <label key={c.teamId} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  data-testid="qualifier-checkbox"
                  checked={selected.has(c.teamId)}
                  onChange={() => toggle(c.teamId)}
                />
                <span className="flex-1 truncate">
                  {team.playerAName} &amp; {team.playerBName}
                </span>
                <span className="text-xs text-white/40 tabular-nums shrink-0">
                  {c.groupName} · {c.scoreDiff > 0 ? "+" : ""}
                  {c.scoreDiff}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <p className="text-xs text-white/40">
        Uncheck a team to disqualify it, then check another anywhere above to fill its slot — the best remaining
        teams by point differential are listed first.
      </p>

      <button
        type="button"
        disabled={isGenerating || !canGenerate}
        onClick={() =>
          startGenerate(async () => {
            const result = await generateBracketAction(level, tourneyId, Array.from(selected));
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
