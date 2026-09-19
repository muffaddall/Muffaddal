"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adjustPlayerLoyalty, deletePlayer, redeemLoyaltyReward, undoLoyaltyReward, updatePlayer } from "@/lib/tourneys";

export async function deletePlayerAction(playerId: string): Promise<void> {
  await deletePlayer(playerId);
  revalidatePath("/community/padel/players");
  redirect("/community/padel/players");
}

export async function updatePlayerAction(
  playerId: string,
  name: string,
  country: string | null
): Promise<{ error: string } | void> {
  try {
    await updatePlayer(playerId, name, country);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update player." };
  }
  revalidatePath(`/community/padel/players/${playerId}`);
  revalidatePath("/community/padel/players");
  revalidatePath("/community/padel/leaderboard");
}

export async function adjustPlayerLoyaltyAction(playerId: string, delta: number): Promise<void> {
  await adjustPlayerLoyalty(playerId, delta);
  revalidatePath(`/community/padel/players/${playerId}`);
}

export async function redeemLoyaltyRewardAction(playerId: string): Promise<void> {
  await redeemLoyaltyReward(playerId);
  revalidatePath(`/community/padel/players/${playerId}`);
}

export async function undoLoyaltyRewardAction(id: string, playerId: string): Promise<void> {
  await undoLoyaltyReward(id);
  revalidatePath(`/community/padel/players/${playerId}`);
}
