"use client";

import { useState, useTransition } from "react";
import { removeNote, saveNote } from "./actions";
import { formatDateShort } from "@/lib/date";
import type { Note } from "@/lib/types";

export default function NoteCard({ note }: { note: Note }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const save = () => {
    setError(null);
    startSave(async () => {
      const result = await saveNote(note.id, body);
      if (result?.error) setError(result.error);
      else setEditing(false);
    });
  };

  if (editing) {
    return (
      <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-accent)] p-3 flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          autoFocus
          className="w-full rounded-lg bg-white/5 border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] resize-y"
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setBody(note.body);
              setEditing(false);
              setError(null);
            }}
            className="rounded-lg border border-[var(--color-border)] text-sm px-3 py-1.5 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={save}
            className="rounded-lg bg-[var(--color-accent)] text-black text-sm font-medium px-3 py-1.5 disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
        {error && <p className="text-xs text-[var(--color-negative)]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 flex flex-col gap-2">
      <p className="text-sm whitespace-pre-wrap break-words">{note.body}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--color-fg-dim)]">{formatDateShort(note.updatedAt.slice(0, 10))}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-[var(--color-fg-dim)] hover:text-white/80 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => startDelete(() => removeNote(note.id))}
            className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
          >
            {isDeleting ? "…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
