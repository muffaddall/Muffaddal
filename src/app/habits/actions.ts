"use server";

import { revalidatePath } from "next/cache";
import { addHabit, deleteHabit, renameHabit, setHabitDone } from "@/lib/habits";

export type FormState = { error: string } | undefined;

function revalidateHabits(): void {
  revalidatePath("/habits");
  revalidatePath("/");
}

export async function createHabit(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the habit a name." };

  await addHabit(name);
  revalidateHabits();
}

export async function saveHabitName(id: string, name: string): Promise<{ error: string } | void> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name can't be empty." };

  await renameHabit(id, trimmed);
  revalidateHabits();
}

export async function removeHabit(id: string): Promise<void> {
  await deleteHabit(id);
  revalidateHabits();
}

export async function toggleHabitDay(habitId: string, date: string, done: boolean): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  await setHabitDone(habitId, date, done);
  revalidateHabits();
}
