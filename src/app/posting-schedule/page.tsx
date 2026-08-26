import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { TypeBadge } from "@/components/TypeBadge";
import { PlatformTicks } from "@/components/PlatformTicks";
import { getPostsByPostDateRange } from "@/lib/posts";
import type { ScheduledPost } from "@/lib/types";
import {
  formatTimeLabel,
  formatWeekdayShort,
  formatWeekRangeLabel,
  parseDateStr,
  shiftWeek,
  todayStr,
  weekDays,
} from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function PostingSchedulePage(
  props: PageProps<"/posting-schedule">
) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams.date;
  const anchor = typeof dateParam === "string" ? dateParam : todayStr();

  const days = weekDays(anchor);
  const posts = await getPostsByPostDateRange(days[0], days[days.length - 1]);
  const today = todayStr();

  const postsByDate = new Map<string, ScheduledPost[]>();
  for (const day of days) postsByDate.set(day, []);
  for (const p of posts) {
    postsByDate.get(p.postDate)?.push(p);
  }
  for (const day of days) {
    postsByDate.get(day)!.sort((a, b) => {
      if (a.postTime === null && b.postTime === null) return 0;
      if (a.postTime === null) return 1;
      if (b.postTime === null) return -1;
      return a.postTime.localeCompare(b.postTime);
    });
  }

  const containsToday = days.includes(today);

  return (
    <div className="pb-10">
      <PageHeader title="Posting Schedule" subtitle={formatWeekRangeLabel(days)} />

      <div className="px-4 mt-1 mb-6 flex items-center justify-center gap-1.5">
        <Link
          href={`/posting-schedule?date=${shiftWeek(anchor, -1)}`}
          aria-label="Previous week"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-xl"
        >
          ‹
        </Link>
        {!containsToday && (
          <Link
            href="/posting-schedule"
            className="rounded-full bg-white/5 border border-white/10 px-3 h-10 flex items-center text-xs font-medium text-white/70"
          >
            Today
          </Link>
        )}
        <Link
          href={`/posting-schedule?date=${shiftWeek(anchor, 1)}`}
          aria-label="Next week"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-xl"
        >
          ›
        </Link>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {days.map((day) => {
          const dayPosts = postsByDate.get(day)!;
          const isToday = day === today;
          const dayNum = parseDateStr(day).getDate();

          return (
            <div
              key={day}
              className={`rounded-3xl border p-5 ${
                isToday
                  ? "border-[var(--color-post)]/70 bg-[var(--color-post)]/10"
                  : "border-white/8 bg-[var(--color-surface)]"
              }`}
            >
              <div className="flex items-baseline gap-2.5 mb-3.5">
                <span className="font-display text-3xl leading-none">
                  {dayNum}
                </span>
                <span className="text-sm font-medium text-white/45 uppercase tracking-wide">
                  {formatWeekdayShort(day)}
                </span>
              </div>

              {dayPosts.length === 0 ? (
                <p className="text-sm text-white/30">Nothing posting</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {dayPosts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/edit/${p.id}?from=/posting-schedule`}
                      className="flex flex-col gap-2.5 rounded-2xl bg-white/[0.03] border border-white/8 p-3.5 active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0 rounded-full bg-[var(--color-post)]/15 text-[var(--color-post)] text-sm font-semibold px-3 py-1.5 min-w-[86px] text-center">
                          {p.postTime ? formatTimeLabel(p.postTime) : "No time"}
                        </span>
                        <span className="flex-1 font-semibold text-base truncate">
                          {p.name}
                        </span>
                        <TypeBadge type={p.type} />
                      </div>
                      <div className="flex items-center justify-end">
                        <PlatformTicks post={p} size="md" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
