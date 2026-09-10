"use server";

import { revalidatePath } from "next/cache";
import {
  createTeam,
  generateGroups,
  generateKnockoutBracket,
  removeTeam,
  setMatchScore,
} from "@/lib/tourneys";

export type FormState = { error: string } | undefined;

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
  revalidatePath(`/community/padel/tournament/${level}/${tourneyId}`);
}

export async function removeTeamAction(teamId: string, level: string, tourneyId: string): Promise<void> {
  await removeTeam(teamId);
  revalidatePath(`/community/padel/tournament/${level}/${tourneyId}`);
}

export async function generateGroupsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tourneyId = String(formData.get("tourneyId") ?? "");
  const level = String(formData.get("level") ?? "");
  const numGroups = Number(formData.get("numGroups"));

  if (!tourneyId) return { error: "Missing tournament." };
  if (!Number.isFinite(numGroups) || numGroups < 1) return { error: "Enter a valid number of groups." };

  try {
    await generateGroups(tourneyId, numGroups);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate groups." };
  }
  revalidatePath(`/community/padel/tournament/${level}/${tourneyId}`);
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
  revalidatePath(`/community/padel/tournament/${level}/${tourneyId}`);
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
  revalidatePath(`/community/padel/tournament/${level}/${tourneyId}`);
}
