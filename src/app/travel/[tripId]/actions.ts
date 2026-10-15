"use server";

import { revalidatePath } from "next/cache";
import {
  addTripTransaction,
  addTripWallet,
  deleteTripTransaction,
  updateTripTransaction,
} from "@/lib/trips";
import { isTripExpenseCategory, isTripTransactionType } from "@/lib/types";

export type FormState = { error: string } | undefined;

export async function createTripCurrency(_prev: FormState, formData: FormData): Promise<FormState> {
  const tripId = String(formData.get("tripId") ?? "");
  const currency = String(formData.get("currency") ?? "").trim().toUpperCase();

  if (!tripId) return { error: "Missing trip." };
  if (!currency) return { error: "Pick a currency." };

  await addTripWallet(tripId, currency);
  revalidatePath(`/travel/${tripId}`);
}

export async function createTripTransaction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const tripId = String(formData.get("tripId") ?? "");
  const typeRaw = String(formData.get("type") ?? "");
  const date = String(formData.get("date") ?? "");
  const amount = Number(formData.get("amount"));
  const walletId = String(formData.get("walletId") ?? "");
  const toWalletId = String(formData.get("toWalletId") ?? "").trim() || null;
  const toAmountRaw = formData.get("toAmount");
  const toAmount = toAmountRaw ? Number(toAmountRaw) : null;
  const categoryRaw = String(formData.get("category") ?? "");
  const category = isTripExpenseCategory(categoryRaw) ? categoryRaw : null;
  const note = String(formData.get("note") ?? "").trim();
  const linkedAccountId = String(formData.get("linkedAccountId") ?? "").trim() || null;
  const linkedAmountRaw = formData.get("linkedAmount");
  const linkedAmount = linkedAmountRaw ? Number(linkedAmountRaw) : null;

  if (!tripId) return { error: "Missing trip." };
  if (!isTripTransactionType(typeRaw)) return { error: "Invalid type." };
  if (!date) return { error: "Date is required." };
  if (!walletId) return { error: "Pick a wallet." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }
  if (typeRaw === "transfer") {
    if (!toWalletId) return { error: "Pick a destination wallet." };
    if (!Number.isFinite(toAmount) || (toAmount ?? 0) <= 0) {
      return { error: "Converted amount must be a positive number." };
    }
  }
  if (typeRaw === "income" && linkedAccountId && (!Number.isFinite(linkedAmount) || (linkedAmount ?? 0) <= 0)) {
    return { error: "Enter the real amount that left the linked account." };
  }

  await addTripTransaction(tripId, {
    type: typeRaw,
    date,
    amount,
    walletId,
    toWalletId: typeRaw === "transfer" ? toWalletId : null,
    toAmount: typeRaw === "transfer" ? toAmount : null,
    category: typeRaw === "expense" ? category : null,
    note,
    linkedAccountId: typeRaw === "income" ? linkedAccountId : null,
    linkedAmount: typeRaw === "income" ? linkedAmount : null,
  });
  revalidatePath(`/travel/${tripId}`);
  revalidatePath("/day-to-day");
}

export async function editTripTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const tripId = String(formData.get("tripId") ?? "");
  const date = String(formData.get("date") ?? "");
  const amount = Number(formData.get("amount"));
  const toAmountRaw = formData.get("toAmount");
  const toAmount = toAmountRaw ? Number(toAmountRaw) : null;
  const categoryRaw = String(formData.get("category") ?? "");
  const category = isTripExpenseCategory(categoryRaw) ? categoryRaw : null;
  const note = String(formData.get("note") ?? "").trim();

  if (!id) return { error: "Missing entry." };
  if (!date) return { error: "Date is required." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be a positive number." };

  await updateTripTransaction(id, { date, amount, toAmount, category, note });
  revalidatePath(`/travel/${tripId}`);
}

export async function removeTripTransaction(id: string, tripId: string): Promise<void> {
  await deleteTripTransaction(id);
  revalidatePath(`/travel/${tripId}`);
  revalidatePath("/day-to-day");
}
