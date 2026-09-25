"use server";

import { revalidatePath } from "next/cache";
import { addEquipment, deleteEquipment } from "@/lib/equipment";
import { isEquipmentType } from "@/lib/types";

export type FormState = { error: string } | undefined;

export async function createEquipment(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "");

  if (!name) return { error: "Name is required." };
  if (!isEquipmentType(typeRaw)) return { error: "Pick a type." };

  await addEquipment({ name, type: typeRaw });
  revalidatePath("/workouts/equipment");
  revalidatePath("/workouts/running");
  revalidatePath("/workouts/cycling");
}

export async function removeEquipment(id: string): Promise<void> {
  await deleteEquipment(id);
  revalidatePath("/workouts/equipment");
  revalidatePath("/workouts/running");
  revalidatePath("/workouts/cycling");
}
