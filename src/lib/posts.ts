import "server-only";
import { supabase } from "@/lib/supabase";
import { isScheduled, type Post, type PostInput, type ScheduledPost } from "@/lib/types";

type PostRow = {
  id: string;
  name: string;
  shoot_date: string | null;
  edit_date: string | null;
  post_date: string | null;
  post_time: string | null;
  type: Post["type"];
  idea: string;
  inspiration: string | null;
  shoot_notes: string | null;
  edit_notes: string | null;
  post_notes: string | null;
  group_id: string | null;
  posted_tiktok: boolean | null;
  posted_youtube: boolean | null;
  posted_instagram: boolean | null;
  shot_done: boolean | null;
  edited_done: boolean | null;
  created_at: string;
};

function fromRow(row: PostRow): Post {
  return {
    id: row.id,
    name: row.name,
    shootDate: row.shoot_date,
    editDate: row.edit_date,
    postDate: row.post_date,
    postTime: row.post_time ? row.post_time.slice(0, 5) : null,
    type: row.type,
    idea: row.idea,
    inspiration: row.inspiration ?? "",
    shootNotes: row.shoot_notes ?? "",
    editNotes: row.edit_notes ?? "",
    postNotes: row.post_notes ?? "",
    groupId: row.group_id,
    postedTiktok: row.posted_tiktok ?? false,
    postedYoutube: row.posted_youtube ?? false,
    postedInstagram: row.posted_instagram ?? false,
    shotDone: row.shot_done ?? false,
    editedDone: row.edited_done ?? false,
    createdAt: row.created_at,
  };
}

function toRow(input: PostInput) {
  return {
    name: input.name,
    shoot_date: input.shootDate,
    edit_date: input.editDate,
    post_date: input.postDate,
    post_time: input.postTime,
    type: input.type,
    idea: input.idea,
    inspiration: input.inspiration || null,
    shoot_notes: input.shootNotes || null,
    edit_notes: input.editNotes || null,
    post_notes: input.postNotes || null,
    group_id: input.groupId,
    posted_tiktok: input.postedTiktok,
    posted_youtube: input.postedYoutube,
    posted_instagram: input.postedInstagram,
    shot_done: input.shotDone,
    edited_done: input.editedDone,
  };
}

export async function getPostsForDate(date: string): Promise<{
  shoot: ScheduledPost[];
  edit: ScheduledPost[];
  post: ScheduledPost[];
}> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .or(`shoot_date.eq.${date},edit_date.eq.${date},post_date.eq.${date}`)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []).map(fromRow);
  return {
    shoot: rows.filter((p) => p.shootDate === date).filter(isScheduled),
    edit: rows.filter((p) => p.editDate === date).filter(isScheduled),
    post: rows.filter((p) => p.postDate === date).filter(isScheduled),
  };
}

export async function getPostsForRange(
  start: string,
  end: string
): Promise<ScheduledPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .or(
      `and(shoot_date.gte.${start},shoot_date.lte.${end}),and(edit_date.gte.${start},edit_date.lte.${end}),and(post_date.gte.${start},post_date.lte.${end})`
    );

  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow).filter(isScheduled);
}

export async function getPostsByPostDateRange(
  start: string,
  end: string
): Promise<ScheduledPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .gte("post_date", start)
    .lte("post_date", end);

  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow).filter(isScheduled);
}

export async function getPost(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

export async function getPostsByGroup(groupId: string | null): Promise<Post[]> {
  let query = supabase.from("posts").select("*").order("created_at", { ascending: true });
  query = groupId === null ? query.is("group_id", null) : query.eq("group_id", groupId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function createPost(input: PostInput): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .insert(toRow(input))
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function updatePost(
  id: string,
  input: PostInput
): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
