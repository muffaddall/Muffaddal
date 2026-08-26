"use server";

import { revalidatePath } from "next/cache";
import { upsertCalorieLog } from "@/lib/calories";

export type FormState = { error: string } | undefined;

export async function saveCalorieLog(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const date = String(formData.get("date") ?? "");
  const breakfast = Number(formData.get("breakfast"));
  const lunch = Number(formData.get("lunch"));
  const dinner = Number(formData.get("dinner"));
  const snacks = Number(formData.get("snacks"));
  const burned = Number(formData.get("burned"));

  if (!date) return { error: "Missing date." };
  if (![breakfast, lunch, dinner, snacks, burned].every(Number.isFinite)) {
    return { error: "All values must be numbers." };
  }

  await upsertCalorieLog({ date, breakfast, lunch, dinner, snacks, burned });
  revalidatePath("/calories");
  revalidatePath("/calories/week");
}
