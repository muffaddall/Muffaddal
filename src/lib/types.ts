export const POST_TYPES = [
  "Reel",
  "Carousel",
  "Static Post",
  "Story",
  "Other",
] as const;

export type PostType = (typeof POST_TYPES)[number];

export const PLATFORMS = [
  { key: "postedTiktok", label: "TikTok", initial: "T" },
  { key: "postedYoutube", label: "YouTube", initial: "Y" },
  { key: "postedInstagram", label: "Instagram", initial: "I" },
] as const;

export type PlatformKey = (typeof PLATFORMS)[number]["key"];

export type Group = {
  id: string;
  name: string;
  createdAt: string;
};

export type Post = {
  id: string;
  name: string;
  shootDate: string | null; // YYYY-MM-DD
  editDate: string | null; // YYYY-MM-DD
  postDate: string | null; // YYYY-MM-DD
  postTime: string | null; // HH:MM
  type: PostType;
  idea: string;
  inspiration: string;
  shootNotes: string;
  editNotes: string;
  postNotes: string;
  groupId: string | null;
  postedTiktok: boolean;
  postedYoutube: boolean;
  postedInstagram: boolean;
  shotDone: boolean;
  editedDone: boolean;
  createdAt: string;
};

/** A post that has been through the Schedule step — all three dates set. */
export type ScheduledPost = Post & {
  shootDate: string;
  editDate: string;
  postDate: string;
};

export function isScheduled(post: Post): post is ScheduledPost {
  return post.postDate !== null;
}

export type PostInput = {
  name: string;
  shootDate: string | null;
  editDate: string | null;
  postDate: string | null;
  postTime: string | null;
  type: PostType;
  idea: string;
  inspiration: string;
  shootNotes: string;
  editNotes: string;
  postNotes: string;
  groupId: string | null;
  postedTiktok: boolean;
  postedYoutube: boolean;
  postedInstagram: boolean;
  shotDone: boolean;
  editedDone: boolean;
};
