"use server";

import { revalidatePath } from "next/cache";
import { addBudgetLine, deleteBudgetLine, updateBudgetLineActual, updateBudgetLineBudgeted } from "@/lib/tourneys";
import { isTourneyBudgetLineType } from "@/lib/types";

export type FormState = { error: string } | undefined;

function revalidateBudget(level: string, tourneyId: string): void {
  revalidatePath(`/community/padel/tournament/${level}/${tourneyId}/budget`);
}

export async function addBudgetLineAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tourneyId = String(formData.get("tourneyId") ?? "");
  const level = String(formData.get("level") ?? "");
  const type = String(formData.get("type") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const budgetedUnits = Number(formData.get("budgetedUnits"));
  const budgetedUnitCost = Number(formData.get("budgetedUnitCost"));

  if (!tourneyId) return { error: "Missing tournament." };
  if (!isTourneyBudgetLineType(type)) return { error: "Invalid type." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(budgetedUnits) || budgetedUnits < 0) return { error: "Enter a valid number of units." };
  if (!Number.isFinite(budgetedUnitCost) || budgetedUnitCost < 0) return { error: "Enter a valid unit cost." };

  await addBudgetLine({ tourneyId, type, name, budgetedUnits, budgetedUnitCost });
  revalidateBudget(level, tourneyId);
}

export async function updateBudgetLineBudgetedAction(
  id: string,
  level: string,
  tourneyId: string,
  units: number,
  unitCost: number
): Promise<{ error: string } | void> {
  if (!Number.isFinite(units) || !Number.isFinite(unitCost)) {
    return { error: "Enter valid numbers." };
  }
  await updateBudgetLineBudgeted(id, units, unitCost);
  revalidateBudget(level, tourneyId);
}

export async function updateBudgetLineActualAction(
  id: string,
  level: string,
  tourneyId: string,
  units: number,
  unitCost: number
): Promise<{ error: string } | void> {
  if (!Number.isFinite(units) || !Number.isFinite(unitCost)) {
    return { error: "Enter valid numbers." };
  }
  await updateBudgetLineActual(id, units, unitCost);
  revalidateBudget(level, tourneyId);
}

export async function deleteBudgetLineAction(id: string, level: string, tourneyId: string): Promise<void> {
  await deleteBudgetLine(id);
  revalidateBudget(level, tourneyId);
}
