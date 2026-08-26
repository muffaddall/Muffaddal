"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PLATFORMS,
  POST_TYPES,
  type Group,
  type PlatformKey,
  type Post,
  type PostInput,
  type PostType,
  type TargetPlatformKey,
} from "@/lib/types";
import { todayStr } from "@/lib/date";

const TYPE_COLORS: Record<PostType, string> = {
  Reel: "var(--color-type-reel)",
  Carousel: "var(--color-type-carousel)",
  "Static Post": "var(--color-type-static)",
  Story: "var(--color-type-story)",
  Other: "var(--color-type-other)",
};

const NEW_GROUP = "__new__";

type Props = (
  | { mode: "add" }
  | { mode: "edit"; postId: string; initial: Post }
) & {
  returnTo?: string;
  groups: Group[];
  initialScheduleOpen?: boolean;
  initialGroupId?: string;
};

export function PostForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : undefined;
  const returnTo = props.returnTo ?? "/";

  const [scheduleOpen, setScheduleOpen] = useState(
    props.initialScheduleOpen ?? (initial ? initial.postDate !== null : false)
  );
  const [saving, setSaving] = useState<"schedule" | "vault" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<PostType>(initial?.type ?? "Reel");
  const [inspiration, setInspiration] = useState(initial?.inspiration ?? "");
  const [groupSelection, setGroupSelection] = useState(
    initial?.groupId ?? props.initialGroupId ?? ""
  );
  const [newGroupName, setNewGroupName] = useState("");

  const [shootDate, setShootDate] = useState(initial?.shootDate ?? todayStr());
  const [editDate, setEditDate] = useState(initial?.editDate ?? todayStr());
  const [postDate, setPostDate] = useState(initial?.postDate ?? todayStr());
  const [shootNotes, setShootNotes] = useState(initial?.shootNotes ?? "");
  const [editNotes, setEditNotes] = useState(initial?.editNotes ?? "");
  const [postNotes, setPostNotes] = useState(initial?.postNotes ?? "");
  const [postTime, setPostTime] = useState(initial?.postTime ?? "");
  const [postedTiktok, setPostedTiktok] = useState(initial?.postedTiktok ?? false);
  const [postedYoutube, setPostedYoutube] = useState(initial?.postedYoutube ?? false);
  const [postedInstagram, setPostedInstagram] = useState(initial?.postedInstagram ?? false);
  const [targetTiktok, setTargetTiktok] = useState(initial?.targetTiktok ?? true);
  const [targetYoutube, setTargetYoutube] = useState(initial?.targetYoutube ?? true);
  const [targetInstagram, setTargetInstagram] = useState(initial?.targetInstagram ?? true);
  const [shotDone, setShotDone] = useState(initial?.shotDone ?? false);
  const [editedDone, setEditedDone] = useState(initial?.editedDone ?? false);

  const postedState: Record<PlatformKey, boolean> = {
    postedTiktok,
    postedYoutube,
    postedInstagram,
  };
  const postedSetters: Record<PlatformKey, (v: boolean) => void> = {
    postedTiktok: setPostedTiktok,
    postedYoutube: setPostedYoutube,
    postedInstagram: setPostedInstagram,
  };
  const targetState: Record<TargetPlatformKey, boolean> = {
    targetTiktok,
    targetYoutube,
    targetInstagram,
  };
  const targetSetters: Record<TargetPlatformKey, (v: boolean) => void> = {
    targetTiktok: setTargetTiktok,
    targetYoutube: setTargetYoutube,
    targetInstagram: setTargetInstagram,
  };

  const canSave = name.trim().length > 0;
  const wasScheduled = initial ? initial.postDate !== null : false;

  async function resolveGroupId(): Promise<string | null> {
    if (groupSelection === NEW_GROUP) {
      const trimmed = newGroupName.trim();
      if (!trimmed) throw new Error("Enter a name for the new group");
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error("Couldn't create that group");
      const { group } = (await res.json()) as { group: Group };
      return group.id;
    }
    return groupSelection || null;
  }

  async function submit(mode: "schedule" | "vault") {
    if (!canSave) return;
    setError("");
    setSaving(mode);
    try {
      const groupId = await resolveGroupId();
      const body: PostInput = {
        name: name.trim(),
        type,
        idea: initial?.idea ?? "",
        inspiration: inspiration.trim(),
        groupId,
        shootDate: mode === "schedule" ? shootDate : null,
        editDate: mode === "schedule" ? editDate : null,
        postDate: mode === "schedule" ? postDate : null,
        postTime: mode === "schedule" ? postTime || null : null,
        shootNotes: mode === "schedule" ? shootNotes.trim() : "",
        editNotes: mode === "schedule" ? editNotes.trim() : "",
        postNotes: mode === "schedule" ? postNotes.trim() : "",
        postedTiktok: mode === "schedule" && postedTiktok,
        postedYoutube: mode === "schedule" && postedYoutube,
        postedInstagram: mode === "schedule" && postedInstagram,
        targetTiktok,
        targetYoutube,
        targetInstagram,
        shotDone: mode === "schedule" && shotDone,
        editedDone: mode === "schedule" && editedDone,
      };

      const url = isEdit ? `/api/posts/${props.postId}` : "/api/posts";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
      const { post } = (await res.json()) as { post: Post };

      if (mode === "schedule") {
        router.push(`${returnTo}?date=${post.postDate}`);
      } else {
        router.push(
          post.groupId ? `/vault/group/${post.groupId}` : "/vault/ungrouped"
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(null);
    }
  }

  async function handleUnschedule() {
    if (wasScheduled) {
      const ok = window.confirm(
        "Unschedule this idea? It'll move back to the Idea Vault and come off the calendar, but won't be deleted."
      );
      if (!ok) return;
    }
    await submit("vault");
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!window.confirm("Delete this idea? This can't be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${props.postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push(returnTo);
      router.refresh();
    } catch {
      setError("Failed to delete. Try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center px-4 pt-4 pb-2 gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg shrink-0"
        >
          ✕
        </button>

        <h1 className="font-display text-4xl tracking-wide flex-1 text-center">
          {isEdit ? "Edit idea" : "New Idea"}
        </h1>

        {isEdit && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete this idea"
            className="text-xs font-medium text-[var(--color-shoot)] shrink-0 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>

      <div className="flex-1 px-5 pt-3 flex flex-col gap-6 overflow-y-auto">
        <Field label="Idea name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What's this idea called?"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-lg outline-none focus:border-[var(--color-post)] transition-colors"
          />
        </Field>

        <Field label="Type of post">
          <div className="grid grid-cols-2 gap-2.5">
            {POST_TYPES.map((t) => {
              const selected = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="rounded-2xl border p-3.5 text-left transition-colors"
                  style={{
                    borderColor: selected ? TYPE_COLORS[t] : "rgba(255,255,255,0.1)",
                    background: selected ? `${TYPE_COLORS[t]}22` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <span
                    className="block h-2.5 w-2.5 rounded-full mb-2"
                    style={{ background: TYPE_COLORS[t] }}
                  />
                  <span className="font-medium text-sm">{t}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Inspiration" hint="Optional">
          <textarea
            value={inspiration}
            onChange={(e) => setInspiration(e.target.value)}
            placeholder="A link, an account, a note on where this came from..."
            rows={3}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-base outline-none focus:border-[var(--color-post)] transition-colors resize-none"
          />
        </Field>

        <Field label="Group" hint="Optional">
          <select
            value={groupSelection}
            onChange={(e) => setGroupSelection(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-base outline-none focus:border-[var(--color-post)] transition-colors"
            style={{ colorScheme: "dark" }}
          >
            <option value="">No group</option>
            {props.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
            <option value={NEW_GROUP}>+ New group…</option>
          </select>
          {groupSelection === NEW_GROUP && (
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              autoFocus
              className="w-full mt-2.5 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-base outline-none focus:border-[var(--color-post)] transition-colors"
            />
          )}
        </Field>

        <Field label="Posting to" hint="Which platforms this is meant for">
          <div className="flex gap-2.5">
            {PLATFORMS.map(({ targetKey, label }) => {
              const targeted = targetState[targetKey];
              return (
                <button
                  key={targetKey}
                  type="button"
                  onClick={() => targetSetters[targetKey](!targeted)}
                  className="flex-1 rounded-2xl border p-3 text-center transition-colors"
                  style={{
                    borderColor: targeted ? "var(--color-post)" : "rgba(255,255,255,0.1)",
                    background: targeted ? "var(--color-post)22" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <span className="block text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </Field>

        {scheduleOpen && (
          <Field label="Dates">
            <div className="flex flex-col gap-3">
              <DateWithNotes
                label="Shoot date"
                notesLabel="Shooting notes"
                color="var(--color-shoot)"
                date={shootDate}
                onDateChange={setShootDate}
                notes={shootNotes}
                onNotesChange={setShootNotes}
                doneLabel="Shot"
                done={shotDone}
                onDoneChange={setShotDone}
              />
              <DateWithNotes
                label="Edit date"
                notesLabel="Edit notes"
                color="var(--color-edit)"
                date={editDate}
                onDateChange={setEditDate}
                notes={editNotes}
                onNotesChange={setEditNotes}
                doneLabel="Edited"
                done={editedDone}
                onDoneChange={setEditedDone}
              />
              <DateWithNotes
                label="Posting date"
                notesLabel="Posting notes"
                color="var(--color-post)"
                date={postDate}
                onDateChange={setPostDate}
                notes={postNotes}
                onNotesChange={setPostNotes}
                time={postTime}
                onTimeChange={setPostTime}
              />
            </div>
          </Field>
        )}

        {scheduleOpen && (
          <Field label="Posted to socials" hint="Tap once it's live">
            <div className="flex gap-2.5">
              {PLATFORMS.map(({ key, label }) => {
                const posted = postedState[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => postedSetters[key](!posted)}
                    className="flex-1 rounded-2xl border p-3.5 text-center transition-colors"
                    style={{
                      borderColor: posted
                        ? "var(--color-type-static)"
                        : "rgba(255,255,255,0.1)",
                      background: posted
                        ? "var(--color-type-static)22"
                        : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span className="block text-sm font-medium">{label}</span>
                    <span
                      className="block text-xs mt-1"
                      style={{
                        color: posted ? "var(--color-type-static)" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {posted ? "Posted" : "Not yet"}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        {error && <p className="text-sm text-[var(--color-shoot)]">{error}</p>}

      <div className="sticky bottom-0 -mx-5 px-5 pb-6 pt-4 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)] to-transparent flex flex-col gap-2">
        {scheduleOpen ? (
          <>
            <button
              onClick={() => submit("schedule")}
              disabled={!canSave || saving !== null}
              className="w-full rounded-xl bg-[var(--color-post)] text-black font-semibold py-3.5 text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {saving === "schedule" ? "Saving…" : "Save & schedule"}
            </button>
            <button
              onClick={handleUnschedule}
              disabled={!canSave || saving !== null}
              className={`w-full text-center text-sm py-1 disabled:opacity-40 ${
                wasScheduled ? "text-[var(--color-shoot)] font-medium" : "text-white/45"
              }`}
            >
              {saving === "vault"
                ? "Saving…"
                : wasScheduled
                  ? "Unschedule this idea"
                  : "Save without scheduling instead"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setScheduleOpen(true)}
              disabled={!canSave}
              className="w-full rounded-xl bg-[var(--color-post)] text-black font-semibold py-3.5 text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Schedule
            </button>
            <button
              onClick={() => submit("vault")}
              disabled={!canSave || saving !== null}
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white font-medium py-3.5 text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {saving === "vault" ? "Saving…" : "Save without scheduling"}
            </button>
          </>
        )}
      </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <h2 className="font-display text-lg tracking-wide">{label}</h2>
        {hint && <span className="text-xs text-white/35">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function DateWithNotes({
  label,
  notesLabel,
  color,
  date,
  onDateChange,
  notes,
  onNotesChange,
  time,
  onTimeChange,
  doneLabel,
  done,
  onDoneChange,
}: {
  label: string;
  notesLabel: string;
  color: string;
  date: string;
  onDateChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  time?: string;
  onTimeChange?: (v: string) => void;
  doneLabel?: string;
  done?: boolean;
  onDoneChange?: (v: boolean) => void;
}) {
  return (
    <div
      className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-white/70">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
        {onDoneChange && (
          <button
            type="button"
            onClick={() => onDoneChange(!done)}
            className="rounded-full px-2.5 py-1 text-xs font-semibold transition-colors"
            style={{
              background: done ? "var(--color-type-static)" : "rgba(255,255,255,0.06)",
              color: done ? "#000" : "rgba(255,255,255,0.5)",
            }}
          >
            {done ? `✓ ${doneLabel}` : `Mark ${doneLabel?.toLowerCase()}`}
          </button>
        )}
      </div>

      <div className="flex gap-2.5 mb-2.5">
        <label className="block flex-1">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-base outline-none focus:border-[var(--color-post)] transition-colors"
            style={{ colorScheme: "dark" }}
          />
        </label>

        {onTimeChange && (
          <label className="block w-28 shrink-0">
            <span className="block text-sm font-medium text-white/70 mb-1.5">
              Time
            </span>
            <input
              type="time"
              value={time ?? ""}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-2.5 py-3 text-base outline-none focus:border-[var(--color-post)] transition-colors"
              style={{ colorScheme: "dark" }}
            />
          </label>
        )}
      </div>

      <label className="block">
        <span className="text-xs text-white/40 mb-1 block">
          {notesLabel} <span className="text-white/25">· Optional</span>
        </span>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={`Anything to remember for the ${label.toLowerCase()}...`}
          rows={2}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-post)] transition-colors resize-none"
        />
      </label>
    </div>
  );
}
