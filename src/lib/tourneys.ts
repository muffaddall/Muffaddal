import "server-only";
import { supabase } from "@/lib/supabase";
import type {
  Tourney,
  TourneyBudgetLine,
  TourneyBudgetLineType,
  TourneyFormat,
  TourneyGroup,
  TourneyLeaderboardEntry,
  TourneyLevel,
  TourneyLoyaltyReward,
  TourneyLoyaltyStatus,
  TourneyMatch,
  TourneyMatchStage,
  TourneyPlayer,
  TourneyPlayerStats,
  TourneyStanding,
  TourneyStatus,
  TourneyTeam,
} from "@/lib/types";
import {
  DEFAULT_TOURNEY_POINTS,
  TOURNEY_DEFAULT_FINAL_POINTS,
  TOURNEY_DEFAULT_GROUP_WIN_POINTS,
  TOURNEY_DEFAULT_JOIN_POINTS,
  TOURNEY_DEFAULT_QUARTERFINAL_POINTS,
  TOURNEY_DEFAULT_SEMIFINAL_POINTS,
  computeGroupStandings,
  computeLoyaltyStatus,
  courtFeePresetLines,
  formatQualifierCount,
  isValidBracketSize,
  pointsForMatchWin,
  roundNameForSize,
  type TourneyPointsConfig,
} from "@/lib/types";

// ---- Row types + mappers ----

type TourneyRow = {
  id: string;
  level: string;
  name: string;
  date: string;
  status: string;
  format_id?: string | null;
  qualifiers_per_group?: number;
  wildcard_count?: number;
  has_knockout?: boolean;
  join_points?: number;
  group_win_points?: number;
  quarterfinal_points?: number;
  semifinal_points?: number;
  final_points?: number;
};
function tourneyFromRow(row: TourneyRow): Tourney {
  return {
    id: row.id,
    level: row.level as TourneyLevel,
    name: row.name,
    date: row.date,
    status: row.status as TourneyStatus,
    formatId: row.format_id ?? null,
    qualifiersPerGroup: row.qualifiers_per_group ?? 1,
    wildcardCount: row.wildcard_count ?? 0,
    hasKnockout: row.has_knockout ?? true,
    joinPoints: row.join_points ?? TOURNEY_DEFAULT_JOIN_POINTS,
    groupWinPoints: row.group_win_points ?? TOURNEY_DEFAULT_GROUP_WIN_POINTS,
    quarterfinalPoints: row.quarterfinal_points ?? TOURNEY_DEFAULT_QUARTERFINAL_POINTS,
    semifinalPoints: row.semifinal_points ?? TOURNEY_DEFAULT_SEMIFINAL_POINTS,
    finalPoints: row.final_points ?? TOURNEY_DEFAULT_FINAL_POINTS,
  };
}

type PlayerRow = { id: string; name: string; country: string | null };
function playerFromRow(row: PlayerRow): TourneyPlayer {
  return { id: row.id, name: row.name, country: row.country };
}

type TeamRow = {
  id: string;
  tourney_id: string;
  player_a_id: string;
  player_b_id: string;
  player_a_paid?: boolean;
  player_b_paid?: boolean;
  player_a_fee?: number;
  player_b_fee?: number;
  disqualified?: boolean;
};

type GroupRow = { id: string; tourney_id: string; name: string; sort_order: number };
function groupFromRow(row: GroupRow): TourneyGroup {
  return { id: row.id, tourneyId: row.tourney_id, name: row.name, sortOrder: row.sort_order };
}

type MatchRow = {
  id: string;
  tourney_id: string;
  stage: string;
  round_name: string | null;
  group_id: string | null;
  round_index: number | null;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a_score: number | null;
  team_b_score: number | null;
  winner_team_id: string | null;
  forfeit?: boolean;
  sort_order: number;
};
function matchFromRow(row: MatchRow): TourneyMatch {
  return {
    id: row.id,
    tourneyId: row.tourney_id,
    stage: row.stage as TourneyMatchStage,
    roundName: row.round_name ?? null,
    groupId: row.group_id ?? null,
    roundIndex: row.round_index ?? null,
    teamAId: row.team_a_id ?? null,
    teamBId: row.team_b_id ?? null,
    teamAScore: row.team_a_score ?? null,
    teamBScore: row.team_b_score ?? null,
    winnerTeamId: row.winner_team_id ?? null,
    forfeit: row.forfeit ?? false,
    sortOrder: row.sort_order,
  };
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- Tourneys ----

export async function getTourneysByLevel(level: TourneyLevel): Promise<Tourney[]> {
  const { data, error } = await supabase
    .from("tourneys")
    .select("*")
    .eq("level", level)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => tourneyFromRow(r as TourneyRow));
}

export async function getAllTourneys(): Promise<Tourney[]> {
  const { data, error } = await supabase.from("tourneys").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => tourneyFromRow(r as TourneyRow));
}

export async function getTourney(id: string): Promise<Tourney | null> {
  const { data, error } = await supabase.from("tourneys").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? tourneyFromRow(data as TourneyRow) : null;
}

export async function createTourney(level: TourneyLevel, name: string, date: string): Promise<string> {
  const { data, error } = await supabase
    .from("tourneys")
    .insert({
      level,
      name,
      date,
      status: "setup",
      format_id: null,
      qualifiers_per_group: 1,
      wildcard_count: 0,
      has_knockout: true,
      join_points: TOURNEY_DEFAULT_JOIN_POINTS,
      group_win_points: TOURNEY_DEFAULT_GROUP_WIN_POINTS,
      quarterfinal_points: TOURNEY_DEFAULT_QUARTERFINAL_POINTS,
      semifinal_points: TOURNEY_DEFAULT_SEMIFINAL_POINTS,
      final_points: TOURNEY_DEFAULT_FINAL_POINTS,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

/** Edits this tourney's own points scale. Only affects points awarded from here on — matches/joins already recorded keep whatever points they were given at the time. */
export async function updateTourneyPoints(tourneyId: string, points: TourneyPointsConfig): Promise<void> {
  const { error } = await supabase
    .from("tourneys")
    .update({
      join_points: points.joinPoints,
      group_win_points: points.groupWinPoints,
      quarterfinal_points: points.quarterfinalPoints,
      semifinal_points: points.semifinalPoints,
      final_points: points.finalPoints,
    })
    .eq("id", tourneyId);
  if (error) throw new Error(error.message);
}

/**
 * Deletes a tournament and everything scoped to it — teams, groups,
 * matches, and any points awarded from them. Fully self-contained (never
 * touches another tournament), so this is always safe to do. Deletes are
 * explicit rather than relying on FK cascade, since the mock client used
 * for local testing doesn't simulate cascade.
 */
export async function deleteTourney(tourneyId: string): Promise<void> {
  const { data: groupRows, error: groupFetchError } = await supabase
    .from("tourney_groups")
    .select("id")
    .eq("tourney_id", tourneyId);
  if (groupFetchError) throw new Error(groupFetchError.message);
  const groupIds = (groupRows ?? []).map((r) => (r as { id: string }).id);

  if (groupIds.length > 0) {
    const { error } = await supabase.from("tourney_group_teams").delete().in("group_id", groupIds);
    if (error) throw new Error(error.message);
  }

  const { error: pointsError } = await supabase.from("tourney_points_events").delete().eq("tourney_id", tourneyId);
  if (pointsError) throw new Error(pointsError.message);

  const { error: matchError } = await supabase.from("tourney_matches").delete().eq("tourney_id", tourneyId);
  if (matchError) throw new Error(matchError.message);

  const { error: groupError } = await supabase.from("tourney_groups").delete().eq("tourney_id", tourneyId);
  if (groupError) throw new Error(groupError.message);

  const { error: teamError } = await supabase.from("tourney_teams").delete().eq("tourney_id", tourneyId);
  if (teamError) throw new Error(teamError.message);

  const { error: budgetError } = await supabase.from("tourney_budget_lines").delete().eq("tourney_id", tourneyId);
  if (budgetError) throw new Error(budgetError.message);

  const { error: tourneyError } = await supabase.from("tourneys").delete().eq("id", tourneyId);
  if (tourneyError) throw new Error(tourneyError.message);
}

// ---- Players ----

export async function getAllPlayers(): Promise<TourneyPlayer[]> {
  const { data, error } = await supabase.from("tourney_players").select("*").order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => playerFromRow(r as PlayerRow));
}

export async function getPlayer(id: string): Promise<TourneyPlayer | null> {
  const { data, error } = await supabase.from("tourney_players").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? playerFromRow(data as PlayerRow) : null;
}

/**
 * Deletes a player and every team they were ever part of, plus any
 * matches and points tied to those teams — including the partner's share
 * of that history, since a team/match row is shared between both players
 * and can't be split down the middle. Fine for a mistaken/unused profile;
 * for a player who's actually played, this also erases their partners'
 * record of playing with them. Explicit deletes, not FK cascade, since
 * the mock client used for local testing doesn't simulate cascade.
 */
export async function deletePlayer(playerId: string): Promise<void> {
  const { data: teamRows, error: teamFetchError } = await supabase
    .from("tourney_teams")
    .select("*")
    .or(`player_a_id.eq.${playerId},player_b_id.eq.${playerId}`);
  if (teamFetchError) throw new Error(teamFetchError.message);
  const teamIds = (teamRows ?? []).map((r) => (r as TeamRow).id);

  let matchIds: string[] = [];
  if (teamIds.length > 0) {
    const orExpr = teamIds.map((id) => `team_a_id.eq.${id},team_b_id.eq.${id}`).join(",");
    const { data: matchRows, error: matchFetchError } = await supabase.from("tourney_matches").select("id").or(orExpr);
    if (matchFetchError) throw new Error(matchFetchError.message);
    matchIds = (matchRows ?? []).map((r) => (r as { id: string }).id);
  }

  if (matchIds.length > 0) {
    const { error } = await supabase.from("tourney_points_events").delete().in("match_id", matchIds);
    if (error) throw new Error(error.message);
  }
  if (teamIds.length > 0) {
    const { error } = await supabase.from("tourney_points_events").delete().in("team_id", teamIds);
    if (error) throw new Error(error.message);
  }
  const { error: playerPointsError } = await supabase.from("tourney_points_events").delete().eq("player_id", playerId);
  if (playerPointsError) throw new Error(playerPointsError.message);

  if (matchIds.length > 0) {
    const { error } = await supabase.from("tourney_matches").delete().in("id", matchIds);
    if (error) throw new Error(error.message);
  }

  if (teamIds.length > 0) {
    const { error: gtError } = await supabase.from("tourney_group_teams").delete().in("team_id", teamIds);
    if (gtError) throw new Error(gtError.message);

    const { error: teamDeleteError } = await supabase.from("tourney_teams").delete().in("id", teamIds);
    if (teamDeleteError) throw new Error(teamDeleteError.message);
  }

  const { error: rewardsError } = await supabase.from("tourney_loyalty_rewards").delete().eq("player_id", playerId);
  if (rewardsError) throw new Error(rewardsError.message);

  const { error: playerDeleteError } = await supabase.from("tourney_players").delete().eq("id", playerId);
  if (playerDeleteError) throw new Error(playerDeleteError.message);
}

/** Manually add a player from the players directory, not tied to a tournament entry. Same name-matching as team entry, so it won't create a duplicate of someone already added via a team. */
export async function addPlayer(name: string, country: string | null): Promise<string> {
  return findOrCreatePlayer(name, country);
}

/** Matches an existing player by name (case/whitespace-insensitive) so the same person keeps one running profile across tourneys, instead of creating a fresh one every time you type their name. */
async function findOrCreatePlayer(name: string, country: string | null): Promise<string> {
  const trimmed = name.trim();
  const players = await getAllPlayers();
  const existing = players.find((p) => p.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    if (country && !existing.country) {
      await supabase.from("tourney_players").update({ country }).eq("id", existing.id);
    }
    return existing.id;
  }
  const { data, error } = await supabase
    .from("tourney_players")
    .insert({ name: trimmed, country: country || null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

// ---- Teams ----

export async function getTeamsForTourney(tourneyId: string): Promise<TourneyTeam[]> {
  const { data, error } = await supabase.from("tourney_teams").select("*").eq("tourney_id", tourneyId);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as TeamRow[];
  if (rows.length === 0) return [];
  const players = await getAllPlayers();
  const byId = new Map(players.map((p) => [p.id, p]));
  return rows.map((row) => ({
    id: row.id,
    tourneyId: row.tourney_id,
    playerAId: row.player_a_id,
    playerAName: byId.get(row.player_a_id)?.name ?? "Unknown",
    playerAPaid: row.player_a_paid ?? false,
    playerAFee: row.player_a_fee ?? 0,
    playerBId: row.player_b_id,
    playerBName: byId.get(row.player_b_id)?.name ?? "Unknown",
    playerBPaid: row.player_b_paid ?? false,
    playerBFee: row.player_b_fee ?? 0,
    disqualified: row.disqualified ?? false,
  }));
}

export async function createTeam(input: {
  tourneyId: string;
  playerAName: string;
  playerACountry: string | null;
  playerBName: string;
  playerBCountry: string | null;
}): Promise<void> {
  const [playerAId, playerBId, tourney] = await Promise.all([
    findOrCreatePlayer(input.playerAName, input.playerACountry),
    findOrCreatePlayer(input.playerBName, input.playerBCountry),
    getTourney(input.tourneyId),
  ]);
  const joinPoints = tourney?.joinPoints ?? TOURNEY_DEFAULT_JOIN_POINTS;

  const { data, error } = await supabase
    .from("tourney_teams")
    .insert({
      tourney_id: input.tourneyId,
      player_a_id: playerAId,
      player_b_id: playerBId,
      player_a_paid: false,
      player_b_paid: false,
      player_a_fee: 0,
      player_b_fee: 0,
      disqualified: false,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const teamId = (data as { id: string }).id;

  const { error: pointsError } = await supabase.from("tourney_points_events").insert([
    { player_id: playerAId, tourney_id: input.tourneyId, team_id: teamId, reason: "join", points: joinPoints },
    { player_id: playerBId, tourney_id: input.tourneyId, team_id: teamId, reason: "join", points: joinPoints },
  ]);
  if (pointsError) throw new Error(pointsError.message);
}

export async function removeTeam(teamId: string): Promise<void> {
  const { error } = await supabase.from("tourney_teams").delete().eq("id", teamId);
  if (error) throw new Error(error.message);
}

export async function setTeamPaid(teamId: string, side: "a" | "b", paid: boolean): Promise<void> {
  const column = side === "a" ? "player_a_paid" : "player_b_paid";
  const { error } = await supabase.from("tourney_teams").update({ [column]: paid }).eq("id", teamId);
  if (error) throw new Error(error.message);
}

/** Sets what one half of a team owes — edited from the Budget Income page's Registrations dropdown, not a fixed price, since discounts are common. */
export async function setTeamFee(teamId: string, side: "a" | "b", fee: number): Promise<void> {
  const column = side === "a" ? "player_a_fee" : "player_b_fee";
  const { error } = await supabase.from("tourney_teams").update({ [column]: fee }).eq("id", teamId);
  if (error) throw new Error(error.message);
}

/**
 * Swaps out one or both halves of an already-entered team — for when a
 * partner changes. Resolves each name the same way team entry does
 * (findOrCreatePlayer), so picking an existing player from the combobox
 * reuses their profile. A genuinely new player brought in this way gets
 * the tourney's current join-points credit, same as joining fresh; the
 * outgoing player keeps whatever points they already earned on this team
 * (past matches happened as actually played, so that history isn't
 * touched or reassigned).
 */
export async function editTeam(input: {
  teamId: string;
  playerAName: string;
  playerACountry: string | null;
  playerBName: string;
  playerBCountry: string | null;
}): Promise<void> {
  const { data: teamRow, error: fetchError } = await supabase
    .from("tourney_teams")
    .select("*")
    .eq("id", input.teamId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!teamRow) throw new Error("Team not found.");
  const team = teamRow as TeamRow;

  const [newPlayerAId, newPlayerBId, tourney] = await Promise.all([
    findOrCreatePlayer(input.playerAName, input.playerACountry),
    findOrCreatePlayer(input.playerBName, input.playerBCountry),
    getTourney(team.tourney_id),
  ]);
  const joinPoints = tourney?.joinPoints ?? TOURNEY_DEFAULT_JOIN_POINTS;

  const { error: updateError } = await supabase
    .from("tourney_teams")
    .update({ player_a_id: newPlayerAId, player_b_id: newPlayerBId })
    .eq("id", input.teamId);
  if (updateError) throw new Error(updateError.message);

  const newlyJoined: string[] = [];
  if (newPlayerAId !== team.player_a_id) newlyJoined.push(newPlayerAId);
  if (newPlayerBId !== team.player_b_id) newlyJoined.push(newPlayerBId);
  if (newlyJoined.length > 0) {
    const { error: pointsError } = await supabase.from("tourney_points_events").insert(
      newlyJoined.map((playerId) => ({
        player_id: playerId,
        tourney_id: team.tourney_id,
        team_id: input.teamId,
        reason: "join",
        points: joinPoints,
      }))
    );
    if (pointsError) throw new Error(pointsError.message);
  }
}

/** Plain flag toggle, no side effects — used to undo a mistaken disqualification. Doesn't reopen or reverse any matches that were already forfeited. */
export async function setTeamDisqualified(teamId: string, disqualified: boolean): Promise<void> {
  const { error } = await supabase.from("tourney_teams").update({ disqualified }).eq("id", teamId);
  if (error) throw new Error(error.message);
}

/**
 * Disqualifies a team at any point during the live event. Every match this
 * team is still in but hasn't finished (group or knockout, either side)
 * gets forfeited to the opponent as a walkover — otherwise the group stage
 * or bracket could never finish waiting on a match that will now never be
 * played. Matches already scored before the DQ are untouched; the
 * disqualified side keeps whatever points it already earned.
 */
export async function disqualifyTeam(teamId: string): Promise<void> {
  const { data: teamRow, error: teamError } = await supabase
    .from("tourney_teams")
    .select("*")
    .eq("id", teamId)
    .maybeSingle();
  if (teamError) throw new Error(teamError.message);
  if (!teamRow) throw new Error("Team not found.");
  const tourneyId = (teamRow as TeamRow).tourney_id;

  const { error: dqError } = await supabase.from("tourney_teams").update({ disqualified: true }).eq("id", teamId);
  if (dqError) throw new Error(dqError.message);

  const { data: matchRows, error: matchFetchError } = await supabase
    .from("tourney_matches")
    .select("*")
    .eq("tourney_id", tourneyId)
    .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`);
  if (matchFetchError) throw new Error(matchFetchError.message);

  const pending = (matchRows ?? [])
    .map((r) => matchFromRow(r as MatchRow))
    .filter((m) => m.teamAId && m.teamBId && (m.teamAScore === null || m.teamBScore === null));

  for (const match of pending) {
    const opponentIsA = match.teamAId !== teamId;
    const teamAScore = opponentIsA ? 1 : 0;
    const teamBScore = opponentIsA ? 0 : 1;
    const winnerTeamId = (opponentIsA ? match.teamAId : match.teamBId) as string;

    const { error: scoreError } = await supabase
      .from("tourney_matches")
      .update({ team_a_score: teamAScore, team_b_score: teamBScore, winner_team_id: winnerTeamId, forfeit: true })
      .eq("id", match.id);
    if (scoreError) throw new Error(scoreError.message);

    await recomputeMatchPoints(tourneyId, match.id, match.stage, match.roundName, winnerTeamId);

    if (match.stage === "knockout" && match.roundIndex !== null) {
      await tryAdvanceKnockoutRound(tourneyId, match.roundIndex);
    }
  }
}

// ---- Groups + group-stage matches ----

const GROUP_NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Randomly splits the entered teams into groups of exactly `groupSizes`
 * (in order — doesn't have to be even, e.g. [3, 3, 4]) and generates the
 * full round-robin fixture list within each group. `qualifiersPerGroup`
 * and `wildcardCount` are recorded on the tourney itself so the qualifier
 * checklist on the During Event page knows the rule later — their sum
 * across all groups (plus wildcards) has to be a power of 2 so it can seed
 * a knockout bracket, but the group *sizes* no longer do.
 */
export async function generateGroups(
  tourneyId: string,
  groupSizes: number[],
  qualifiersPerGroup: number,
  wildcardCount: number,
  formatId: string | null,
  hasKnockout: boolean = true
): Promise<void> {
  const teams = await getTeamsForTourney(tourneyId);
  if (groupSizes.length === 0 || groupSizes.some((n) => n < 1)) {
    throw new Error("Enter at least one group with at least 1 team.");
  }
  const totalSize = groupSizes.reduce((s, n) => s + n, 0);
  if (totalSize !== teams.length) {
    throw new Error(`Group sizes add up to ${totalSize}, but ${teams.length} teams are entered.`);
  }
  if (hasKnockout) {
    const qualifierCount = formatQualifierCount(groupSizes, qualifiersPerGroup, wildcardCount);
    if (!isValidBracketSize(qualifierCount)) {
      throw new Error(
        "Qualifiers per group × groups + wildcards must be a power of 2 (2, 4, 8, 16…) so it can seed a bracket."
      );
    }
  }

  const shuffled = shuffle(teams);
  const groupTeamIds: string[][] = [];
  let cursor = 0;
  for (const size of groupSizes) {
    groupTeamIds.push(shuffled.slice(cursor, cursor + size).map((t) => t.id));
    cursor += size;
  }

  let matchSortOrder = 0;
  for (let i = 0; i < groupSizes.length; i++) {
    const { data: group, error } = await supabase
      .from("tourney_groups")
      .insert({ tourney_id: tourneyId, name: `Group ${GROUP_NAMES[i] ?? i + 1}`, sort_order: i })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const groupId = (group as { id: string }).id;

    const teamIds = groupTeamIds[i];
    const { error: gtError } = await supabase
      .from("tourney_group_teams")
      .insert(teamIds.map((teamId) => ({ group_id: groupId, team_id: teamId })));
    if (gtError) throw new Error(gtError.message);

    const fixtures: { team_a_id: string; team_b_id: string }[] = [];
    for (let a = 0; a < teamIds.length; a++) {
      for (let b = a + 1; b < teamIds.length; b++) {
        fixtures.push({ team_a_id: teamIds[a], team_b_id: teamIds[b] });
      }
    }
    if (fixtures.length > 0) {
      const { error: matchError } = await supabase.from("tourney_matches").insert(
        fixtures.map((f) => ({
          tourney_id: tourneyId,
          stage: "group",
          group_id: groupId,
          team_a_id: f.team_a_id,
          team_b_id: f.team_b_id,
          sort_order: matchSortOrder++,
        }))
      );
      if (matchError) throw new Error(matchError.message);
    }
  }

  const { error: statusError } = await supabase
    .from("tourneys")
    .update({
      status: "groups",
      qualifiers_per_group: qualifiersPerGroup,
      wildcard_count: wildcardCount,
      format_id: formatId,
      has_knockout: hasKnockout,
    })
    .eq("id", tourneyId);
  if (statusError) throw new Error(statusError.message);
}

/**
 * Marks a groups-only tourney (hasKnockout=false) as finished directly from
 * the group stage — group standings are the final result, there's no
 * bracket to generate. Requires every group match to have a score first.
 */
export async function finishTournamentWithoutBracket(tourneyId: string): Promise<void> {
  const matches = await getMatchesForTourney(tourneyId);
  const hasUnscoredGroupMatch = matches.some(
    (m) => m.stage === "group" && (m.teamAScore === null || m.teamBScore === null)
  );
  if (hasUnscoredGroupMatch) {
    throw new Error("Every group match needs a score before finishing the tournament.");
  }
  const { error } = await supabase.from("tourneys").update({ status: "completed" }).eq("id", tourneyId);
  if (error) throw new Error(error.message);
}

/**
 * Undoes the group draw entirely — deletes every group, its fixtures, and
 * any points already awarded from group matches — so you can reshuffle
 * with a different number of groups. Team entries are untouched. Deletes
 * are done explicitly rather than relying on FK cascade, since the mock
 * client used for local testing doesn't simulate cascade.
 */
export async function clearGroups(tourneyId: string): Promise<void> {
  const { data: matchRows, error: matchFetchError } = await supabase
    .from("tourney_matches")
    .select("id")
    .eq("tourney_id", tourneyId)
    .eq("stage", "group");
  if (matchFetchError) throw new Error(matchFetchError.message);
  const matchIds = (matchRows ?? []).map((r) => (r as { id: string }).id);

  if (matchIds.length > 0) {
    const { error: pointsError } = await supabase.from("tourney_points_events").delete().in("match_id", matchIds);
    if (pointsError) throw new Error(pointsError.message);
  }

  const { error: matchDeleteError } = await supabase
    .from("tourney_matches")
    .delete()
    .eq("tourney_id", tourneyId)
    .eq("stage", "group");
  if (matchDeleteError) throw new Error(matchDeleteError.message);

  const { data: groupRows, error: groupFetchError } = await supabase
    .from("tourney_groups")
    .select("id")
    .eq("tourney_id", tourneyId);
  if (groupFetchError) throw new Error(groupFetchError.message);
  const groupIds = (groupRows ?? []).map((r) => (r as { id: string }).id);

  if (groupIds.length > 0) {
    const { error: gtError } = await supabase.from("tourney_group_teams").delete().in("group_id", groupIds);
    if (gtError) throw new Error(gtError.message);
  }

  const { error: groupDeleteError } = await supabase.from("tourney_groups").delete().eq("tourney_id", tourneyId);
  if (groupDeleteError) throw new Error(groupDeleteError.message);

  const { error: statusError } = await supabase.from("tourneys").update({ status: "setup" }).eq("id", tourneyId);
  if (statusError) throw new Error(statusError.message);
}

/**
 * Moves a team into a different group — for special requests or seeding
 * changes after the draw. Always allowed, even mid-group-stage: any
 * matches (and points) that team already has in its old group are deleted,
 * and fresh round-robin fixtures are generated against whoever is
 * currently in the new group. Matches among the new group's other members
 * are untouched.
 */
export async function moveTeamToGroup(teamId: string, fromGroupId: string, toGroupId: string): Promise<void> {
  if (fromGroupId === toGroupId) return;

  const { data: groupRow, error: groupError } = await supabase
    .from("tourney_groups")
    .select("*")
    .eq("id", toGroupId)
    .maybeSingle();
  if (groupError) throw new Error(groupError.message);
  if (!groupRow) throw new Error("Group not found.");
  const tourneyId = (groupRow as GroupRow).tourney_id;

  const { data: oldMatchRows, error: oldMatchFetchError } = await supabase
    .from("tourney_matches")
    .select("id")
    .eq("group_id", fromGroupId)
    .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`);
  if (oldMatchFetchError) throw new Error(oldMatchFetchError.message);
  const oldMatchIds = (oldMatchRows ?? []).map((r) => (r as { id: string }).id);
  if (oldMatchIds.length > 0) {
    const { error: pointsError } = await supabase.from("tourney_points_events").delete().in("match_id", oldMatchIds);
    if (pointsError) throw new Error(pointsError.message);
    const { error: matchDeleteError } = await supabase.from("tourney_matches").delete().in("id", oldMatchIds);
    if (matchDeleteError) throw new Error(matchDeleteError.message);
  }

  const { error: removeError } = await supabase
    .from("tourney_group_teams")
    .delete()
    .eq("group_id", fromGroupId)
    .eq("team_id", teamId);
  if (removeError) throw new Error(removeError.message);

  const { error: addError } = await supabase
    .from("tourney_group_teams")
    .insert({ group_id: toGroupId, team_id: teamId });
  if (addError) throw new Error(addError.message);

  const newGroupTeamIds = (await getGroupTeamIds(toGroupId)).filter((id) => id !== teamId);
  if (newGroupTeamIds.length > 0) {
    const { count, error: countError } = await supabase
      .from("tourney_matches")
      .select("id", { count: "exact", head: true })
      .eq("tourney_id", tourneyId);
    if (countError) throw new Error(countError.message);
    let sortOrder = count ?? 0;

    const { error: insertError } = await supabase.from("tourney_matches").insert(
      newGroupTeamIds.map((opponentId) => ({
        tourney_id: tourneyId,
        stage: "group",
        group_id: toGroupId,
        team_a_id: teamId,
        team_b_id: opponentId,
        sort_order: sortOrder++,
      }))
    );
    if (insertError) throw new Error(insertError.message);
  }
}

export async function getGroupsForTourney(tourneyId: string): Promise<TourneyGroup[]> {
  const { data, error } = await supabase
    .from("tourney_groups")
    .select("*")
    .eq("tourney_id", tourneyId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => groupFromRow(r as GroupRow));
}

async function getGroupTeamIds(groupId: string): Promise<string[]> {
  const { data, error } = await supabase.from("tourney_group_teams").select("team_id").eq("group_id", groupId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => (r as { team_id: string }).team_id);
}

export type TourneyGroupWithStandings = {
  group: TourneyGroup;
  teams: TourneyTeam[];
  matches: TourneyMatch[];
  standings: TourneyStanding[];
};

export async function getGroupsWithStandings(tourneyId: string): Promise<TourneyGroupWithStandings[]> {
  const [groups, teams, matches] = await Promise.all([
    getGroupsForTourney(tourneyId),
    getTeamsForTourney(tourneyId),
    getMatchesForTourney(tourneyId),
  ]);
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  const result: TourneyGroupWithStandings[] = [];
  for (const group of groups) {
    const teamIds = await getGroupTeamIds(group.id);
    const groupTeams = teamIds.map((id) => teamsById.get(id)).filter((t): t is TourneyTeam => Boolean(t));
    const groupMatches = matches.filter((m) => m.groupId === group.id);
    const standings = computeGroupStandings(teamIds, groupMatches);
    result.push({ group, teams: groupTeams, matches: groupMatches, standings });
  }
  return result;
}

// ---- Matches: scoring + points ----

export async function getMatchesForTourney(tourneyId: string): Promise<TourneyMatch[]> {
  const { data, error } = await supabase
    .from("tourney_matches")
    .select("*")
    .eq("tourney_id", tourneyId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => matchFromRow(r as MatchRow));
}

async function recomputeMatchPoints(
  tourneyId: string,
  matchId: string,
  stage: TourneyMatchStage,
  roundName: string | null,
  winnerTeamId: string
): Promise<void> {
  const { error: deleteError } = await supabase.from("tourney_points_events").delete().eq("match_id", matchId);
  if (deleteError) throw new Error(deleteError.message);

  const [teamRes, tourney] = await Promise.all([
    supabase.from("tourney_teams").select("*").eq("id", winnerTeamId).maybeSingle(),
    getTourney(tourneyId),
  ]);
  if (teamRes.error) throw new Error(teamRes.error.message);
  if (!teamRes.data) return;
  const team = teamRes.data as TeamRow;
  const points = pointsForMatchWin(tourney ?? DEFAULT_TOURNEY_POINTS, stage, roundName);

  const { error: insertError } = await supabase.from("tourney_points_events").insert([
    { player_id: team.player_a_id, tourney_id: tourneyId, match_id: matchId, reason: "win", points },
    { player_id: team.player_b_id, tourney_id: tourneyId, match_id: matchId, reason: "win", points },
  ]);
  if (insertError) throw new Error(insertError.message);
}

/**
 * Records a match result and awards points to the winning pair. If this
 * was a knockout match and it was the last one in its round still
 * missing a winner, this also generates the next round (or marks the
 * tourney completed if it was the Final).
 */
export async function setMatchScore(matchId: string, teamAScore: number, teamBScore: number): Promise<void> {
  if (teamAScore === teamBScore) {
    throw new Error("Scores can't be tied — enter the actual result.");
  }
  const { data: matchRow, error: fetchError } = await supabase
    .from("tourney_matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!matchRow) throw new Error("Match not found.");
  const match = matchFromRow(matchRow as MatchRow);
  if (!match.teamAId || !match.teamBId) throw new Error("Match has no teams assigned yet.");

  const winnerTeamId = teamAScore > teamBScore ? match.teamAId : match.teamBId;

  const { error } = await supabase
    .from("tourney_matches")
    .update({ team_a_score: teamAScore, team_b_score: teamBScore, winner_team_id: winnerTeamId })
    .eq("id", matchId);
  if (error) throw new Error(error.message);

  await recomputeMatchPoints(match.tourneyId, matchId, match.stage, match.roundName, winnerTeamId);

  if (match.stage === "knockout" && match.roundIndex !== null) {
    await tryAdvanceKnockoutRound(match.tourneyId, match.roundIndex);
  }
}

export type MatchScoreInput = { matchId: string; teamAScore: number; teamBScore: number };

/**
 * Saves every given match score in one batch — lets the organizer type
 * scores for every court/group at once and commit them together instead of
 * saving match-by-match. Reuses setMatchScore's win/points logic per
 * match; one bad entry (e.g. a tie) is collected as a failure rather than
 * stopping the rest from saving.
 */
export async function setAllMatchScores(entries: MatchScoreInput[]): Promise<{ matchId: string; error: string }[]> {
  const failures: { matchId: string; error: string }[] = [];
  for (const entry of entries) {
    try {
      await setMatchScore(entry.matchId, entry.teamAScore, entry.teamBScore);
    } catch (e) {
      failures.push({ matchId: entry.matchId, error: e instanceof Error ? e.message : "Failed to save score." });
    }
  }
  return failures;
}

// ---- Knockout bracket ----

async function createKnockoutRound(tourneyId: string, teamIds: string[], roundIndex: number): Promise<void> {
  const roundName = roundNameForSize(teamIds.length);
  const rows = [];
  for (let i = 0; i < teamIds.length; i += 2) {
    rows.push({
      tourney_id: tourneyId,
      stage: "knockout",
      round_name: roundName,
      round_index: roundIndex,
      team_a_id: teamIds[i],
      team_b_id: teamIds[i + 1],
      sort_order: i / 2,
    });
  }
  const { error } = await supabase.from("tourney_matches").insert(rows);
  if (error) throw new Error(error.message);
}

/** Seeds the knockout bracket from the teams advancing out of the group stage (one per group, organizer-confirmed). Seeding is random; every round after that pairs adjacent bracket winners as usual. */
export async function generateKnockoutBracket(tourneyId: string, advancingTeamIds: string[]): Promise<void> {
  if (!isValidBracketSize(advancingTeamIds.length)) {
    throw new Error("Need a power-of-2 number of advancing teams (2, 4, 8, 16…) to seed a clean bracket.");
  }
  const seeded = shuffle(advancingTeamIds);
  await createKnockoutRound(tourneyId, seeded, 0);

  const { error } = await supabase.from("tourneys").update({ status: "knockout" }).eq("id", tourneyId);
  if (error) throw new Error(error.message);
}

/**
 * Swaps two teams' bracket slots in the first knockout round, before either
 * of their round-0 matches has a score — lets the organizer fix a seeding
 * mistake or reshuffle who plays whom without regenerating the whole
 * bracket. Later rounds don't exist yet at this point, so there's nothing
 * else to touch.
 */
export async function swapKnockoutTeams(tourneyId: string, teamAId: string, teamBId: string): Promise<void> {
  if (teamAId === teamBId) return;

  const { data: matchRows, error: matchFetchError } = await supabase
    .from("tourney_matches")
    .select("*")
    .eq("tourney_id", tourneyId)
    .eq("stage", "knockout")
    .eq("round_index", 0)
    .or(`team_a_id.eq.${teamAId},team_b_id.eq.${teamAId},team_a_id.eq.${teamBId},team_b_id.eq.${teamBId}`);
  if (matchFetchError) throw new Error(matchFetchError.message);

  const matches = (matchRows ?? []).map((r) => matchFromRow(r as MatchRow));
  const matchA = matches.find((m) => m.teamAId === teamAId || m.teamBId === teamAId);
  const matchB = matches.find((m) => m.teamAId === teamBId || m.teamBId === teamBId);
  if (!matchA || !matchB) throw new Error("Both teams must be in the first knockout round.");
  if (matchA.id === matchB.id) return; // already paired against each other — nothing to move

  if (matchA.teamAScore !== null || matchA.teamBScore !== null || matchB.teamAScore !== null || matchB.teamBScore !== null) {
    throw new Error("Can't move a team once its first-round match has a score.");
  }

  const updateA = matchA.teamAId === teamAId ? { team_a_id: teamBId } : { team_b_id: teamBId };
  const updateB = matchB.teamAId === teamBId ? { team_a_id: teamAId } : { team_b_id: teamAId };

  const { error: errorA } = await supabase.from("tourney_matches").update(updateA).eq("id", matchA.id);
  if (errorA) throw new Error(errorA.message);
  const { error: errorB } = await supabase.from("tourney_matches").update(updateB).eq("id", matchB.id);
  if (errorB) throw new Error(errorB.message);
}

/**
 * Undoes the knockout bracket entirely — deletes every knockout match
 * (any round) and any points already awarded from them — so you can
 * re-confirm the advancing teams and reseed. Group-stage results are
 * untouched. Works whether the tourney is mid-bracket or already
 * completed.
 */
export async function clearKnockoutBracket(tourneyId: string): Promise<void> {
  const { data: matchRows, error: matchFetchError } = await supabase
    .from("tourney_matches")
    .select("id")
    .eq("tourney_id", tourneyId)
    .eq("stage", "knockout");
  if (matchFetchError) throw new Error(matchFetchError.message);
  const matchIds = (matchRows ?? []).map((r) => (r as { id: string }).id);

  if (matchIds.length > 0) {
    const { error: pointsError } = await supabase.from("tourney_points_events").delete().in("match_id", matchIds);
    if (pointsError) throw new Error(pointsError.message);
  }

  const { error: matchDeleteError } = await supabase
    .from("tourney_matches")
    .delete()
    .eq("tourney_id", tourneyId)
    .eq("stage", "knockout");
  if (matchDeleteError) throw new Error(matchDeleteError.message);

  const { error: statusError } = await supabase.from("tourneys").update({ status: "groups" }).eq("id", tourneyId);
  if (statusError) throw new Error(statusError.message);
}

async function tryAdvanceKnockoutRound(tourneyId: string, roundIndex: number): Promise<void> {
  const { data, error } = await supabase
    .from("tourney_matches")
    .select("*")
    .eq("tourney_id", tourneyId)
    .eq("stage", "knockout")
    .eq("round_index", roundIndex)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  const roundMatches = (data ?? []).map((r) => matchFromRow(r as MatchRow));
  if (roundMatches.length === 0 || roundMatches.some((m) => !m.winnerTeamId)) return;

  // Re-saving an already-decided match's score (via "Update Score") calls
  // this again — don't duplicate a round that already got created the
  // first time the round completed.
  const { data: nextRoundRows, error: nextRoundError } = await supabase
    .from("tourney_matches")
    .select("id")
    .eq("tourney_id", tourneyId)
    .eq("stage", "knockout")
    .eq("round_index", roundIndex + 1);
  if (nextRoundError) throw new Error(nextRoundError.message);
  if ((nextRoundRows ?? []).length > 0) return;

  const winners = roundMatches.map((m) => m.winnerTeamId as string);
  if (winners.length === 1) {
    const { error: doneError } = await supabase.from("tourneys").update({ status: "completed" }).eq("id", tourneyId);
    if (doneError) throw new Error(doneError.message);
    return;
  }
  await createKnockoutRound(tourneyId, winners, roundIndex + 1);
}

// ---- Leaderboard + player profiles ----

export async function getLeaderboard(): Promise<TourneyLeaderboardEntry[]> {
  const [players, eventsRes, teamsRes, tourneys] = await Promise.all([
    getAllPlayers(),
    supabase.from("tourney_points_events").select("player_id, points"),
    supabase.from("tourney_teams").select("*"),
    getAllTourneys(),
  ]);
  if (eventsRes.error) throw new Error(eventsRes.error.message);
  if (teamsRes.error) throw new Error(teamsRes.error.message);

  const events = (eventsRes.data ?? []) as { player_id: string; points: number }[];
  const teams = (teamsRes.data ?? []) as TeamRow[];
  const tourneysById = new Map(tourneys.map((t) => [t.id, t]));

  const pointsByPlayer = new Map<string, number>();
  for (const e of events) {
    pointsByPlayer.set(e.player_id, (pointsByPlayer.get(e.player_id) ?? 0) + e.points);
  }

  const tourneysByPlayer = new Map<string, Tourney[]>();
  for (const team of teams) {
    const tourney = tourneysById.get(team.tourney_id);
    if (!tourney) continue;
    for (const playerId of [team.player_a_id, team.player_b_id]) {
      const list = tourneysByPlayer.get(playerId) ?? [];
      list.push(tourney);
      tourneysByPlayer.set(playerId, list);
    }
  }

  const entries: TourneyLeaderboardEntry[] = players.map((p) => {
    const playerTourneys = (tourneysByPlayer.get(p.id) ?? []).sort((a, b) => (a.date < b.date ? 1 : -1));
    return {
      playerId: p.id,
      name: p.name,
      country: p.country,
      totalPoints: pointsByPlayer.get(p.id) ?? 0,
      tourneysPlayed: playerTourneys.length,
      currentLevel: playerTourneys[0]?.level ?? null,
    };
  });

  return entries.sort((a, b) => b.totalPoints - a.totalPoints);
}

export type TourneyPlayerHistoryEntry = { tourney: Tourney; team: TourneyTeam; partnerName: string };

export type TourneyPlayerProfile = {
  player: TourneyPlayer;
  currentLevel: TourneyLevel | null;
  totalPoints: number;
  joinPoints: number;
  winPoints: number;
  history: TourneyPlayerHistoryEntry[];
  stats: TourneyPlayerStats;
  loyalty: TourneyLoyaltyStatus;
};

export async function getPlayerProfile(playerId: string): Promise<TourneyPlayerProfile | null> {
  const player = await getPlayer(playerId);
  if (!player) return null;

  const [eventsRes, teamsRes, tourneys, players, rewardsRes] = await Promise.all([
    supabase.from("tourney_points_events").select("*").eq("player_id", playerId),
    supabase.from("tourney_teams").select("*"),
    getAllTourneys(),
    getAllPlayers(),
    supabase
      .from("tourney_loyalty_rewards")
      .select("*")
      .eq("player_id", playerId)
      .order("redeemed_at", { ascending: false }),
  ]);
  if (eventsRes.error) throw new Error(eventsRes.error.message);
  if (teamsRes.error) throw new Error(teamsRes.error.message);
  if (rewardsRes.error) throw new Error(rewardsRes.error.message);

  const events = (eventsRes.data ?? []) as { reason: "join" | "win"; points: number }[];
  const allTeams = (teamsRes.data ?? []) as TeamRow[];
  const tourneysById = new Map(tourneys.map((t) => [t.id, t]));
  const playersById = new Map(players.map((p) => [p.id, p]));

  const myTeams = allTeams.filter((t) => t.player_a_id === playerId || t.player_b_id === playerId);
  const myTeamIds = myTeams.map((t) => t.id);
  const history: TourneyPlayerHistoryEntry[] = myTeams
    .map((t) => {
      const tourney = tourneysById.get(t.tourney_id);
      if (!tourney) return null;
      const partnerId = t.player_a_id === playerId ? t.player_b_id : t.player_a_id;
      const team: TourneyTeam = {
        id: t.id,
        tourneyId: t.tourney_id,
        playerAId: t.player_a_id,
        playerAName: playersById.get(t.player_a_id)?.name ?? "Unknown",
        playerAPaid: t.player_a_paid ?? false,
        playerAFee: t.player_a_fee ?? 0,
        playerBId: t.player_b_id,
        playerBName: playersById.get(t.player_b_id)?.name ?? "Unknown",
        playerBPaid: t.player_b_paid ?? false,
        playerBFee: t.player_b_fee ?? 0,
        disqualified: t.disqualified ?? false,
      };
      return { tourney, team, partnerName: playersById.get(partnerId)?.name ?? "Unknown" };
    })
    .filter((h): h is TourneyPlayerHistoryEntry => h !== null)
    .sort((a, b) => (a.tourney.date < b.tourney.date ? 1 : -1));

  const currentLevel = history[0]?.tourney.level ?? null;
  const joinPoints = events.filter((e) => e.reason === "join").reduce((s, e) => s + e.points, 0);
  const winPoints = events.filter((e) => e.reason === "win").reduce((s, e) => s + e.points, 0);

  let matchesWon = 0;
  let matchesLost = 0;
  let firstPlaceCount = 0;
  let secondPlaceCount = 0;

  if (myTeamIds.length > 0) {
    const orExpr = myTeamIds.map((id) => `team_a_id.eq.${id},team_b_id.eq.${id}`).join(",");
    const { data: matchRows, error: matchError } = await supabase.from("tourney_matches").select("*").or(orExpr);
    if (matchError) throw new Error(matchError.message);
    const myMatches = (matchRows ?? []).map((r) => matchFromRow(r as MatchRow));

    for (const m of myMatches) {
      if (!m.winnerTeamId) continue;
      const myTeamIdInMatch = myTeamIds.includes(m.teamAId ?? "")
        ? m.teamAId
        : myTeamIds.includes(m.teamBId ?? "")
          ? m.teamBId
          : null;
      if (!myTeamIdInMatch) continue;
      const won = m.winnerTeamId === myTeamIdInMatch;
      if (won) matchesWon += 1;
      else matchesLost += 1;
      if (m.roundName === "Final") {
        if (won) firstPlaceCount += 1;
        else secondPlaceCount += 1;
      }
    }
  }

  const stats: TourneyPlayerStats = {
    tournamentsPlayed: history.length,
    matchesWon,
    matchesLost,
    firstPlaceCount,
    secondPlaceCount,
  };

  const rewards: TourneyLoyaltyReward[] = (rewardsRes.data ?? []).map((r) => {
    const row = r as { id: string; player_id: string; redeemed_at: string };
    return { id: row.id, playerId: row.player_id, redeemedAt: row.redeemed_at };
  });
  const loyalty = computeLoyaltyStatus(history.length, rewards);

  return {
    player,
    currentLevel,
    totalPoints: joinPoints + winPoints,
    joinPoints,
    winPoints,
    history,
    stats,
    loyalty,
  };
}

export async function redeemLoyaltyReward(playerId: string): Promise<void> {
  const { error } = await supabase
    .from("tourney_loyalty_rewards")
    .insert({ player_id: playerId, redeemed_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function undoLoyaltyReward(id: string): Promise<void> {
  const { error } = await supabase.from("tourney_loyalty_rewards").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Formats ----

type FormatRow = {
  id: string;
  name: string;
  group_sizes: string;
  qualifiers_per_group: number;
  wildcard_count: number;
  group_stage_court_hours: number;
  quarterfinal_court_hours: number;
  semifinal_final_court_hours: number;
  court_hour_rate: number;
};

function parseGroupSizes(csv: string): number[] {
  return (csv ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function serializeGroupSizes(sizes: number[]): string {
  return sizes.join(",");
}

function formatFromRow(row: FormatRow): TourneyFormat {
  return {
    id: row.id,
    name: row.name,
    groupSizes: parseGroupSizes(row.group_sizes),
    qualifiersPerGroup: row.qualifiers_per_group ?? 2,
    wildcardCount: row.wildcard_count ?? 0,
    groupStageCourtHours: row.group_stage_court_hours ?? 0,
    quarterfinalCourtHours: row.quarterfinal_court_hours ?? 0,
    semifinalFinalCourtHours: row.semifinal_final_court_hours ?? 0,
    courtHourRate: row.court_hour_rate ?? 0,
  };
}

export async function getAllFormats(): Promise<TourneyFormat[]> {
  const { data, error } = await supabase.from("tourney_formats").select("*").order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => formatFromRow(r as FormatRow));
}

export async function getFormat(id: string): Promise<TourneyFormat | null> {
  const { data, error } = await supabase.from("tourney_formats").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? formatFromRow(data as FormatRow) : null;
}

export async function createFormat(input: {
  name: string;
  groupSizes: number[];
  qualifiersPerGroup: number;
  wildcardCount: number;
  groupStageCourtHours: number;
  quarterfinalCourtHours: number;
  semifinalFinalCourtHours: number;
  courtHourRate: number;
}): Promise<void> {
  if (input.groupSizes.length === 0 || input.groupSizes.some((n) => n < 1)) {
    throw new Error("Enter at least one group with at least 1 team.");
  }
  const qualifierCount = formatQualifierCount(input.groupSizes, input.qualifiersPerGroup, input.wildcardCount);
  if (!isValidBracketSize(qualifierCount)) {
    throw new Error(
      "Qualifiers per group × groups + wildcards must be a power of 2 (2, 4, 8, 16…) so it can seed a bracket."
    );
  }
  const { error } = await supabase.from("tourney_formats").insert({
    name: input.name,
    group_sizes: serializeGroupSizes(input.groupSizes),
    qualifiers_per_group: input.qualifiersPerGroup,
    wildcard_count: input.wildcardCount,
    group_stage_court_hours: input.groupStageCourtHours,
    quarterfinal_court_hours: input.quarterfinalCourtHours,
    semifinal_final_court_hours: input.semifinalFinalCourtHours,
    court_hour_rate: input.courtHourRate,
  });
  if (error) throw new Error(error.message);
}

export async function deleteFormat(id: string): Promise<void> {
  const { error } = await supabase.from("tourney_formats").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Budget ----

type BudgetLineRow = {
  id: string;
  tourney_id: string;
  type: TourneyBudgetLineType;
  name: string;
  budgeted_units: number;
  budgeted_unit_cost: number;
  paid?: boolean;
  sort_order: number;
};

function budgetLineFromRow(row: BudgetLineRow): TourneyBudgetLine {
  return {
    id: row.id,
    tourneyId: row.tourney_id,
    type: row.type,
    name: row.name,
    budgetedUnits: row.budgeted_units,
    budgetedUnitCost: row.budgeted_unit_cost,
    paid: row.paid ?? false,
    sortOrder: row.sort_order,
  };
}

export async function getBudgetLines(tourneyId: string): Promise<TourneyBudgetLine[]> {
  const { data, error } = await supabase
    .from("tourney_budget_lines")
    .select("*")
    .eq("tourney_id", tourneyId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => budgetLineFromRow(r as BudgetLineRow));
}

export async function addBudgetLine(input: {
  tourneyId: string;
  type: TourneyBudgetLineType;
  name: string;
  budgetedUnits: number;
  budgetedUnitCost: number;
}): Promise<void> {
  const { count, error: countError } = await supabase
    .from("tourney_budget_lines")
    .select("id", { count: "exact", head: true })
    .eq("tourney_id", input.tourneyId)
    .eq("type", input.type);
  if (countError) throw new Error(countError.message);

  const { error } = await supabase.from("tourney_budget_lines").insert({
    tourney_id: input.tourneyId,
    type: input.type,
    name: input.name,
    budgeted_units: input.budgetedUnits,
    budgeted_unit_cost: input.budgetedUnitCost,
    paid: false,
    sort_order: count ?? 0,
  });
  if (error) throw new Error(error.message);
}

export async function updateBudgetLineBudgeted(id: string, units: number, unitCost: number): Promise<void> {
  const { error } = await supabase
    .from("tourney_budget_lines")
    .update({ budgeted_units: units, budgeted_unit_cost: unitCost })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Marks a budget line (typically an expense) as actually paid — independent of its units/cost, toggled straight from the Budget Sheet. */
export async function setBudgetLinePaid(id: string, paid: boolean): Promise<void> {
  const { error } = await supabase.from("tourney_budget_lines").update({ paid }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBudgetLine(id: string): Promise<void> {
  const { error } = await supabase.from("tourney_budget_lines").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Adds the tourney's format's court-fee preset as outflow budget lines
 * (Group Stage / Quarterfinal / Semifinal & Final courts, at that format's
 * court-hour rate). Skips any line whose name is already on the budget, so
 * clicking this again after editing a line doesn't duplicate it.
 */
export async function applyCourtFeePreset(tourneyId: string): Promise<void> {
  const tourney = await getTourney(tourneyId);
  if (!tourney) throw new Error("Tournament not found.");
  if (!tourney.formatId) throw new Error("This tournament wasn't drawn from a saved format.");

  const formats = await getAllFormats();
  const format = formats.find((f) => f.id === tourney.formatId);
  if (!format) throw new Error("That format no longer exists.");

  const lines = courtFeePresetLines(format);
  if (lines.length === 0) throw new Error("This format has no court-fee preset set.");

  const existing = await getBudgetLines(tourneyId);
  const existingNames = new Set(existing.map((l) => l.name));
  const toAdd = lines.filter((l) => !existingNames.has(l.name));

  for (const line of toAdd) {
    await addBudgetLine({
      tourneyId,
      type: "outflow",
      name: line.name,
      budgetedUnits: line.hours,
      budgetedUnitCost: format.courtHourRate,
    });
  }
}

/** Copies another tourney's budget lines as a starting point — name/type/budgeted units+cost only. */
export async function copyBudgetFromTourney(sourceTourneyId: string, destTourneyId: string): Promise<void> {
  const sourceLines = await getBudgetLines(sourceTourneyId);
  if (sourceLines.length === 0) return;

  const { error } = await supabase.from("tourney_budget_lines").insert(
    sourceLines.map((l) => ({
      tourney_id: destTourneyId,
      type: l.type,
      name: l.name,
      budgeted_units: l.budgetedUnits,
      budgeted_unit_cost: l.budgetedUnitCost,
      paid: false,
      sort_order: l.sortOrder,
    }))
  );
  if (error) throw new Error(error.message);
}
