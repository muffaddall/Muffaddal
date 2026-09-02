"use server";

import { revalidatePath } from "next/cache";
import {
  addPadelWinning,
  deletePadelWinning,
  setPadelBaseline,
  updatePadelWinning,
} from "@/lib/padel";

export type FormState = { error: string } | undefined;

export async function createPadelWinning(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount"));

  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(amount)) return { error: "Amount must be a number." };

  await addPadelWinning({ name, amount });
  revalidatePath("/workouts/padel");
}

export async function editPadelWinning(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount"));

  if (!id) return { error: "Missing entry." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(amount)) return { error: "Amount must be a number." };

  await updatePadelWinning(id, { name, amount });
  revalidatePath("/workouts/padel");
}

export async function removePadelWinning(id: string): Promise<void> {
  await deletePadelWinning(id);
  revalidatePath("/workouts/padel");
}

export async function saveBaseline(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const games = Number(formData.get("games"));
  const spent = Number(formData.get("spent"));
  const income = Number(formData.get("income"));
  const tournaments = Number(formData.get("tournaments"));
  const wins = Number(formData.get("wins"));
  const runnersUp = Number(formData.get("runnersUp"));
  const knockouts = Number(formData.get("knockouts"));

  if (![games, spent, income, tournaments, wins, runnersUp, knockouts].every(Number.isFinite)) {
    return { error: "All fields must be numbers." };
  }

  await setPadelBaseline({ games, spent, income, tournaments, wins, runnersUp, knockouts });
  revalidatePath("/workouts/padel");
}
