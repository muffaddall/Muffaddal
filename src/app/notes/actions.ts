"use server";

import { revalidatePath } from "next/cache";
import { addNote, deleteNote, updateNote } from "@/lib/notes";

export type FormState = { error: string } | undefined;

function revalidateNotes(): void {
  revalidatePath("/notes");
}

export async function createNote(_prev: FormState, formData: FormData): Promise<FormState> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something first." };

  await addNote(body);
  revalidateNotes();
}

export async function saveNote(id: string, body: string): Promise<{ error: string } | void> {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Note can't be empty." };

  await updateNote(id, trimmed);
  revalidateNotes();
}

export async function removeNote(id: string): Promise<void> {
  await deleteNote(id);
  revalidateNotes();
}
