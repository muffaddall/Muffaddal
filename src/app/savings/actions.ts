"use server";

import { revalidatePath } from "next/cache";
import {
  addDebt,
  deleteDebt,
  deleteSavingsMonth,
  updateDebt,
  upsertSavingsMonth,
} from "@/lib/savings";
import { inputValueToMonth } from "@/lib/format";

export type FormState = { error: string } | undefined;

export async function createDebt(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount"));

  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(amount)) return { error: "Amount must be a number." };

  await addDebt({ name, amount });
  revalidatePath("/savings");
  revalidatePath("/");
}

export async function editDebt(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount"));

  if (!id) return { error: "Missing debt." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(amount)) return { error: "Amount must be a number." };

  await updateDebt(id, { name, amount });
  revalidatePath("/savings");
  revalidatePath("/");
}

export async function removeDebt(id: string): Promise<void> {
  await deleteDebt(id);
  revalidatePath("/savings");
  revalidatePath("/");
}

export async function saveSavingsMonth(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const monthInput = String(formData.get("month") ?? "");
  const big_payment = Number(formData.get("big_payment"));
  const money_kept = Number(formData.get("money_kept"));

  if (!monthInput) return { error: "Month is required." };
  if (![big_payment, money_kept].every(Number.isFinite)) {
    return { error: "All amounts must be numbers." };
  }

  await upsertSavingsMonth({
    month: inputValueToMonth(monthInput),
    big_payment,
    money_kept,
  });
  revalidatePath("/savings");
  revalidatePath("/");
}

export async function removeSavingsMonth(month: string): Promise<void> {
  await deleteSavingsMonth(month);
  revalidatePath("/savings");
  revalidatePath("/");
}
