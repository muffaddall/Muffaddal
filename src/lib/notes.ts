import "server-only";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/types";

type NoteRow = { id: string; body: string; created_at: string; updated_at: string };

function fromRow(row: NoteRow): Note {
  return { id: row.id, body: row.body, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase.from("notes").select("*").order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => fromRow(r as NoteRow));
}

export async function addNote(body: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("notes").insert({ body, created_at: now, updated_at: now });
  if (error) throw new Error(error.message);
}

export async function updateNote(id: string, body: string): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
