import "server-only";
import { supabase } from "@/lib/supabase";
import type { PodcastEpisode } from "@/lib/types";

type PodcastEpisodeRow = {
  id: string;
  name: string;
  idea: string;
  shoot_date: string | null;
  edit_date: string | null;
  post_date: string | null;
  shot_done: boolean;
  edited_done: boolean;
  posted: boolean;
  created_at: string;
};

function fromRow(row: PodcastEpisodeRow): PodcastEpisode {
  return {
    id: row.id,
    name: row.name,
    idea: row.idea,
    shootDate: row.shoot_date,
    editDate: row.edit_date,
    postDate: row.post_date,
    shotDone: row.shot_done,
    editedDone: row.edited_done,
    posted: row.posted,
    createdAt: row.created_at,
  };
}

export async function getAllPodcastEpisodes(): Promise<PodcastEpisode[]> {
  const { data, error } = await supabase
    .from("podcast_episodes")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function addPodcastEpisode(input: {
  name: string;
  idea: string;
  shootDate: string | null;
  editDate: string | null;
  postDate: string | null;
}): Promise<void> {
  const { error } = await supabase.from("podcast_episodes").insert({
    name: input.name,
    idea: input.idea,
    shoot_date: input.shootDate,
    edit_date: input.editDate,
    post_date: input.postDate,
  });
  if (error) throw new Error(error.message);
}

export async function updatePodcastEpisode(
  id: string,
  input: {
    name: string;
    idea: string;
    shootDate: string | null;
    editDate: string | null;
    postDate: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("podcast_episodes")
    .update({
      name: input.name,
      idea: input.idea,
      shoot_date: input.shootDate,
      edit_date: input.editDate,
      post_date: input.postDate,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setPodcastEpisodeFlag(
  id: string,
  field: "shotDone" | "editedDone" | "posted",
  value: boolean
): Promise<void> {
  const column = field === "shotDone" ? "shot_done" : field === "editedDone" ? "edited_done" : "posted";
  const { error } = await supabase.from("podcast_episodes").update({ [column]: value }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePodcastEpisode(id: string): Promise<void> {
  const { error } = await supabase.from("podcast_episodes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
