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

// A podcast episode — a self-contained idea-to-post pipeline mirroring
// Post's shoot/edit/post stages, but scoped to its own dedicated Podcast
// page instead of the shared vault/schedule used by other content types.
export type PodcastEpisode = {
  id: string;
  name: string;
  idea: string;
  shootDate: string | null; // YYYY-MM-DD
  editDate: string | null; // YYYY-MM-DD
  postDate: string | null; // YYYY-MM-DD
  shotDone: boolean;
  editedDone: boolean;
  posted: boolean;
  createdAt: string;
};

/** An episode with a shoot date set has moved from "idea" to "scheduled". */
export function isPodcastScheduled(episode: PodcastEpisode): boolean {
  return episode.shootDate !== null;
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
  account_id: string;
  paid: boolean;
};

export type MonthlyIncome = {
  month: string;
  income: number;
  account_id: string;
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

// Impromptu / one-off money you receive from anywhere and choose to add
// straight to Savings or the Big Purchase Fund — not tied to a month,
// unlike the recurring Planned Expenses categories that normally feed
// these totals.
export type MoneyInfluxDestination = "savings" | "bpf";

export type MoneyInflux = {
  id: string;
  name: string;
  amount: number;
  destination: MoneyInfluxDestination;
  created_at: string;
};

export function isMoneyInfluxDestination(value: string): value is MoneyInfluxDestination {
  return value === "savings" || value === "bpf";
}

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

export const WATER_GOAL_ML = 3000;

export type CalorieLog = {
  date: string; // YYYY-MM-DD
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
  burned: number;
  water: number; // ml
};

export type CalorieLogComputed = CalorieLog & {
  intake: number;
  net: number;
  isDeficit: boolean;
  hitWaterGoal: boolean;
};

export function computeCalorieLog(log: CalorieLog): CalorieLogComputed {
  const intake = log.breakfast + log.lunch + log.dinner + log.snacks;
  const net = intake - log.burned;
  return { ...log, intake, net, isDeficit: net <= 0, hitWaterGoal: log.water >= WATER_GOAL_ML };
}

export type CalorieAverages = {
  avgIntake: number | null;
  avgBurned: number | null;
  avgWater: number | null;
};

/** Plain per-day averages across every logged day. */
export function computeCalorieAverages(logs: CalorieLog[]): CalorieAverages {
  if (logs.length === 0) return { avgIntake: null, avgBurned: null, avgWater: null };

  const totalIntake = logs.reduce(
    (sum, l) => sum + l.breakfast + l.lunch + l.dinner + l.snacks,
    0
  );
  const totalBurned = logs.reduce((sum, l) => sum + l.burned, 0);
  const totalWater = logs.reduce((sum, l) => sum + l.water, 0);

  return {
    avgIntake: Math.round(totalIntake / logs.length),
    avgBurned: Math.round(totalBurned / logs.length),
    avgWater: Math.round(totalWater / logs.length),
  };
}

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export function isMealType(value: string): value is MealType {
  return (MEAL_TYPES as readonly string[]).includes(value);
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

// A saved food/meal you can quick-add to a day's log instead of retyping
// its calories every time — e.g. "Apple" (95 kcal, snack) or "Turkey and
// Eggs Breakfast" (3 turkey slices + 3 eggs, 306 kcal, breakfast). A snack
// item shows up in every meal's quick-add dropdown, not just Snacks.
export type FoodItem = {
  id: string;
  name: string;
  ingredients: string;
  calories: number;
  mealType: MealType;
  created_at: string;
};

export type WeightLog = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  weight: number;
  createdAt: string;
};

export const WORKOUT_DISCIPLINES = ["running", "cycling", "swimming"] as const;

export type WorkoutDiscipline = (typeof WORKOUT_DISCIPLINES)[number];

export const WORKOUT_DISCIPLINE_LABELS: Record<WorkoutDiscipline, string> = {
  running: "Running",
  cycling: "Cycling",
  swimming: "Swimming",
};

export function isWorkoutDiscipline(value: string): value is WorkoutDiscipline {
  return (WORKOUT_DISCIPLINES as readonly string[]).includes(value);
}

// Running/cycling are logged and paced in km. Swimming is logged in meters
// and paced per 100m, matching how swimmers actually talk about pace.
export const WORKOUT_DISCIPLINE_UNITS: Record<
  WorkoutDiscipline,
  { distanceUnit: string; distanceLabel: string; paceUnit: string; paceSegment: number }
> = {
  running: { distanceUnit: "km", distanceLabel: "Distance (km)", paceUnit: "/km", paceSegment: 1 },
  cycling: { distanceUnit: "km", distanceLabel: "Distance (km)", paceUnit: "/km", paceSegment: 1 },
  swimming: { distanceUnit: "m", distanceLabel: "Distance (m)", paceUnit: "/100m", paceSegment: 100 },
};

export type WorkoutLog = {
  id: string;
  discipline: WorkoutDiscipline;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  distance: number; // in the discipline's distanceUnit
  durationMin: number;
  createdAt: string;
};

/** Pace in minutes per pace-segment (per km, or per 100m for swimming). */
export function computeWorkoutPace(log: WorkoutLog): number {
  const { paceSegment } = WORKOUT_DISCIPLINE_UNITS[log.discipline];
  return log.durationMin / (log.distance / paceSegment);
}

export function formatDistance(
  distance: number | null,
  discipline: WorkoutDiscipline
): string {
  if (distance === null) return "—";
  return `${distance} ${WORKOUT_DISCIPLINE_UNITS[discipline].distanceUnit}`;
}

/** Formats a pace as "M:SS /km" or "M:SS /100m" depending on discipline. */
export function formatPace(
  pace: number | null,
  discipline: WorkoutDiscipline
): string {
  if (pace === null || !Number.isFinite(pace)) return "—";
  const whole = Math.floor(pace);
  const seconds = Math.round((pace - whole) * 60);
  const adjWhole = seconds === 60 ? whole + 1 : whole;
  const adjSeconds = seconds === 60 ? 0 : seconds;
  const unit = WORKOUT_DISCIPLINE_UNITS[discipline].paceUnit;
  return `${adjWhole}:${String(adjSeconds).padStart(2, "0")} ${unit}`;
}

export type WorkoutStats = {
  personalBestDistance: number | null;
  personalBestPace: number | null;
  averageDistance: number | null;
  averagePace: number | null;
};

/**
 * PB distance = longest single workout. PB pace = fastest (lowest) pace.
 * Average distance is a plain mean. Average pace is total duration / total
 * distance (segment-weighted, not a naive average of per-entry paces).
 */
export function computeWorkoutStats(logs: WorkoutLog[]): WorkoutStats {
  if (logs.length === 0) {
    return {
      personalBestDistance: null,
      personalBestPace: null,
      averageDistance: null,
      averagePace: null,
    };
  }

  const paces = logs.map(computeWorkoutPace);
  const personalBestPace = Math.min(...paces);
  const personalBestDistance = Math.max(...logs.map((l) => l.distance));

  const totalDistance = logs.reduce((sum, l) => sum + l.distance, 0);
  const averageDistance = Math.round((totalDistance / logs.length) * 10) / 10;

  const { paceSegment } = WORKOUT_DISCIPLINE_UNITS[logs[0].discipline];
  const totalSegments = logs.reduce((sum, l) => sum + l.distance / paceSegment, 0);
  const totalDuration = logs.reduce((sum, l) => sum + l.durationMin, 0);
  const averagePace = totalSegments > 0 ? totalDuration / totalSegments : null;

  return { personalBestDistance, personalBestPace, averageDistance, averagePace };
}

// ---- Padel Tracker ----

// Lifetime totals from before the Padel Tracker page existed — see the
// padel_baseline table comment in schema.sql. Added on top of the real,
// dated "Working out > Padel" Day-to-Day transactions logged from here on.
export type PadelBaseline = {
  spent: number;
  income: number;
  tournaments: number;
  wins: number;
  runnersUp: number;
  knockouts: number;
};

// Games played in a given calendar year, from before individual games
// were logged as dated Day-to-Day transactions — see the
// padel_yearly_games table comment in schema.sql.
export type PadelYearlyGames = {
  year: number;
  games: number;
};

// A cash prize won from a padel tournament, logged on the Padel Tracker
// page itself rather than as a Day-to-Day transaction.
export type PadelWinning = {
  id: string;
  name: string;
  amount: number;
  created_at: string;
};

// Self-contained (no lib/date.ts dependency) Monday-start week key, so this
// stays consistent with the rest of the app's Monday-start weeks without
// pulling in date-fns here.
function mondayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftWeekKey(mondayKey: string, deltaWeeks: number): string {
  const [y, m, d] = mondayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d + deltaWeeks * 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1 + deltaMonths, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export type VolumePeriod = {
  current: number;
  previous: number;
  best: number;
};

export type WorkoutVolume = {
  week: VolumePeriod;
  month: VolumePeriod;
};

/**
 * Weekly (Monday-start) and monthly volume: total distance logged, compared
 * to the previous period and to the best period ever recorded.
 */
export function computeWorkoutVolume(logs: WorkoutLog[], todayDate: string): WorkoutVolume {
  const weekTotals = new Map<string, number>();
  const monthTotals = new Map<string, number>();

  for (const log of logs) {
    const wk = mondayOfWeek(log.date);
    weekTotals.set(wk, (weekTotals.get(wk) ?? 0) + log.distance);

    const mk = log.date.slice(0, 7);
    monthTotals.set(mk, (monthTotals.get(mk) ?? 0) + log.distance);
  }

  const round = (n: number) => Math.round(n * 10) / 10;

  const thisWeekKey = mondayOfWeek(todayDate);
  const prevWeekKey = shiftWeekKey(thisWeekKey, -1);
  const weekValues = [...weekTotals.values()];

  const thisMonthKey = todayDate.slice(0, 7);
  const prevMonthKey = shiftMonthKey(thisMonthKey, -1);
  const monthValues = [...monthTotals.values()];

  return {
    week: {
      current: round(weekTotals.get(thisWeekKey) ?? 0),
      previous: round(weekTotals.get(prevWeekKey) ?? 0),
      best: round(weekValues.length > 0 ? Math.max(...weekValues) : 0),
    },
    month: {
      current: round(monthTotals.get(thisMonthKey) ?? 0),
      previous: round(monthTotals.get(prevMonthKey) ?? 0),
      best: round(monthValues.length > 0 ? Math.max(...monthValues) : 0),
    },
  };
}

// ---- Day-to-day expenses (separate from the "Planned Expenses" tab) ----

export const CURRENCIES = ["AED", "GBP", "INR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<Currency, string> = {
  AED: "AED (Dirham)",
  GBP: "GBP (Pound)",
  INR: "INR (Rupee)",
  USD: "USD (Dollar)",
};

export type Account = {
  id: string;
  name: string;
  currency: Currency;
  sortOrder: number;
};

export type DdCategoryKind = "expense" | "income";

export function isDdCategoryKind(value: string): value is DdCategoryKind {
  return value === "expense" || value === "income";
}

export type DdCategory = {
  id: string;
  parentId: string | null;
  kind: DdCategoryKind;
  name: string;
  sortOrder: number;
};

export type DdCategoryNode = DdCategory & { children: DdCategoryNode[] };

export function buildCategoryTree(categories: DdCategory[]): DdCategoryNode[] {
  const byId = new Map<string, DdCategoryNode>();
  for (const c of categories) byId.set(c.id, { ...c, children: [] });

  const roots: DdCategoryNode[] = [];
  for (const c of categories) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** Path of ids from the top-level node down to `targetId` (inclusive), or [] if not found. */
export function findCategoryTreePath(nodes: DdCategoryNode[], targetId: string): string[] {
  for (const node of nodes) {
    if (node.id === targetId) return [node.id];
    const childPath = findCategoryTreePath(node.children, targetId);
    if (childPath.length > 0) return [node.id, ...childPath];
  }
  return [];
}

/** Full "Parent › Child › Grandchild" label for a category, or "—". */
export function categoryPath(
  categoryId: string | null,
  categoriesById: Map<string, DdCategory>
): string {
  if (!categoryId) return "—";
  const parts: string[] = [];
  let current: DdCategory | undefined = categoriesById.get(categoryId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? categoriesById.get(current.parentId) : undefined;
  }
  return parts.length > 0 ? parts.join(" › ") : "—";
}

/** Walks up to the top-level ancestor — used to group the pie chart. */
export function topLevelCategoryId(
  categoryId: string,
  categoriesById: Map<string, DdCategory>
): string | null {
  let current = categoriesById.get(categoryId);
  if (!current) return null;
  while (current.parentId && categoriesById.has(current.parentId)) {
    current = categoriesById.get(current.parentId)!;
  }
  return current.id;
}

export type TransactionType = "income" | "expense" | "transfer";

export function isTransactionType(value: string): value is TransactionType {
  return value === "income" || value === "expense" || value === "transfer";
}

export type Transaction = {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  amount: number;
  accountId: string;
  toAccountId: string | null; // only set for transfers
  categoryId: string | null; // only set for income/expense
  note: string;
  createdAt: string;
};

export type TransactionInput = {
  type: TransactionType;
  date: string;
  amount: number;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  note: string;
};

/** Net change to one account's balance from a single transaction. */
export function transactionAccountDelta(tx: Transaction, accountId: string): number {
  if (tx.type === "income" && tx.accountId === accountId) return tx.amount;
  if (tx.type === "expense" && tx.accountId === accountId) return -tx.amount;
  if (tx.type === "transfer") {
    if (tx.accountId === accountId) return -tx.amount;
    if (tx.toAccountId === accountId) return tx.amount;
  }
  return 0;
}

export function computeAccountBalance(transactions: Transaction[], accountId: string): number {
  return transactions.reduce((sum, tx) => sum + transactionAccountDelta(tx, accountId), 0);
}

// ---- People Owe Me (receivables) ----

export type Person = {
  id: string;
  name: string;
};

export type ReceivableStatus = "outstanding" | "paid_back";

export type Receivable = {
  id: string;
  transactionId: string;
  personId: string | null;
  amount: number;
  status: ReceivableStatus;
  paidTransactionId: string | null;
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
