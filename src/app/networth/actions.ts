"use server";

import { revalidatePath } from "next/cache";
import { setAedPerGbpRate, setAedPerInrRate } from "@/lib/fx";

export type FormState = { error: string } | undefined;

export async function saveAedPerGbpRate(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const rate = Number(formData.get("rate"));
  if (!Number.isFinite(rate) || rate <= 0) return { error: "Rate must be a positive number." };

  await setAedPerGbpRate(rate);
  revalidatePath("/networth");
}

export async function saveAedPerInrRate(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const rate = Number(formData.get("rate"));
  if (!Number.isFinite(rate) || rate <= 0) return { error: "Rate must be a positive number." };

  await setAedPerInrRate(rate);
  revalidatePath("/networth");
}
