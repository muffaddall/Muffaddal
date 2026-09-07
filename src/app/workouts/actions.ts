"use server";

import { revalidatePath } from "next/cache";
import { setWeeklyTarget } from "@/lib/workouts";

export type FormState = { error: string } | undefined;

export async function saveWeeklyTarget(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const weekStart = String(formData.get("weekStart") ?? "");
  const running = Number(formData.get("running"));
  const cycling = Number(formData.get("cycling"));
  const swimming = Number(formData.get("swimming"));

  if (!weekStart) return { error: "Missing week." };
  for (const [label, value] of [
    ["Running", running],
    ["Cycling", cycling],
    ["Swimming", swimming],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) {
      return { error: `${label} target must be 0 or more.` };
    }
  }

  await setWeeklyTarget({ weekStart, running, cycling, swimming });
  revalidatePath("/workouts");
}
