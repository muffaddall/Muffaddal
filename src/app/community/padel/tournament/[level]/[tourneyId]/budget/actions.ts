"use server";

import { revalidatePath } from "next/cache";
import { addBudgetLine, deleteBudgetLine, updateBudgetLine } from "@/lib/tourneys";
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
  const budgetedAmount = Number(formData.get("budgetedAmount"));

  if (!tourneyId) return { error: "Missing tournament." };
  if (!isTourneyBudgetLineType(type)) return { error: "Invalid type." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(budgetedAmount) || budgetedAmount < 0) return { error: "Enter a valid budgeted amount." };

  await addBudgetLine({ tourneyId, type, name, budgetedAmount });
  revalidateBudget(level, tourneyId);
}

export async function updateBudgetLineAction(
  id: string,
  level: string,
  tourneyId: string,
  budgetedAmount: number,
  actualAmount: number
): Promise<{ error: string } | void> {
  if (!Number.isFinite(budgetedAmount) || !Number.isFinite(actualAmount)) {
    return { error: "Enter valid amounts." };
  }
  await updateBudgetLine(id, { budgetedAmount, actualAmount });
  revalidateBudget(level, tourneyId);
}

export async function deleteBudgetLineAction(id: string, level: string, tourneyId: string): Promise<void> {
  await deleteBudgetLine(id);
  revalidateBudget(level, tourneyId);
}
