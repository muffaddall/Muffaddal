"use server";

import { revalidatePath } from "next/cache";
import { addWorkoutLog, deleteWorkoutLog } from "@/lib/workouts";
import { isWorkoutDiscipline } from "@/lib/types";

export type FormState = { error: string } | undefined;

export async function createWorkoutLog(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const discipline = String(formData.get("discipline") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "").trim() || null;
  const distance = Number(formData.get("distance"));
  const durationMin = Number(formData.get("durationMin"));

  if (!isWorkoutDiscipline(discipline)) return { error: "Invalid discipline." };
  if (!date) return { error: "Date is required." };
  if (!Number.isFinite(distance) || distance <= 0) {
    return { error: "Distance must be a positive number." };
  }
  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    return { error: "Duration must be a positive number." };
  }

  await addWorkoutLog({ discipline, date, time, distance, durationMin });
  revalidatePath(`/workouts/${discipline}`);
  revalidatePath("/");
}

export async function removeWorkoutLog(
  id: string,
  discipline: string
): Promise<void> {
  await deleteWorkoutLog(id);
  revalidatePath(`/workouts/${discipline}`);
  revalidatePath("/");
}
