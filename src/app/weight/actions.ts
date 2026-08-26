"use server";

import { revalidatePath } from "next/cache";
import { addWeightLog, deleteWeightLog } from "@/lib/weight";

export type FormState = { error: string } | undefined;

export async function createWeightLog(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "").trim() || null;
  const weight = Number(formData.get("weight"));

  if (!date) return { error: "Date is required." };
  if (!Number.isFinite(weight) || weight <= 0) {
    return { error: "Weight must be a positive number." };
  }

  await addWeightLog({ date, time, weight });
  revalidatePath("/weight");
  revalidatePath("/");
}

export async function removeWeightLog(id: string): Promise<void> {
  await deleteWeightLog(id);
  revalidatePath("/weight");
  revalidatePath("/");
}
