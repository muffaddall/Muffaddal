"use server";

import { revalidatePath } from "next/cache";
import { deleteTransaction, setTransactionCleared } from "@/lib/transactions";

function revalidateTransactionPaths(accountIds: string[]): void {
  revalidatePath("/day-to-day");
  revalidatePath("/day-to-day/accounts");
  for (const accountId of accountIds) {
    revalidatePath(`/day-to-day/accounts/${accountId}`);
  }
  revalidatePath("/");
  revalidatePath("/networth");
}

export async function removeTransaction(id: string, accountIds: string[]): Promise<void> {
  await deleteTransaction(id);
  revalidateTransactionPaths(accountIds);
}

export async function toggleTransactionCleared(
  id: string,
  cleared: boolean,
  accountIds: string[]
): Promise<void> {
  await setTransactionCleared(id, cleared);
  revalidateTransactionPaths(accountIds);
}
