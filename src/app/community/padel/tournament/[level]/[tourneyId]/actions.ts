"use server";

import { revalidatePath } from "next/cache";
import {
  clearGroups,
  clearKnockoutBracket,
  createTeam,
  disqualifyTeam,
  editTeam,
  finishTournamentWithoutBracket,
  generateGroups,
  generateKnockoutBracket,
  moveTeamToGroup,
  removeTeam,
  setAllMatchScores,
  setMatchScore,
  setTeamDisqualified,
  setTeamFee,
  setTeamPaid,
  swapKnockoutTeams,
  updateTourneyPoints,
  type MatchScoreInput,
} from "@/lib/tourneys";

export type FormState = { error: string } | undefined;

function revalidateTourneyPaths(level: string, tourneyId: string): void {
  const base = `/community/padel/tournament/${level}/${tourneyId}`;
  revalidatePath(base);
  revalidatePath(`${base}/pre`);
  revalidatePath(`${base}/live`);
}

export async function addTeamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tourneyId = String(formData.get("tourneyId") ?? "");
  const level = String(formData.get("level") ?? "");
  const playerAName = String(formData.get("playerAName") ?? "").trim();
  const playerACountry = String(formData.get("playerACountry") ?? "").trim();
  const playerBName = String(formData.get("playerBName") ?? "").trim();
  const playerBCountry = String(formData.get("playerBCountry") ?? "").trim();

  if (!tourneyId) return { error: "Missing tournament." };
  if (!playerAName || !playerBName) return { error: "Both player names are required." };

  await createTeam({
    tourneyId,
    playerAName,
    playerACountry: playerACountry || null,
    playerBName,
    playerBCountry: playerBCountry || null,
  });
  revalidateTourneyPaths(level, tourneyId);
}

export async function removeTeamAction(teamId: string, level: string, tourneyId: string): Promise<void> {
  await removeTeam(teamId);
  revalidateTourneyPaths(level, tourneyId);
}

export async function editTeamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const teamId = String(formData.get("teamId") ?? "");
  const level = String(formData.get("level") ?? "");
  const tourneyId = String(formData.get("tourneyId") ?? "");
  const playerAName = String(formData.get("playerAName") ?? "").trim();
  const playerACountry = String(formData.get("playerACountry") ?? "").trim();
  const playerBName = String(formData.get("playerBName") ?? "").trim();
  const playerBCountry = String(formData.get("playerBCountry") ?? "").trim();

  if (!teamId) return { error: "Missing team." };
  if (!playerAName || !playerBName) return { error: "Both player names are required." };

  await editTeam({
    teamId,
    playerAName,
    playerACountry: playerACountry || null,
    playerBName,
    playerBCountry: playerBCountry || null,
  });
  revalidateTourneyPaths(level, tourneyId);
}

export async function setTeamFeeAction(
  teamId: string,
  side: "a" | "b",
  fee: number,
  level: string,
  tourneyId: string
): Promise<void> {
  await setTeamFee(teamId, side, fee);
  revalidateTourneyPaths(level, tourneyId);
}

export async function setTeamPaidAction(
  teamId: string,
  side: "a" | "b",
  paid: boolean,
  level: string,
  tourneyId: string
): Promise<void> {
  await setTeamPaid(teamId, side, paid);
  revalidateTourneyPaths(level, tourneyId);
}

export async function disqualifyTeamAction(
  teamId: string,
  level: string,
  tourneyId: string
): Promise<{ error: string } | void> {
  try {
    await disqualifyTeam(teamId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to disqualify team." };
  }
  revalidateTourneyPaths(level, tourneyId);
}

export async function setTeamDisqualifiedAction(
  teamId: string,
  disqualified: boolean,
  level: string,
  tourneyId: string
): Promise<void> {
  await setTeamDisqualified(teamId, disqualified);
  revalidateTourneyPaths(level, tourneyId);
}

export async function generateGroupsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tourneyId = String(formData.get("tourneyId") ?? "");
  const level = String(formData.get("level") ?? "");
  const groupSizes = String(formData.get("groupSizes") ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  const hasKnockout = formData.get("hasKnockout") === "on";
  const qualifiersPerGroup = hasKnockout ? Number(formData.get("qualifiersPerGroup")) : 0;
  const wildcardCount = hasKnockout ? Number(formData.get("wildcardCount") || 0) : 0;
  const formatId = String(formData.get("formatId") ?? "").trim() || null;

  if (!tourneyId) return { error: "Missing tournament." };
  if (groupSizes.length === 0) return { error: "Enter at least one group size." };
  if (hasKnockout && (!Number.isFinite(qualifiersPerGroup) || qualifiersPerGroup < 1)) {
    return { error: "Enter a valid number of qualifiers per group." };
  }

  try {
    await generateGroups(tourneyId, groupSizes, qualifiersPerGroup, wildcardCount, formatId, hasKnockout);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate groups." };
  }
  revalidateTourneyPaths(level, tourneyId);
}

export async function moveTeamToGroupAction(
  teamId: string,
  fromGroupId: string,
  toGroupId: string,
  level: string,
  tourneyId: string
): Promise<{ error: string } | void> {
  try {
    await moveTeamToGroup(teamId, fromGroupId, toGroupId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to move team." };
  }
  revalidateTourneyPaths(level, tourneyId);
}

export async function finishTournamentAction(level: string, tourneyId: string): Promise<{ error: string } | void> {
  try {
    await finishTournamentWithoutBracket(tourneyId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to finish tournament." };
  }
  revalidateTourneyPaths(level, tourneyId);
}

export async function setMatchScoreAction(
  matchId: string,
  level: string,
  tourneyId: string,
  teamAScore: number,
  teamBScore: number
): Promise<{ error: string } | void> {
  try {
    await setMatchScore(matchId, teamAScore, teamBScore);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save score." };
  }
  revalidateTourneyPaths(level, tourneyId);
}

export async function setAllMatchScoresAction(
  level: string,
  tourneyId: string,
  entries: MatchScoreInput[]
): Promise<{ error: string } | void> {
  const failures = await setAllMatchScores(entries);
  revalidateTourneyPaths(level, tourneyId);
  if (failures.length > 0) {
    return { error: `${failures.length} score${failures.length === 1 ? "" : "s"} failed to save: ${failures.map((f) => f.error).join(" ")}` };
  }
}

export async function generateBracketAction(
  level: string,
  tourneyId: string,
  advancingTeamIds: string[]
): Promise<{ error: string } | void> {
  try {
    await generateKnockoutBracket(tourneyId, advancingTeamIds);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate bracket." };
  }
  revalidateTourneyPaths(level, tourneyId);
}

export async function swapKnockoutTeamsAction(
  teamAId: string,
  teamBId: string,
  level: string,
  tourneyId: string
): Promise<{ error: string } | void> {
  try {
    await swapKnockoutTeams(tourneyId, teamAId, teamBId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to move team." };
  }
  revalidateTourneyPaths(level, tourneyId);
}

export async function clearGroupsAction(level: string, tourneyId: string): Promise<{ error: string } | void> {
  try {
    await clearGroups(tourneyId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to regenerate groups." };
  }
  revalidateTourneyPaths(level, tourneyId);
}

export async function clearKnockoutBracketAction(level: string, tourneyId: string): Promise<{ error: string } | void> {
  try {
    await clearKnockoutBracket(tourneyId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to regenerate bracket." };
  }
  revalidateTourneyPaths(level, tourneyId);
}

export async function updateTourneyPointsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tourneyId = String(formData.get("tourneyId") ?? "");
  const level = String(formData.get("level") ?? "");
  const joinPoints = Number(formData.get("joinPoints"));
  const groupWinPoints = Number(formData.get("groupWinPoints"));
  const quarterfinalPoints = Number(formData.get("quarterfinalPoints"));
  const semifinalPoints = Number(formData.get("semifinalPoints"));
  const finalPoints = Number(formData.get("finalPoints"));

  if (!tourneyId) return { error: "Missing tournament." };
  const values = [joinPoints, groupWinPoints, quarterfinalPoints, semifinalPoints, finalPoints];
  if (!values.every((n) => Number.isFinite(n) && n >= 0)) {
    return { error: "All point values must be zero or a positive number." };
  }

  await updateTourneyPoints(tourneyId, { joinPoints, groupWinPoints, quarterfinalPoints, semifinalPoints, finalPoints });
  revalidateTourneyPaths(level, tourneyId);
}
