import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const DATE_FMT = "yyyy-MM-dd";

export function todayStr(): string {
  return format(new Date(), DATE_FMT);
}

export function parseDateStr(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDate(date: string, days: number): string {
  return format(addDays(parseDateStr(date), days), DATE_FMT);
}

export function formatDayHeading(date: string): string {
  return format(parseDateStr(date), "EEEE d");
}

export function formatMonthYear(date: string): string {
  return format(parseDateStr(date), "MMMM yyyy");
}

export function isSameDateStr(a: string, b: string): boolean {
  return a === b;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = addMonths(new Date(year, month - 1, 1), delta);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function monthGridDays(year: number, month: number): string[] {
  const first = startOfMonth(new Date(year, month - 1, 1));
  const last = endOfMonth(first);
  const gridStart = startOfWeek(first, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(last, { weekStartsOn: 0 });

  const days: string[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(format(cursor, DATE_FMT));
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function isInMonth(date: string, year: number, month: number) {
  const d = parseDateStr(date);
  return d.getFullYear() === year && d.getMonth() === month - 1;
}
