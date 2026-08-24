import { POST_TYPES, type PostInput } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parsePostInput(body: unknown): PostInput {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid request body");
  }
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) throw new Error("Name is required");

  const shootDate = String(b.shootDate ?? "");
  const editDate = String(b.editDate ?? "");
  const postDate = String(b.postDate ?? "");
  for (const [label, d] of [
    ["shootDate", shootDate],
    ["editDate", editDate],
    ["postDate", postDate],
  ] as const) {
    if (!DATE_RE.test(d)) throw new Error(`${label} must be a valid date`);
  }

  const type = b.type;
  if (typeof type !== "string" || !POST_TYPES.includes(type as never)) {
    throw new Error("Invalid post type");
  }

  const idea = typeof b.idea === "string" ? b.idea.trim() : "";
  const inspiration =
    typeof b.inspiration === "string" ? b.inspiration.trim() : "";
  const shootNotes = typeof b.shootNotes === "string" ? b.shootNotes.trim() : "";
  const editNotes = typeof b.editNotes === "string" ? b.editNotes.trim() : "";
  const postNotes = typeof b.postNotes === "string" ? b.postNotes.trim() : "";

  return {
    name,
    shootDate,
    editDate,
    postDate,
    type: type as PostInput["type"],
    idea,
    inspiration,
    shootNotes,
    editNotes,
    postNotes,
  };
}
