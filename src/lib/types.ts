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

// ---- Money section (expenses / investments / savings) ----

export const EXPENSE_CATEGORIES = [
  "recurring",
  "stoppable",
  "installment",
  "debt",
  "one_off",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  recurring: "Recurring every month",
  stoppable: "Recurring but can be stopped",
  installment: "Monthly installment",
  debt: "Debt paying back",
  one_off: "One-off",
};

export type ExpenseEntry = {
  id: string;
  month: string; // yyyy-mm-01
  date_label: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  sort_order: number;
};

export type MonthlyIncome = {
  month: string;
  income: number;
};

export type InvestmentMonth = {
  month: string;
  contribution: number;
  portfolio_value_eom: number | null;
};

export type InvestmentMonthComputed = InvestmentMonth & {
  total_invested: number;
  growth_pct: number | null;
  pnl_pct: number | null;
  dollar_pl: number | null;
};

export type Debt = {
  id: string;
  name: string;
  amount: number;
  created_at: string;
};

export type SavingsMonth = {
  month: string;
  debt_paydown: number;
  big_payment: number;
  savings_kept: number;
  money_kept: number;
};

export type SavingsMonthComputed = SavingsMonth & {
  debt_owed_start: number;
  debt_left: number;
  total_savings: number;
  account_total: number;
};

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
