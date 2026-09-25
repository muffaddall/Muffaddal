"use server";

import { revalidatePath } from "next/cache";
import { addWorkoutLog, deleteWorkoutLog, updateWorkoutLog } from "@/lib/workouts";
import { convertDistanceToDisciplineUnit, isDistanceUnit, isWorkoutDiscipline } from "@/lib/types";

export type FormState = { error: string } | undefined;

export async function createWorkoutLog(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const discipline = String(formData.get("discipline") ?? "");
  const date = String(formData.get("date") ?? "");
  const distanceInput = Number(formData.get("distance"));
  const unit = String(formData.get("unit") ?? "");
  const durationMin = Number(formData.get("durationMin"));
  const equipmentId = String(formData.get("equipmentId") ?? "").trim() || null;

  if (!isWorkoutDiscipline(discipline)) return { error: "Invalid discipline." };
  if (!date) return { error: "Date is required." };
  if (!isDistanceUnit(unit)) return { error: "Invalid unit." };
  if (!Number.isFinite(distanceInput) || distanceInput <= 0) {
    return { error: "Distance must be a positive number." };
  }
  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    return { error: "Duration must be a positive number." };
  }

  const distance = convertDistanceToDisciplineUnit(distanceInput, unit, discipline);

  await addWorkoutLog({ discipline, date, distance, durationMin, equipmentId });
  revalidatePath(`/workouts/${discipline}`);
  revalidatePath("/");
}

export async function editWorkoutLog(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const discipline = String(formData.get("discipline") ?? "");
  const date = String(formData.get("date") ?? "");
  const distanceInput = Number(formData.get("distance"));
  const unit = String(formData.get("unit") ?? "");
  const durationMin = Number(formData.get("durationMin"));
  const equipmentId = String(formData.get("equipmentId") ?? "").trim() || null;

  if (!id) return { error: "Missing id." };
  if (!isWorkoutDiscipline(discipline)) return { error: "Invalid discipline." };
  if (!date) return { error: "Date is required." };
  if (!isDistanceUnit(unit)) return { error: "Invalid unit." };
  if (!Number.isFinite(distanceInput) || distanceInput <= 0) {
    return { error: "Distance must be a positive number." };
  }
  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    return { error: "Duration must be a positive number." };
  }

  const distance = convertDistanceToDisciplineUnit(distanceInput, unit, discipline);

  await updateWorkoutLog(id, { date, distance, durationMin, equipmentId });
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
