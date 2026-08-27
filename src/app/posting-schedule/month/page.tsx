import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ContentSectionTabs } from "@/components/ContentSectionTabs";
import { PostingScheduleTabs } from "@/components/PostingScheduleTabs";
import { getPostsByPostDateRange } from "@/lib/posts";
import type { ScheduledPost } from "@/lib/types";
import { formatTimeLabel, isInMonth, monthGridDays, shiftMonth } from "@/lib/date";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MAX_VISIBLE_PER_DAY = 3;

export const dynamic = "force-dynamic";

export default async function PostingScheduleMonthPage(
  props: PageProps<"/posting-schedule/month">
) {
  const searchParams = await props.searchParams;
  const now = new Date();
  const year = Number(searchParams.y) || now.getFullYear();
  const month = Number(searchParams.m) || now.getMonth() + 1;

  const days = monthGridDays(year, month);
  const posts = await getPostsByPostDateRange(days[0], days[days.length - 1]);

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

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="pb-10">
      <PageHeader
        title={`${MONTH_NAMES[month - 1]} ${year}`}
        subtitle="Posting Schedule"
        right={<PostingScheduleTabs active="month" />}
      />
      <div className="flex justify-center px-4 mb-1">
        <ContentSectionTabs active="posting" />
      </div>

      <div className="px-4 mt-1 mb-4 flex items-center justify-center gap-1.5">
        <Link
          href={`/posting-schedule/month?y=${prev.year}&m=${prev.month}`}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
        >
          ‹
        </Link>
        <Link
          href={`/posting-schedule/month?y=${next.year}&m=${next.month}`}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
        >
          ›
        </Link>
      </div>

      <div className="px-2 sm:px-4 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_LABELS.map((w) => (
              <div
                key={w}
                className="text-center text-[11px] font-medium text-white/35 py-1"
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayPosts = postsByDate.get(day)!;
              const inMonth = isInMonth(day, year, month);
              const isToday = day === todayStr;
              const dayNum = Number(day.slice(-2));
              const overflow = dayPosts.length - MAX_VISIBLE_PER_DAY;

              return (
                <div
                  key={day}
                  className={`min-h-[6.5rem] rounded-lg border p-1.5 flex flex-col gap-1 ${
                    isToday
                      ? "border-[var(--color-post)]/70 bg-[var(--color-post)]/10"
                      : "border-white/5 bg-white/[0.02]"
                  } ${inMonth ? "" : "opacity-30"}`}
                >
                  <span className="text-xs font-medium">{dayNum}</span>
                  <div className="flex flex-col gap-0.5">
                    {dayPosts.slice(0, MAX_VISIBLE_PER_DAY).map((p) => (
                      <Link
                        key={p.id}
                        href={`/edit/${p.id}?from=/posting-schedule/month`}
                        className="block rounded bg-[var(--color-post)]/15 text-[var(--color-post)] px-1 py-0.5 text-[10px] font-medium leading-tight truncate"
                        title={`${p.postTime ? formatTimeLabel(p.postTime) + " — " : ""}${p.name}`}
                      >
                        {p.name}
                      </Link>
                    ))}
                    {overflow > 0 && (
                      <span className="text-[10px] text-white/35 px-1">
                        +{overflow} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
