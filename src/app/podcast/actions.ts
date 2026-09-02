"use server";

import { revalidatePath } from "next/cache";
import {
  addPodcastEpisode,
  deletePodcastEpisode,
  setPodcastEpisodeFlag,
  updatePodcastEpisode,
} from "@/lib/podcast";

export type FormState = { error: string } | undefined;

function dateOrNull(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function createEpisode(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const idea = String(formData.get("idea") ?? "").trim();

  if (!name) return { error: "Name is required." };

  await addPodcastEpisode({
    name,
    idea,
    shootDate: dateOrNull(formData, "shootDate"),
    editDate: dateOrNull(formData, "editDate"),
    postDate: dateOrNull(formData, "postDate"),
  });
  revalidatePath("/podcast");
}

export async function editEpisode(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const idea = String(formData.get("idea") ?? "").trim();

  if (!id) return { error: "Missing episode." };
  if (!name) return { error: "Name is required." };

  await updatePodcastEpisode(id, {
    name,
    idea,
    shootDate: dateOrNull(formData, "shootDate"),
    editDate: dateOrNull(formData, "editDate"),
    postDate: dateOrNull(formData, "postDate"),
  });
  revalidatePath("/podcast");
}

export async function removeEpisode(id: string): Promise<void> {
  await deletePodcastEpisode(id);
  revalidatePath("/podcast");
}

export async function toggleEpisodeFlag(
  id: string,
  field: "shotDone" | "editedDone" | "posted",
  value: boolean
): Promise<void> {
  await setPodcastEpisodeFlag(id, field, value);
  revalidatePath("/podcast");
}
