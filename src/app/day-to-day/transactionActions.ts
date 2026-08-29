"use server";

import { revalidatePath } from "next/cache";
import { deleteTransaction } from "@/lib/transactions";

export async function removeTransaction(id: string, accountIds: string[]): Promise<void> {
  await deleteTransaction(id);
  revalidatePath("/day-to-day");
  revalidatePath("/day-to-day/accounts");
  for (const accountId of accountIds) {
    revalidatePath(`/day-to-day/accounts/${accountId}`);
  }
}
