"use server";

import { revalidatePath } from "next/cache";
import { addDdCategory, deleteDdCategory } from "@/lib/ddCategories";
import { isDdCategoryKind } from "@/lib/types";

export type FormState = { error: string } | undefined;

export async function createCategory(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parentIdRaw = String(formData.get("parentId") ?? "");
  const parentId = parentIdRaw ? parentIdRaw : null;
  const kind = String(formData.get("kind") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!isDdCategoryKind(kind)) return { error: "Invalid kind." };
  if (!name) return { error: "Name is required." };

  await addDdCategory({ parentId, kind, name });
  revalidatePath("/day-to-day/categories");
  revalidatePath("/day-to-day/new");
}

export async function removeCategory(id: string): Promise<void> {
  await deleteDdCategory(id);
  revalidatePath("/day-to-day/categories");
  revalidatePath("/day-to-day/new");
}
