"use server";

import { revalidatePath } from "next/cache";
import { addPlayer } from "@/lib/tourneys";

export type FormState = { error: string } | undefined;

export async function addPlayerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();

  if (!name) return { error: "Name is required." };

  await addPlayer(name, country || null);
  revalidatePath("/community/padel/players");
  revalidatePath("/community/padel/leaderboard");
}
