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
// paid=false is a future planned purchase: it doesn't reduce the running
// balance yet, only shows as a projected deduction, until marked paid.
export type BpfPurchase = {
  id: string;
  month: string;
  name: string;
  amount: number;
  paid: boolean;
  created_at: string;
};

// A purchase made using money from Savings — same idea as BpfPurchase, but
// netted against the running Savings balance instead of the BPF balance.
export type SavingsPurchase = {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
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

// One named thing you ate, logged against a specific meal on a specific
// day — e.g. "Chicken sandwich" (450 kcal, lunch, 2026-09-10). A meal's
// total on CalorieLog is just these summed, kept in sync automatically.
export type CalorieEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  name: string;
  calories: number;
  sortOrder: number;
  eaten: boolean;
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

/** This discipline's distance converted to km — swimming is logged in meters, running/cycling already in km. Used anywhere disciplines are compared side by side (e.g. the Workout Tracker home dashboard). */
export function toKm(distance: number, discipline: WorkoutDiscipline): number {
  return discipline === "swimming" ? distance / 1000 : distance;
}

/** Total distance (converted to km) logged for this discipline on exactly this date. */
export function sumDistanceOnDate(logs: WorkoutLog[], discipline: WorkoutDiscipline, date: string): number {
  const total = logs
    .filter((l) => l.discipline === discipline && l.date === date)
    .reduce((sum, l) => sum + l.distance, 0);
  return Math.round(toKm(total, discipline) * 10) / 10;
}

/** Total distance (converted to km) logged for this discipline within [weekStart, weekEnd] inclusive. */
export function sumDistanceInRange(
  logs: WorkoutLog[],
  discipline: WorkoutDiscipline,
  weekStart: string,
  weekEnd: string
): number {
  const total = logs
    .filter((l) => l.discipline === discipline && l.date >= weekStart && l.date <= weekEnd)
    .reduce((sum, l) => sum + l.distance, 0);
  return Math.round(toKm(total, discipline) * 10) / 10;
}

// A weekly training target you set for yourself (e.g. every Sunday night or
// Monday morning) — one row per Monday-start week, split across the three
// disciplines, always in km for easy side-by-side comparison.
export type WeeklyTarget = {
  weekStart: string; // Monday, YYYY-MM-DD
  running: number;
  cycling: number;
  swimming: number;
};

export type DisciplineTargetProgress = {
  discipline: WorkoutDiscipline;
  target: number;
  actual: number;
  remaining: number; // max(target - actual, 0)
  over: number; // max(actual - target, 0)
};

export function computeTargetProgress(
  target: WeeklyTarget | null,
  actualByDiscipline: Record<WorkoutDiscipline, number>
): DisciplineTargetProgress[] {
  return WORKOUT_DISCIPLINES.map((discipline) => {
    const targetKm = target?.[discipline] ?? 0;
    const actual = actualByDiscipline[discipline] ?? 0;
    return {
      discipline,
      target: targetKm,
      actual,
      remaining: Math.max(Math.round((targetKm - actual) * 10) / 10, 0),
      over: Math.max(Math.round((actual - targetKm) * 10) / 10, 0),
    };
  });
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
  toAmount: number | null; // transfer only, in the destination account's currency — null means "same as amount"
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
  toAmount: number | null;
  categoryId: string | null;
  note: string;
};

/** Net change to one account's balance from a single transaction. */
export function transactionAccountDelta(tx: Transaction, accountId: string): number {
  if (tx.type === "income" && tx.accountId === accountId) return tx.amount;
  if (tx.type === "expense" && tx.accountId === accountId) return -tx.amount;
  if (tx.type === "transfer") {
    if (tx.accountId === accountId) return -tx.amount;
    // A cross-currency transfer's destination amount was converted using
    // whatever exchange rate was entered at the time; falls back to
    // `amount` for a same-currency transfer or one predating that field.
    if (tx.toAccountId === accountId) return tx.toAmount ?? tx.amount;
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

// ---- Education ----

// AUS's fixed 4.0-point scale — the point value per letter never varies,
// unlike the % cutoff that earns each letter, which is set per course (see
// EduCourseGradeScale). Minimum passing grade for any course is C-; good
// standing requires a 2.00 CGPA.
export const GPA_LETTER_GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "XF"] as const;
export type GpaLetterGrade = (typeof GPA_LETTER_GRADES)[number];

export function isGpaLetterGrade(value: string): value is GpaLetterGrade {
  return (GPA_LETTER_GRADES as readonly string[]).includes(value);
}

export const GPA_POINTS: Record<GpaLetterGrade, number> = {
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  D: 1.0,
  F: 0.0,
  XF: 0.0,
};

// Statuses a course can carry that never factor into GPA at all (as
// opposed to F/XF, which do count, just as 0.0).
export const NON_GPA_STATUSES = ["AUD", "I", "IP", "N", "P", "NP", "TR", "W", "WV"] as const;
export type NonGpaStatus = (typeof NON_GPA_STATUSES)[number];

export const COURSE_GRADE_VALUES = [...GPA_LETTER_GRADES, ...NON_GPA_STATUSES] as const;
export type CourseGradeValue = (typeof COURSE_GRADE_VALUES)[number];

export function isCourseGradeValue(value: string): value is CourseGradeValue {
  return (COURSE_GRADE_VALUES as readonly string[]).includes(value);
}

export type EduSemesterStatus = "current" | "past" | "upcoming";
export const EDU_SEMESTER_STATUSES: EduSemesterStatus[] = ["current", "past", "upcoming"];

export type EduSemester = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: EduSemesterStatus;
};

export type EduCourse = {
  id: string;
  semesterId: string;
  name: string;
  courseCode: string;
  creditHours: number;
  instructor: string;
  room: string;
  currentLetterGrade: CourseGradeValue | null;
  targetGrade: GpaLetterGrade | null;
  sortOrder: number;
  attendanceThresholdPercent: number | null;
};

// One row per (course, letter) that course actually uses, with the
// minimum % needed to earn it — a letter the course doesn't use just has
// no row.
export type EduCourseGradeScale = {
  id: string;
  courseId: string;
  letterGrade: GpaLetterGrade;
  minPercent: number;
};

/** This course's GPA points, or null if it's ungraded or carries a non-GPA status (P/NP/W/TR/...). */
export function coursePoints(grade: CourseGradeValue | null): number | null {
  if (grade === null) return null;
  return isGpaLetterGrade(grade) ? GPA_POINTS[grade] : null;
}

/** Credit-hour-weighted GPA across the given courses — skips any that are ungraded or carry a non-GPA status. */
export function computeGpa(
  courses: { creditHours: number; currentLetterGrade: CourseGradeValue | null }[]
): number | null {
  let totalPoints = 0;
  let totalCredits = 0;
  for (const c of courses) {
    const points = coursePoints(c.currentLetterGrade);
    if (points === null) continue;
    totalPoints += points * c.creditHours;
    totalCredits += c.creditHours;
  }
  return totalCredits > 0 ? totalPoints / totalCredits : null;
}

// ---- Education Phase 2: live grade calculator ----

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type EduCourseMeeting = {
  id: string;
  courseId: string;
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // HH:MM
  endTime: string; // HH:MM
};

export type EduGradeCategory = {
  id: string;
  courseId: string;
  name: string;
  weight: number;
  sortOrder: number;
};

export type EduGradeEntry = {
  id: string;
  categoryId: string;
  name: string;
  score: number;
  maxScore: number;
  sortOrder: number;
};

/** This category's earned % so far, or null if it has no entries yet. */
export function categoryPercent(entries: { score: number; maxScore: number }[]): number | null {
  if (entries.length === 0) return null;
  const totalScore = entries.reduce((sum, e) => sum + e.score, 0);
  const totalMax = entries.reduce((sum, e) => sum + e.maxScore, 0);
  return totalMax > 0 ? (totalScore / totalMax) * 100 : null;
}

export type CourseGradeCalc = {
  /** Weighted % across only the categories that have entries so far, renormalized to their combined weight. Null if nothing is graded yet. */
  liveGrade: number | null;
  /** Weighted % across every category, treating any category with no entries as 0 — i.e. the worst-case grade if nothing else comes in. */
  worstCaseGrade: number | null;
  /** Sum of every category's weight — flagged elsewhere if it doesn't add up to 100. */
  totalWeight: number;
};

/** Live running grade for a course from its categories + entries, per Phase 2. */
export function computeCourseGrade(
  categories: { id: string; weight: number }[],
  entriesByCategory: Map<string, { score: number; maxScore: number }[]>
): CourseGradeCalc {
  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);

  let gradedWeightedSum = 0;
  let gradedWeight = 0;
  let worstCaseWeightedSum = 0;

  for (const cat of categories) {
    const pct = categoryPercent(entriesByCategory.get(cat.id) ?? []);
    if (pct !== null) {
      gradedWeightedSum += pct * cat.weight;
      gradedWeight += cat.weight;
      worstCaseWeightedSum += pct * cat.weight;
    }
  }

  return {
    liveGrade: gradedWeight > 0 ? gradedWeightedSum / gradedWeight : null,
    worstCaseGrade: totalWeight > 0 ? worstCaseWeightedSum / totalWeight : null,
    totalWeight,
  };
}

/**
 * What score (%) is needed on the still-ungraded categories, combined, to
 * reach a target overall %. Null if every category is already graded (no
 * remaining weight to hit a target with) or total weight is 0.
 */
export function scoreNeededForTarget(
  categories: { id: string; weight: number }[],
  entriesByCategory: Map<string, { score: number; maxScore: number }[]>,
  targetPercent: number
): number | null {
  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) return null;

  let gradedWeightedSum = 0;
  let remainingWeight = 0;
  for (const cat of categories) {
    const pct = categoryPercent(entriesByCategory.get(cat.id) ?? []);
    if (pct !== null) {
      gradedWeightedSum += pct * cat.weight;
    } else {
      remainingWeight += cat.weight;
    }
  }

  if (remainingWeight <= 0) return null;
  const neededWeightedSum = targetPercent * totalWeight - gradedWeightedSum;
  return neededWeightedSum / remainingWeight;
}

// ---- Education Phase 3: assignment tracker ----

export const ASSIGNMENT_STATUSES = ["not_started", "in_progress", "done"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

export function isAssignmentStatus(value: string): value is AssignmentStatus {
  return (ASSIGNMENT_STATUSES as readonly string[]).includes(value);
}

export type EduAssignment = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: AssignmentStatus;
};

// ---- Education Phase 4: exams/quizzes + study schedule ----

export const EXAM_TYPES = ["exam", "quiz"] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export function isExamType(value: string): value is ExamType {
  return (EXAM_TYPES as readonly string[]).includes(value);
}

export type EduExam = {
  id: string;
  courseId: string;
  title: string;
  type: ExamType;
  examDate: string;
};

export type EduExamTopic = {
  id: string;
  examId: string;
  label: string;
  done: boolean;
  sortOrder: number;
};

/** Default study milestones for a newly-created exam — editable/removable afterward, never hardcoded into the calculator. */
export const DEFAULT_STUDY_MILESTONES: { label: string; offsetDays: number }[] = [
  { label: "Topic review", offsetDays: 7 },
  { label: "Consolidation", offsetDays: 3 },
  { label: "Final review", offsetDays: 1 },
];

export type EduStudyMilestone = {
  id: string;
  examId: string;
  label: string;
  offsetDays: number;
  done: boolean;
  sortOrder: number;
};

export function studyMilestoneDate(examDate: string, offsetDays: number): string {
  return shiftDateStr(examDate, -offsetDays);
}

function shiftDateStr(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function daysUntil(dateStr: string, todayStr: string): number {
  const [y1, m1, d1] = dateStr.split("-").map(Number);
  const [y2, m2, d2] = todayStr.split("-").map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((a - b) / 86400000);
}

// ---- Education Phase 5: attendance tracker ----

export const ATTENDANCE_STATUSES = ["attended", "missed", "excused"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export function isAttendanceStatus(value: string): value is AttendanceStatus {
  return (ATTENDANCE_STATUSES as readonly string[]).includes(value);
}

export type EduAttendanceRecord = {
  id: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
};

/** % attended out of non-excused records — excused absences don't count against you. Null if there's nothing to compute from. */
export function computeAttendancePercent(records: { status: AttendanceStatus }[]): number | null {
  const countable = records.filter((r) => r.status !== "excused");
  if (countable.length === 0) return null;
  const attended = countable.filter((r) => r.status === "attended").length;
  return (attended / countable.length) * 100;
}

// ---- Education Phase 6: degree requirements checklist ----

export const DEGREE_REQUIREMENT_STATUSES = ["completed", "in_progress", "not_started"] as const;
export type DegreeRequirementStatus = (typeof DEGREE_REQUIREMENT_STATUSES)[number];

export const DEGREE_REQUIREMENT_STATUS_LABELS: Record<DegreeRequirementStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  not_started: "Not started",
};

export function isDegreeRequirementStatus(value: string): value is DegreeRequirementStatus {
  return (DEGREE_REQUIREMENT_STATUSES as readonly string[]).includes(value);
}

export type EduDegreeRequirement = {
  id: string;
  category: string;
  name: string;
  creditHours: number;
  status: DegreeRequirementStatus;
  fulfilledByCourseId: string | null;
  sortOrder: number;
};

export type DegreeProgress = {
  totalCredits: number;
  completedCredits: number;
  remainingCredits: number;
};

export function computeDegreeProgress(requirements: { creditHours: number; status: DegreeRequirementStatus }[]): DegreeProgress {
  const totalCredits = requirements.reduce((sum, r) => sum + r.creditHours, 0);
  const completedCredits = requirements
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.creditHours, 0);
  return { totalCredits, completedCredits, remainingCredits: totalCredits - completedCredits };
}

/** Rough graduation-pace check: remaining credits vs. remaining semesters at a typical full course load. */
export function computeOnTrackStatus(
  remainingCredits: number,
  remainingSemesters: number,
  typicalCreditsPerSemester = 15
): { onTrack: boolean | null; neededPerSemester: number | null } {
  if (remainingCredits <= 0) return { onTrack: true, neededPerSemester: 0 };
  if (remainingSemesters <= 0) return { onTrack: null, neededPerSemester: null };
  const neededPerSemester = remainingCredits / remainingSemesters;
  return { onTrack: neededPerSemester <= typicalCreditsPerSemester, neededPerSemester };
}

// ---- Degree Plan (interactive course roadmap) ----

// Gray = completed, green = ongoing, blue = planned — colors are applied
// in the roadmap component itself so they can also handle the category
// border styling; this just fixes the three valid states.
export const DEGREE_PLAN_STATUSES = ["completed", "ongoing", "planned"] as const;
export type DegreePlanStatus = (typeof DEGREE_PLAN_STATUSES)[number];

export function isDegreePlanStatus(value: string): value is DegreePlanStatus {
  return (DEGREE_PLAN_STATUSES as readonly string[]).includes(value);
}

export type DegreePlanStatusRecord = {
  courseId: string;
  status: DegreePlanStatus;
  plannedTerm: string | null;
};
