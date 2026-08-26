export const POST_TYPES = [
  "Reel",
  "Carousel",
  "Static Post",
  "Story",
  "Other",
] as const;

export type PostType = (typeof POST_TYPES)[number];

export const PLATFORMS = [
  { key: "postedTiktok", targetKey: "targetTiktok", label: "TikTok", initial: "T" },
  { key: "postedYoutube", targetKey: "targetYoutube", label: "YouTube", initial: "Y" },
  { key: "postedInstagram", targetKey: "targetInstagram", label: "Instagram", initial: "I" },
] as const;

export type PlatformKey = (typeof PLATFORMS)[number]["key"];
export type TargetPlatformKey = (typeof PLATFORMS)[number]["targetKey"];

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
  targetTiktok: boolean;
  targetYoutube: boolean;
  targetInstagram: boolean;
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

/** Fully posted = every platform this idea targets has been marked posted. */
export function isFullyPosted(post: Post): boolean {
  const targeted = PLATFORMS.filter(({ targetKey }) => post[targetKey]);
  if (targeted.length === 0) return false;
  return targeted.every(({ key }) => post[key]);
}

// ---- Money section (expenses / investments / savings) ----

export const EXPENSE_CATEGORIES = [
  "recurring",
  "stoppable",
  "installment",
  "debt",
  "investment",
  "savings",
  "one_off",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  recurring: "Recurring every month",
  stoppable: "Recurring but can be stopped",
  installment: "Monthly installment",
  debt: "Big Purchase Fund",
  investment: "Investment funding (AED)",
  savings: "Savings contribution",
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

// A purchase made using money from the Big Purchase Fund — logged on the
// Savings tab, and netted against that month's fund contributions.
export type BpfPurchase = {
  id: string;
  month: string;
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

// ---- Fitness section (calorie / weight tracking) ----

export type CalorieLog = {
  date: string; // YYYY-MM-DD
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
  burned: number;
};

export type CalorieLogComputed = CalorieLog & {
  intake: number;
  net: number;
  isDeficit: boolean;
};

export function computeCalorieLog(log: CalorieLog): CalorieLogComputed {
  const intake = log.breakfast + log.lunch + log.dinner + log.snacks;
  const net = intake - log.burned;
  return { ...log, intake, net, isDeficit: net <= 0 };
}

export type WeightLog = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  weight: number;
  createdAt: string;
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
  targetTiktok: boolean;
  targetYoutube: boolean;
  targetInstagram: boolean;
  shotDone: boolean;
  editedDone: boolean;
};
