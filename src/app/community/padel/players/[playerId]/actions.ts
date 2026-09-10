"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deletePlayer, redeemLoyaltyReward, undoLoyaltyReward } from "@/lib/tourneys";

export async function deletePlayerAction(playerId: string): Promise<void> {
  await deletePlayer(playerId);
  revalidatePath("/community/padel/players");
  redirect("/community/padel/players");
}

export async function redeemLoyaltyRewardAction(playerId: string): Promise<void> {
  await redeemLoyaltyReward(playerId);
  revalidatePath(`/community/padel/players/${playerId}`);
}

export async function undoLoyaltyRewardAction(id: string, playerId: string): Promise<void> {
  await undoLoyaltyReward(id);
  revalidatePath(`/community/padel/players/${playerId}`);
}
