"use server";

import { revalidatePath } from "next/cache";
import { createFormat, deleteFormat } from "@/lib/tourneys";

export type FormState = { error: string } | undefined;

export async function createFormatAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const numGroups = Number(formData.get("numGroups"));

  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(numGroups) || numGroups < 1) return { error: "Enter a valid number of groups." };

  try {
    await createFormat(name, numGroups);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save format." };
  }
  revalidatePath("/community/padel/formats");
}

export async function removeFormatAction(id: string): Promise<void> {
  await deleteFormat(id);
  revalidatePath("/community/padel/formats");
}
