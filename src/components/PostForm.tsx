"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { POST_TYPES, type Post, type PostInput, type PostType } from "@/lib/types";
import { todayStr } from "@/lib/date";

const TYPE_COLORS: Record<PostType, string> = {
  Reel: "var(--color-type-reel)",
  Carousel: "var(--color-type-carousel)",
  "Static Post": "var(--color-type-static)",
  Story: "var(--color-type-story)",
  Other: "var(--color-type-other)",
};

type Props =
  | { mode: "add" }
  | { mode: "edit"; postId: string; initial: Post };

export function PostForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : undefined;

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<PostInput>({
    name: initial?.name ?? "",
    shootDate: initial?.shootDate ?? todayStr(),
    editDate: initial?.editDate ?? todayStr(),
    postDate: initial?.postDate ?? todayStr(),
    type: initial?.type ?? "Reel",
    idea: initial?.idea ?? "",
    inspiration: initial?.inspiration ?? "",
  });

  const set = <K extends keyof PostInput>(key: K, value: PostInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSave = form.name.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    setError("");
    setSaving(true);
    try {
      const url = isEdit ? `/api/posts/${props.postId}` : "/api/posts";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
      const { post } = (await res.json()) as { post: Post };
      router.push(`/?date=${post.postDate}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${props.postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/");
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

        <h1 className="font-display text-2xl tracking-wide flex-1">
          {isEdit ? "Edit post" : "Add post"}
        </h1>

        {isEdit && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete this post"
            className="text-xs font-medium text-[var(--color-shoot)] shrink-0 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>

      <div className="flex-1 px-5 pt-3 pb-28 flex flex-col gap-6 overflow-y-auto">
        <Field label="Name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="What's this post called?"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-lg outline-none focus:border-[var(--color-post)] transition-colors"
          />
        </Field>

        <Field label="Dates">
          <div className="flex flex-col gap-3">
            <DateField
              label="Shoot date"
              color="var(--color-shoot)"
              value={form.shootDate}
              onChange={(v) => set("shootDate", v)}
            />
            <DateField
              label="Edit date"
              color="var(--color-edit)"
              value={form.editDate}
              onChange={(v) => set("editDate", v)}
            />
            <DateField
              label="Posting date"
              color="var(--color-post)"
              value={form.postDate}
              onChange={(v) => set("postDate", v)}
            />
          </div>
        </Field>

        <Field label="Format">
          <div className="grid grid-cols-2 gap-2.5">
            {POST_TYPES.map((t) => {
              const selected = form.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
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

        <Field label="The idea">
          <textarea
            value={form.idea}
            onChange={(e) => set("idea", e.target.value)}
            placeholder="Describe the concept, hook, or angle..."
            rows={4}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-base outline-none focus:border-[var(--color-post)] transition-colors resize-none"
          />
        </Field>

        <Field label="Inspiration" hint="Optional">
          <textarea
            value={form.inspiration}
            onChange={(e) => set("inspiration", e.target.value)}
            placeholder="A link, an account, a note on where this came from..."
            rows={3}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-base outline-none focus:border-[var(--color-post)] transition-colors resize-none"
          />
        </Field>

        {error && <p className="text-sm text-[var(--color-shoot)]">{error}</p>}
      </div>

      <div className="fixed bottom-0 inset-x-0 px-5 pb-6 pt-4 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)] to-transparent">
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full rounded-xl bg-[var(--color-post)] text-black font-semibold py-3.5 text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add post"}
        </button>
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

function DateField({
  label,
  color,
  value,
  onChange,
}: {
  label: string;
  color: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-base outline-none focus:border-[var(--color-post)] transition-colors"
        style={{ colorScheme: "dark" }}
      />
    </label>
  );
}
