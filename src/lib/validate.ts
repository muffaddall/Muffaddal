import { POST_TYPES, type PostInput } from "@/lib/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function parseNullableDate(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value);
  if (!DATE_RE.test(str)) throw new Error(`${label} must be a valid date`);
  return str;
}

function parseNullableTime(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value);
  if (!TIME_RE.test(str)) throw new Error(`${label} must be a valid time`);
  return str;
}

export function parsePostInput(body: unknown): PostInput {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid request body");
  }
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) throw new Error("Name is required");

  const shootDate = parseNullableDate(b.shootDate, "shootDate");
  const editDate = parseNullableDate(b.editDate, "editDate");
  const postDate = parseNullableDate(b.postDate, "postDate");
  const anySet = shootDate !== null || editDate !== null || postDate !== null;
  const allSet = shootDate !== null && editDate !== null && postDate !== null;
  if (anySet && !allSet) {
    throw new Error("Shoot, edit, and posting dates must all be set to schedule this idea");
  }
  const postTime = postDate === null ? null : parseNullableTime(b.postTime, "postTime");

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
  const groupId = typeof b.groupId === "string" && b.groupId ? b.groupId : null;

  return {
    name,
    shootDate,
    editDate,
    postDate,
    postTime,
    type: type as PostInput["type"],
    idea,
    inspiration,
    shootNotes,
    editNotes,
    postNotes,
    groupId,
  };
}
