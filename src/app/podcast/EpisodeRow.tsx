"use client";

import { useActionState, useState, useTransition } from "react";
import { editEpisode, removeEpisode, toggleEpisodeFlag } from "./actions";
import { isPodcastScheduled, type PodcastEpisode } from "@/lib/types";
import { formatDateShort } from "@/lib/date";

export default function EpisodeRow({ episode }: { episode: PodcastEpisode }) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await editEpisode(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);

  if (editing) {
    return (
      <li className="rounded-xl border border-white/8 bg-[var(--color-surface)] p-3">
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={episode.id} />
          <input
            name="name"
            defaultValue={episode.name}
            placeholder="Episode name"
            required
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-shoot)]"
          />
          <textarea
            name="idea"
            defaultValue={episode.idea}
            placeholder="Idea / notes"
            rows={2}
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-shoot)] resize-none"
          />
          <div className="grid grid-cols-3 gap-2">
            <DateField label="Shoot" name="shootDate" defaultValue={episode.shootDate} />
            <DateField label="Edit" name="editDate" defaultValue={episode.editDate} />
            <DateField label="Post" name="postDate" defaultValue={episode.postDate} />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[var(--color-shoot)] text-black text-sm font-medium px-3 py-1.5 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-white/10 text-sm px-3 py-1.5 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
          {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
        </form>
      </li>
    );
  }

  const scheduled = isPodcastScheduled(episode);

  return (
    <li className="rounded-xl border border-white/8 bg-[var(--color-surface)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{episode.name}</p>
          {episode.idea && <p className="text-xs text-white/45 mt-0.5">{episode.idea}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-white/45 hover:text-white/80"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => startDelete(() => removeEpisode(episode.id))}
            className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
          >
            {isDeleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      {scheduled && (
        <div className="mt-2.5 pt-2.5 border-t border-white/8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <FlagToggle
            id={episode.id}
            field="shotDone"
            checked={episode.shotDone}
            label={episode.shootDate ? `Shot ${formatDateShort(episode.shootDate)}` : "Shot"}
          />
          <FlagToggle
            id={episode.id}
            field="editedDone"
            checked={episode.editedDone}
            label={episode.editDate ? `Edited ${formatDateShort(episode.editDate)}` : "Edited"}
          />
          <FlagToggle
            id={episode.id}
            field="posted"
            checked={episode.posted}
            label={episode.postDate ? `Posted ${formatDateShort(episode.postDate)}` : "Posted"}
          />
        </div>
      )}
    </li>
  );
}

function FlagToggle({
  id,
  field,
  checked,
  label,
}: {
  id: string;
  field: "shotDone" | "editedDone" | "posted";
  checked: boolean;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <label className="flex items-center gap-1.5 text-white/60">
      <input
        type="checkbox"
        checked={checked}
        disabled={isPending}
        onChange={(e) => {
          const value = e.target.checked;
          startTransition(() => toggleEpisodeFlag(id, field, value));
        }}
        className="h-3.5 w-3.5 accent-[var(--color-shoot)]"
      />
      {label}
    </label>
  );
}

function DateField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-white/40">{label}</span>
      <input
        name={name}
        type="date"
        defaultValue={defaultValue ?? ""}
        className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs outline-none focus:border-[var(--color-shoot)]"
      />
    </label>
  );
}
