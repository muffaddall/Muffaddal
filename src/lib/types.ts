export const POST_TYPES = [
  "Reel",
  "Carousel",
  "Static Post",
  "Story",
  "Other",
] as const;

export type PostType = (typeof POST_TYPES)[number];

export type Post = {
  id: string;
  name: string;
  shootDate: string; // YYYY-MM-DD
  editDate: string; // YYYY-MM-DD
  postDate: string; // YYYY-MM-DD
  type: PostType;
  idea: string;
  inspiration: string;
  createdAt: string;
};

export type PostInput = {
  name: string;
  shootDate: string;
  editDate: string;
  postDate: string;
  type: PostType;
  idea: string;
  inspiration: string;
};
