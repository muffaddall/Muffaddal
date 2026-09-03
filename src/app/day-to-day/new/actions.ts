"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addTransaction, updateTransaction } from "@/lib/transactions";
import { isTransactionType } from "@/lib/types";

export type FormState = { error: string } | undefined;

function parseTransactionForm(formData: FormData):
  | { error: string }
  | {
      type: "income" | "expense" | "transfer";
      date: string;
      amount: number;
      accountId: string;
      toAccountId: string | null;
      toAmount: number | null;
      categoryId: string | null;
      note: string;
    } {
  const type = String(formData.get("type") ?? "");
  const date = String(formData.get("date") ?? "");
  const amount = Number(formData.get("amount"));
  const accountId = String(formData.get("accountId") ?? "");
  const toAccountId = String(formData.get("toAccountId") ?? "") || null;
  const toAmountRaw = String(formData.get("toAmount") ?? "").trim();
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

  let toAmount: number | null = null;
  if (type === "transfer" && toAmountRaw !== "") {
    const parsed = Number(toAmountRaw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return { error: "Exchange rate must convert to a positive amount." };
    }
    toAmount = parsed;
  }

  return {
    type,
    date,
    amount,
    accountId,
    toAccountId: type === "transfer" ? toAccountId : null,
    toAmount: type === "transfer" ? toAmount : null,
    categoryId: type === "transfer" ? null : categoryId,
    note,
  };
}

function revalidateTransactionPaths(accountId: string, toAccountId: string | null) {
  revalidatePath("/day-to-day");
  revalidatePath("/day-to-day/accounts");
  revalidatePath(`/day-to-day/accounts/${accountId}`);
  if (toAccountId) revalidatePath(`/day-to-day/accounts/${toAccountId}`);
  revalidatePath("/");
}

export async function createTransaction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseTransactionForm(formData);
  if ("error" in parsed) return parsed;

  await addTransaction(parsed);
  revalidateTransactionPaths(parsed.accountId, parsed.toAccountId);
}

export async function editTransaction(
  id: string,
  backHref: string | undefined,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseTransactionForm(formData);
  if ("error" in parsed) return parsed;

  await updateTransaction(id, parsed);
  revalidateTransactionPaths(parsed.accountId, parsed.toAccountId);
  redirect(backHref || "/day-to-day");
}
