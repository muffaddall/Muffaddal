"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createTourney, deleteTourney } from "@/lib/tourneys";
import { isTourneyLevel } from "@/lib/types";

export type FormState = { error: string } | undefined;

export async function createTourneyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const level = String(formData.get("level") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "");

  if (!isTourneyLevel(level)) return { error: "Invalid level." };
  if (!name) return { error: "Name is required." };
  if (!date) return { error: "Date is required." };

  const id = await createTourney(level, name, date);
  revalidatePath(`/community/padel/tournament/${level}`);
  redirect(`/community/padel/tournament/${level}/${id}`);
}

export async function deleteTourneyAction(level: string, tourneyId: string): Promise<void> {
  await deleteTourney(tourneyId);
  revalidatePath(`/community/padel/tournament/${level}`);
  redirect(`/community/padel/tournament/${level}`);
}
