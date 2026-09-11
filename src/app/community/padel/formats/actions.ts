"use server";

import { revalidatePath } from "next/cache";
import { createFormat, deleteFormat } from "@/lib/tourneys";

export type FormState = { error: string } | undefined;

function parseGroupSizesInput(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export async function createFormatAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const groupSizes = parseGroupSizesInput(String(formData.get("groupSizes") ?? ""));
  const qualifiersPerGroup = Number(formData.get("qualifiersPerGroup"));
  const wildcardCount = Number(formData.get("wildcardCount") || 0);
  const groupStageCourtHours = Number(formData.get("groupStageCourtHours") || 0);
  const quarterfinalCourtHours = Number(formData.get("quarterfinalCourtHours") || 0);
  const semifinalFinalCourtHours = Number(formData.get("semifinalFinalCourtHours") || 0);
  const courtHourRate = Number(formData.get("courtHourRate") || 0);

  if (!name) return { error: "Name is required." };
  if (groupSizes.length === 0) return { error: "Enter at least one group size, e.g. 4,4,4,4." };
  if (!Number.isFinite(qualifiersPerGroup) || qualifiersPerGroup < 1) {
    return { error: "Enter a valid number of qualifiers per group." };
  }

  try {
    await createFormat({
      name,
      groupSizes,
      qualifiersPerGroup,
      wildcardCount,
      groupStageCourtHours,
      quarterfinalCourtHours,
      semifinalFinalCourtHours,
      courtHourRate,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save format." };
  }
  revalidatePath("/community/padel/formats");
}

export async function removeFormatAction(id: string): Promise<void> {
  await deleteFormat(id);
  revalidatePath("/community/padel/formats");
}
