"use server";

import { revalidatePath } from "next/cache";
import { addTransaction } from "@/lib/transactions";
import { isTransactionType } from "@/lib/types";

export type FormState = { error: string } | undefined;

export async function createTransaction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const type = String(formData.get("type") ?? "");
  const date = String(formData.get("date") ?? "");
  const amount = Number(formData.get("amount"));
  const accountId = String(formData.get("accountId") ?? "");
  const toAccountId = String(formData.get("toAccountId") ?? "") || null;
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim();

  if (!isTransactionType(type)) return { error: "Invalid type." };
  if (!date) return { error: "Date is required." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }
  if (!accountId) return { error: "Account is required." };

  if (type === "transfer") {
    if (!toAccountId) return { error: "Select a destination account." };
    if (toAccountId === accountId) return { error: "From and to accounts must be different." };
  } else if (!categoryId) {
    return { error: "Select a category." };
  }

  await addTransaction({
    type,
    date,
    amount,
    accountId,
    toAccountId: type === "transfer" ? toAccountId : null,
    categoryId: type === "transfer" ? null : categoryId,
    note,
  });

  revalidatePath("/day-to-day");
  revalidatePath("/day-to-day/accounts");
  revalidatePath(`/day-to-day/accounts/${accountId}`);
  if (toAccountId) revalidatePath(`/day-to-day/accounts/${toAccountId}`);
  revalidatePath("/");
}
