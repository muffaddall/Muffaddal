import "server-only";
import { supabase } from "@/lib/supabase";
import type { Post, PostInput } from "@/lib/types";

type PostRow = {
  id: string;
  name: string;
  shoot_date: string;
  edit_date: string;
  post_date: string;
  type: Post["type"];
  idea: string;
  inspiration: string | null;
  created_at: string;
};

function fromRow(row: PostRow): Post {
  return {
    id: row.id,
    name: row.name,
    shootDate: row.shoot_date,
    editDate: row.edit_date,
    postDate: row.post_date,
    type: row.type,
    idea: row.idea,
    inspiration: row.inspiration ?? "",
    createdAt: row.created_at,
  };
}

function toRow(input: PostInput) {
  return {
    name: input.name,
    shoot_date: input.shootDate,
    edit_date: input.editDate,
    post_date: input.postDate,
    type: input.type,
    idea: input.idea,
    inspiration: input.inspiration || null,
  };
}

export async function getPostsForDate(date: string): Promise<{
  shoot: Post[];
  edit: Post[];
  post: Post[];
}> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .or(`shoot_date.eq.${date},edit_date.eq.${date},post_date.eq.${date}`)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []).map(fromRow);
  return {
    shoot: rows.filter((p) => p.shootDate === date),
    edit: rows.filter((p) => p.editDate === date),
    post: rows.filter((p) => p.postDate === date),
  };
}

export async function getPostsForRange(
  start: string,
  end: string
): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .or(
      `and(shoot_date.gte.${start},shoot_date.lte.${end}),and(edit_date.gte.${start},edit_date.lte.${end}),and(post_date.gte.${start},post_date.lte.${end})`
    );

  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
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
