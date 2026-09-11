"use server";

import { revalidatePath } from "next/cache";
import {
  clearGroups,
  clearKnockoutBracket,
  createTeam,
  generateGroups,
  generateKnockoutBracket,
  removeTeam,
  setAllMatchScores,
  setMatchScore,
  setTeamPaid,
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

export async function generateGroupsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tourneyId = String(formData.get("tourneyId") ?? "");
  const level = String(formData.get("level") ?? "");
  const groupSizes = String(formData.get("groupSizes") ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  const qualifiersPerGroup = Number(formData.get("qualifiersPerGroup"));
  const wildcardCount = Number(formData.get("wildcardCount") || 0);
  const formatId = String(formData.get("formatId") ?? "").trim() || null;

  if (!tourneyId) return { error: "Missing tournament." };
  if (groupSizes.length === 0) return { error: "Enter at least one group size." };
  if (!Number.isFinite(qualifiersPerGroup) || qualifiersPerGroup < 1) {
    return { error: "Enter a valid number of qualifiers per group." };
  }

  try {
    await generateGroups(tourneyId, groupSizes, qualifiersPerGroup, wildcardCount, formatId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate groups." };
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
