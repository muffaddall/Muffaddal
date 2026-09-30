const formatters = {
  AED: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "AED",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }),
  GBP: new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }),
  INR: new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }),
};

export function formatMoney(
  value: number | null | undefined,
  currency: keyof typeof formatters = "AED"
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return formatters[currency].format(value);
}

export function formatSignedMoney(
  value: number | null | undefined,
  currency: keyof typeof formatters = "AED"
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatters[currency].format(value)}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function formatMonth(month: string): string {
  const date = new Date(`${month}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatMonthShort(month: string): string {
  const date = new Date(`${month}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export function monthToInputValue(month: string): string {
  return month.slice(0, 7);
}

export function inputValueToMonth(value: string): string {
  return `${value}-01`;
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function addMonths(month: string, delta: number): string {
  const date = new Date(`${month}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/** [first day, last day] of a "yyyy-mm-01" month, both "yyyy-mm-dd". */
export function monthDateRange(month: string): [string, string] {
  const start = new Date(`${month}T00:00:00Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return [fmt(start), fmt(end)];
}

// Date-range presets for the Day-to-Day Stats page — "all_time" has no
// lower bound (fetch everything), every other preset is the trailing N
// whole months ending with the current month.
export const STATS_RANGE_KEYS = ["this_month", "last_2", "last_3", "last_6", "last_12", "all_time"] as const;
export type StatsRangeKey = (typeof STATS_RANGE_KEYS)[number];

export function isStatsRangeKey(value: string): value is StatsRangeKey {
  return (STATS_RANGE_KEYS as readonly string[]).includes(value);
}

export const STATS_RANGE_LABELS: Record<StatsRangeKey, string> = {
  this_month: "This month",
  last_2: "Last 2 months",
  last_3: "Last 3 months",
  last_6: "Last 6 months",
  last_12: "Last 12 months",
  all_time: "All time",
};

const STATS_RANGE_MONTHS: Record<StatsRangeKey, number | null> = {
  this_month: 1,
  last_2: 2,
  last_3: 3,
  last_6: 6,
  last_12: 12,
  all_time: null,
};

/** [start, end] date bounds (inclusive) for a Stats range preset, or null for "all_time" (no lower bound — fetch everything). */
export function statsRangeDates(key: StatsRangeKey): [string, string] | null {
  const months = STATS_RANGE_MONTHS[key];
  if (months === null) return null;
  const end = monthDateRange(currentMonth())[1];
  const start = monthDateRange(addMonths(currentMonth(), -(months - 1)))[0];
  return [start, end];
}

// The 10-day budget periods reset on the 1st, 11th, and 21st of every
// month — this returns that period's start date ("yyyy-mm-01/11/21") for
// a given "yyyy-mm-dd" date, used as a stable, lexically-sortable key.
export function periodKeyForDate(date: string): string {
  const day = Number(date.slice(8, 10));
  const monthPrefix = date.slice(0, 7);
  if (day <= 10) return `${monthPrefix}-01`;
  if (day <= 20) return `${monthPrefix}-11`;
  return `${monthPrefix}-21`;
}
