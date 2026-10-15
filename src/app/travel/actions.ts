"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addTrip, deleteTrip } from "@/lib/trips";

export type FormState = { error: string } | undefined;

export async function createTrip(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const currencies = formData.getAll("currencies").map(String).filter(Boolean);

  if (!name) return { error: "Trip name is required." };
  if (currencies.length === 0) return { error: "Add at least one currency." };

  const tripId = await addTrip({ name, currencies });
  revalidatePath("/travel");
  redirect(`/travel/${tripId}`);
}

export async function removeTrip(id: string): Promise<void> {
  await deleteTrip(id);
  revalidatePath("/travel");
}
