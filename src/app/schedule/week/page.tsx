import Link from "next/link";
import { getPostsForRange } from "@/lib/posts";
import type { Post } from "@/lib/types";
import {
  formatWeekdayShort,
  formatWeekRangeLabel,
  parseDateStr,
  shiftWeek,
  todayStr,
  weekDays,
} from "@/lib/date";
import { TopBar } from "@/components/TopBar";

type Role = "shoot" | "edit" | "post";

const ROLE_META: Record<Role, { label: string; color: string }> = {
  shoot: { label: "Shoot", color: "var(--color-shoot)" },
  edit: { label: "Edit", color: "var(--color-edit)" },
  post: { label: "Post", color: "var(--color-post)" },
};

export default async function ScheduleWeekPage(props: PageProps<"/schedule/week">) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams.date;
  const anchor = typeof dateParam === "string" ? dateParam : todayStr();

  const days = weekDays(anchor);
  const posts = await getPostsForRange(days[0], days[days.length - 1]);
  const today = todayStr();

  const entriesByDate = new Map<string, { role: Role; post: Post }[]>();
  for (const day of days) entriesByDate.set(day, []);
  for (const p of posts) {
    const pairs: [Role, string][] = [
      ["shoot", p.shootDate],
      ["edit", p.editDate],
      ["post", p.postDate],
    ];
    for (const [role, date] of pairs) {
      const bucket = entriesByDate.get(date);
      if (bucket) bucket.push({ role, post: p });
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
            href={`/schedule/week?date=${shiftWeek(anchor, -1)}`}
            aria-label="Previous week"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
          >
            ‹
          </Link>
          {!containsToday && (
            <Link
              href="/schedule/week"
              className="rounded-full bg-white/5 border border-white/10 px-3 h-9 flex items-center text-xs font-medium text-white/70"
            >
              Today
            </Link>
          )}
          <Link
            href={`/schedule/week?date=${shiftWeek(anchor, 1)}`}
            aria-label="Next week"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {days.map((day) => {
          const entries = entriesByDate.get(day)!;
          const isToday = day === today;
          const dayNum = parseDateStr(day).getDate();

          return (
            <div
              key={day}
              className={`rounded-2xl border p-3.5 ${
                isToday
                  ? "border-[var(--color-post)]/70 bg-[var(--color-post)]/10"
                  : "border-white/8 bg-[var(--color-surface)]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[11px] font-medium text-white/40 uppercase">
                  {formatWeekdayShort(day)}
                </span>
                <span className="font-display text-xl leading-none">{dayNum}</span>
              </div>

              {entries.length === 0 ? (
                <p className="text-xs text-white/25">Nothing scheduled</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {entries.map(({ role, post }, i) => {
                    const meta = ROLE_META[role];
                    return (
                      <Link
                        key={`${post.id}-${role}-${i}`}
                        href={`/edit/${post.id}?from=/schedule/week`}
                        className="flex items-center gap-2 rounded-lg py-1 -mx-1 px-1 active:bg-white/5 transition-colors"
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ background: meta.color }}
                        />
                        <span
                          className="text-xs font-medium shrink-0"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <span className="text-sm text-white/85 truncate">
                          {post.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
