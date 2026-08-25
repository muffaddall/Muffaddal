"use server";

import { revalidatePath } from "next/cache";
import {
  addExpenseEntry,
  deleteExpenseEntry,
  setIncomeForMonth,
  updateExpenseEntry,
} from "@/lib/expenses";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/types";

function parseCategory(value: FormDataEntryValue | null): ExpenseCategory {
  const str = String(value ?? "");
  return (EXPENSE_CATEGORIES as readonly string[]).includes(str)
    ? (str as ExpenseCategory)
    : "recurring";
}

export type FormState = { error: string } | undefined;

export async function createExpense(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const month = String(formData.get("month") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const dateLabel = String(formData.get("date_label") ?? "1st").trim() || "1st";
  const amount = Number(formData.get("amount"));
  const category = parseCategory(formData.get("category"));

  if (!month) return { error: "Missing month." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(amount)) return { error: "Amount must be a number." };

  await addExpenseEntry({ month, date_label: dateLabel, name, amount, category });
  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function editExpense(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const dateLabel = String(formData.get("date_label") ?? "1st").trim() || "1st";
  const amount = Number(formData.get("amount"));
  const category = parseCategory(formData.get("category"));

  if (!id) return { error: "Missing entry." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(amount)) return { error: "Amount must be a number." };

  await updateExpenseEntry(id, { date_label: dateLabel, name, amount, category });
  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function removeExpense(id: string): Promise<void> {
  await deleteExpenseEntry(id);
  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function saveIncome(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const month = String(formData.get("month") ?? "");
  const income = Number(formData.get("income"));

  if (!month) return { error: "Missing month." };
  if (!Number.isFinite(income)) return { error: "Income must be a number." };

  await setIncomeForMonth(month, income);
  revalidatePath("/expenses");
  revalidatePath("/");
}
