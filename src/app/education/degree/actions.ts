"use server";

import { revalidatePath } from "next/cache";
import { setDegreePlanStatus } from "@/lib/degreePlan";
import { getCourseById } from "@/lib/degreePlanCatalog";
import { isDegreePlanStatus, type DegreePlanStatus } from "@/lib/types";

export async function updateDegreePlanStatus(
  courseId: string,
  status: DegreePlanStatus,
  plannedTerm: string | null
): Promise<{ error: string } | undefined> {
  if (!getCourseById(courseId)) return { error: "Unknown course." };
  if (!isDegreePlanStatus(status)) return { error: "Invalid status." };

  await setDegreePlanStatus({ courseId, status, plannedTerm: status === "planned" ? plannedTerm : null });
  revalidatePath("/education/degree");
}
