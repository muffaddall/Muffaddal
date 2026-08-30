"use server";

import { revalidatePath } from "next/cache";
import { addPerson, deletePerson } from "@/lib/people";

export type FormState = { error: string } | undefined;

export async function createPerson(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  await addPerson(name);
  revalidatePath("/day-to-day/people");
}

export async function removePerson(id: string): Promise<void> {
  await deletePerson(id);
  revalidatePath("/day-to-day/people");
}
