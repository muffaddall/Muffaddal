"use server";

import { revalidatePath } from "next/cache";
import {
  addPadelWinning,
  deletePadelWinning,
  deletePadelYearlyGames,
  setPadelBaseline,
  addManualPadelTournament,
  deleteManualPadelTournament,
  saveLinkedPadelTournament,
  updateManualPadelTournament,
  updatePadelWinning,
  upsertPadelYearlyGames,
} from "@/lib/padel";

import { isPadelTournamentResult } from "@/lib/types";

export type FormState = { error: string } | undefined;

/** Add or edit a tournament on the Padel Tracker list. With a transactionId it's tied to a Day-to-Day expense (only name and result are saved); with an id and no transactionId it edits a hand-added one; with neither it adds a new hand-added one. */
export async function savePadelTournament(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const transactionId = String(formData.get("transactionId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const resultRaw = String(formData.get("result") ?? "");
  const result = isPadelTournamentResult(resultRaw) ? resultRaw : null;

  if (!name) return { error: "Name is required." };

  if (transactionId) {
    await saveLinkedPadelTournament(transactionId, { name, result });
  } else {
    const date = String(formData.get("date") ?? "") || null;
    const feeRaw = String(formData.get("entryFee") ?? "").trim();
    const entryFee = feeRaw === "" ? null : Number(feeRaw);
    if (entryFee !== null && !Number.isFinite(entryFee)) return { error: "Entry fee must be a number." };
    const input = { name, date, entry_fee: entryFee, result };
    if (id) await updateManualPadelTournament(id, input);
    else await addManualPadelTournament(input);
  }
  revalidatePath("/workouts/padel");
}

export async function removePadelTournament(id: string): Promise<void> {
  await deleteManualPadelTournament(id);
  revalidatePath("/workouts/padel");
}

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
  const spent = Number(formData.get("spent"));
  const income = Number(formData.get("income"));
  const tournaments = Number(formData.get("tournaments"));
  const wins = Number(formData.get("wins"));
  const runnersUp = Number(formData.get("runnersUp"));
  const knockouts = Number(formData.get("knockouts"));

  if (![spent, income, tournaments, wins, runnersUp, knockouts].every(Number.isFinite)) {
    return { error: "All fields must be numbers." };
  }

  await setPadelBaseline({ spent, income, tournaments, wins, runnersUp, knockouts });
  revalidatePath("/workouts/padel");
}

export async function saveYearlyGames(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const year = Number(formData.get("year"));
  const games = Number(formData.get("games"));

  if (!Number.isInteger(year) || year < 2000 || year > 3000) {
    return { error: "Year must be a valid year." };
  }
  if (!Number.isFinite(games) || games < 0) {
    return { error: "Games must be a non-negative number." };
  }

  await upsertPadelYearlyGames(year, games);
  revalidatePath("/workouts/padel");
}

export async function removeYearlyGames(year: number): Promise<void> {
  await deletePadelYearlyGames(year);
  revalidatePath("/workouts/padel");
}
