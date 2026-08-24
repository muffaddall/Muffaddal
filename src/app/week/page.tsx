import Link from "next/link";
import { getPostsForRange } from "@/lib/posts";
import {
  formatWeekdayShort,
  formatWeekRangeLabel,
  parseDateStr,
  shiftWeek,
  todayStr,
  weekDays,
} from "@/lib/date";
import { TopBar } from "@/components/TopBar";

export default async function WeekPage(props: PageProps<"/week">) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams.date;
  const anchor = typeof dateParam === "string" ? dateParam : todayStr();

  const days = weekDays(anchor);
  const posts = await getPostsForRange(days[0], days[days.length - 1]);
  const today = todayStr();

  const dotsByDate = new Map<
    string,
    { shoot: boolean; edit: boolean; post: boolean; count: number }
  >();
  for (const day of days) {
    dotsByDate.set(day, { shoot: false, edit: false, post: false, count: 0 });
  }
  for (const p of posts) {
    for (const [field, date] of [
      ["shoot", p.shootDate],
      ["edit", p.editDate],
      ["post", p.postDate],
    ] as const) {
      const entry = dotsByDate.get(date);
      if (entry) {
        entry[field] = true;
      }
    }
  }
  // count distinct posts touching each day
  for (const p of posts) {
    for (const date of new Set([p.shootDate, p.editDate, p.postDate])) {
      const entry = dotsByDate.get(date);
      if (entry) entry.count += 1;
    }
  }

  const containsToday = days.includes(today);

  return (
    <div className="pb-10">
      <TopBar active="week" />

      <div className="px-4 mt-2 mb-4 flex items-end justify-between gap-2">
        <div>
          <p className="text-sm text-white/40 mb-0.5">
            {formatWeekRangeLabel(days)}
          </p>
          <h1 className="font-display text-4xl leading-none tracking-wide">
            This Week
          </h1>
        </div>
        <div className="flex items-center gap-1.5 pb-1">
          <Link
            href={`/week?date=${shiftWeek(anchor, -1)}`}
            aria-label="Previous week"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
          >
            ‹
          </Link>
          {!containsToday && (
            <Link
              href="/week"
              className="rounded-full bg-white/5 border border-white/10 px-3 h-9 flex items-center text-xs font-medium text-white/70"
            >
              Today
            </Link>
          )}
          <Link
            href={`/week?date=${shiftWeek(anchor, 1)}`}
            aria-label="Next week"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-2">
        {days.map((day) => {
          const dots = dotsByDate.get(day)!;
          const isToday = day === today;
          const dayNum = parseDateStr(day).getDate();

          return (
            <Link
              key={day}
              href={`/?date=${day}`}
              className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-colors ${
                isToday
                  ? "border-[var(--color-post)]/70 bg-[var(--color-post)]/10"
                  : "border-white/8 bg-[var(--color-surface)]"
              }`}
            >
              <div className="flex flex-col items-center justify-center w-11 shrink-0">
                <span className="text-[11px] font-medium text-white/40 uppercase">
                  {formatWeekdayShort(day)}
                </span>
                <span className="font-display text-2xl leading-none">
                  {dayNum}
                </span>
              </div>

              <div className="flex-1 flex items-center gap-1.5">
                {dots.shoot && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: "var(--color-shoot)" }}
                  />
                )}
                {dots.edit && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: "var(--color-edit)" }}
                  />
                )}
                {dots.post && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: "var(--color-post)" }}
                  />
                )}
                {dots.count === 0 && (
                  <span className="text-xs text-white/25">Nothing scheduled</span>
                )}
              </div>

              {dots.count > 0 && (
                <span className="text-xs text-white/35 shrink-0">
                  {dots.count} {dots.count === 1 ? "post" : "posts"}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
