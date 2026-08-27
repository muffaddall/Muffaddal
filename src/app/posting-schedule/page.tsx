import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ContentSectionTabs } from "@/components/ContentSectionTabs";
import { TypeBadge } from "@/components/TypeBadge";
import { PlatformTicks } from "@/components/PlatformTicks";
import { PostingScheduleTabs } from "@/components/PostingScheduleTabs";
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
      <div className="flex justify-center px-4 mb-2">
        <ContentSectionTabs active="posting" />
      </div>
      <div className="flex justify-center px-4 mb-2">
        <PostingScheduleTabs active="week" />
      </div>

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

      <div className="px-4 overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[980px]">
          {days.map((day) => {
            const dayPosts = postsByDate.get(day)!;
            const isToday = day === today;
            const dayNum = parseDateStr(day).getDate();

            return (
              <div
                key={day}
                className={`rounded-2xl border flex flex-col ${
                  isToday
                    ? "border-[var(--color-post)]/70 bg-[var(--color-post)]/10"
                    : "border-white/8 bg-[var(--color-surface)]"
                }`}
              >
                <div className="px-3 pt-3 pb-2 border-b border-white/8 text-center">
                  <p className="text-[11px] font-medium text-white/45 uppercase tracking-wide">
                    {formatWeekdayShort(day)}
                  </p>
                  <p className="font-display text-2xl leading-none">{dayNum}</p>
                </div>

                <div className="flex-1 p-2 flex flex-col gap-2">
                  {dayPosts.length === 0 ? (
                    <p className="text-xs text-white/25 text-center py-3">—</p>
                  ) : (
                    dayPosts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/edit/${p.id}?from=/posting-schedule`}
                        className="flex flex-col gap-1.5 rounded-xl bg-white/[0.03] border border-white/8 p-2.5 active:scale-[0.98] transition-transform"
                      >
                        <span className="text-[11px] font-semibold text-[var(--color-post)]">
                          {p.postTime ? formatTimeLabel(p.postTime) : "No time"}
                        </span>
                        <span className="text-xs font-medium leading-snug line-clamp-2">
                          {p.name}
                        </span>
                        <div className="flex items-center justify-between">
                          <TypeBadge type={p.type} />
                          <PlatformTicks post={p} />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
