"use server";

import { revalidatePath } from "next/cache";
import { addAccount, deleteAccount } from "@/lib/accounts";
import { CURRENCIES, type Currency } from "@/lib/types";

export type FormState = { error: string } | undefined;

export async function createAccount(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "");

  if (!name) return { error: "Name is required." };
  if (!(CURRENCIES as readonly string[]).includes(currency)) {
    return { error: "Invalid currency." };
  }

  await addAccount({ name, currency: currency as Currency });
  revalidatePath("/day-to-day/accounts");
  revalidatePath("/day-to-day/new");
  revalidatePath("/day-to-day");
}

export async function removeAccount(id: string): Promise<void> {
  await deleteAccount(id);
  revalidatePath("/day-to-day/accounts");
  revalidatePath("/day-to-day/new");
  revalidatePath("/day-to-day");
}
