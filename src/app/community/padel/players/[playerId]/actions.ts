"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deletePlayer } from "@/lib/tourneys";

export async function deletePlayerAction(playerId: string): Promise<void> {
  await deletePlayer(playerId);
  revalidatePath("/community/padel/players");
  redirect("/community/padel/players");
}
