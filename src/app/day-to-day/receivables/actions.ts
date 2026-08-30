"use server";

import { revalidatePath } from "next/cache";
import { addPerson } from "@/lib/people";
import {
  addReceivable,
  deleteReceivable,
  getReceivablesForTransaction,
  markReceivablePaidBack,
} from "@/lib/receivables";
import { getTransaction } from "@/lib/transactions";

export type FormState = { error: string } | undefined;

function revalidateReceivablePaths(transactionId: string, accountId: string) {
  revalidatePath(`/day-to-day/receivables/${transactionId}`);
  revalidatePath("/day-to-day/people");
  revalidatePath("/day-to-day");
  revalidatePath("/day-to-day/accounts");
  revalidatePath(`/day-to-day/accounts/${accountId}`);
  revalidatePath("/");
}

export async function createReceivable(
  transactionId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const amount = Number(formData.get("amount"));
  const personId = String(formData.get("personId") ?? "");
  const newPersonName = String(formData.get("newPersonName") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }
  if (!personId && !newPersonName) {
    return { error: "Choose a person or type a new name." };
  }

  const transaction = await getTransaction(transactionId);
  if (!transaction) return { error: "Transaction not found." };

  const existingSplits = await getReceivablesForTransaction(transactionId);
  const alreadySplit = existingSplits.reduce((sum, r) => sum + r.amount, 0);
  if (alreadySplit + amount > transaction.amount) {
    return {
      error: `That's more than what's left to split (${(transaction.amount - alreadySplit).toFixed(2)} remaining).`,
    };
  }

  const finalPersonId = newPersonName ? (await addPerson(newPersonName)).id : personId;

  await addReceivable({ transactionId, personId: finalPersonId, amount });
  revalidateReceivablePaths(transactionId, transaction.accountId);
}

export async function markPaidBack(
  receivableId: string,
  transactionId: string,
  accountId: string,
  amount: number,
  personName: string
): Promise<void> {
  await markReceivablePaidBack(receivableId, accountId, amount, `Repaid by ${personName}`);
  revalidateReceivablePaths(transactionId, accountId);
}

export async function removeReceivable(
  receivableId: string,
  transactionId: string,
  accountId: string
): Promise<void> {
  await deleteReceivable(receivableId);
  revalidateReceivablePaths(transactionId, accountId);
}
