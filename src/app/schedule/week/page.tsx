import Link from "next/link";
import { getPostsForRange } from "@/lib/posts";
import type { ScheduledPost } from "@/lib/types";
import {
  formatWeekdayShort,
  formatWeekRangeLabel,
  parseDateStr,
  shiftWeek,
  todayStr,
  weekDays,
} from "@/lib/date";
import { TopBar } from "@/components/TopBar";
import { ContentSectionTabs } from "@/components/ContentSectionTabs";
import { StatusTick } from "@/components/StatusTick";

type Role = "shoot" | "edit";

const ROLE_META: Record<Role, { label: string; color: string }> = {
  shoot: { label: "Shoot", color: "var(--color-shoot)" },
  edit: { label: "Edit", color: "var(--color-edit)" },
};

export default async function ScheduleWeekPage(props: PageProps<"/schedule/week">) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams.date;
  const anchor = typeof dateParam === "string" ? dateParam : todayStr();

  const days = weekDays(anchor);
  const posts = await getPostsForRange(days[0], days[days.length - 1]);
  const today = todayStr();

  const entriesByDate = new Map<string, Record<Role, ScheduledPost[]>>();
  for (const day of days) entriesByDate.set(day, { shoot: [], edit: [] });
  for (const p of posts) {
    entriesByDate.get(p.shootDate)?.shoot.push(p);
    entriesByDate.get(p.editDate)?.edit.push(p);
  }

  const containsToday = days.includes(today);

  return (
    <div className="pb-10">
      <TopBar active="week" />
      <div className="flex justify-center px-4">
        <ContentSectionTabs active="schedule" />
      </div>

      <div className="px-4 mt-2 mb-4 flex flex-col items-center gap-2">
        <div className="text-center">
          <p className="text-sm text-white/40 mb-0.5">
            {formatWeekRangeLabel(days)}
          </p>
          <h1 className="font-display text-6xl leading-none tracking-wide">
            This Week
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
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

      <div className="px-4 overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[980px]">
          {days.map((day) => {
            const entries = entriesByDate.get(day)!;
            const isToday = day === today;
            const dayNum = parseDateStr(day).getDate();
            const isEmpty = entries.shoot.length === 0 && entries.edit.length === 0;

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

                <div className="flex-1 p-2 flex flex-col gap-2.5">
                  {isEmpty ? (
                    <p className="text-xs text-white/25 text-center py-3">—</p>
                  ) : (
                    (["shoot", "edit"] as Role[]).map((role) => {
                      const rolePosts = entries[role];
                      if (rolePosts.length === 0) return null;
                      const meta = ROLE_META[role];
                      return (
                        <div key={role} className="flex flex-col gap-1.5">
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          {rolePosts.map((post) => (
                            <Link
                              key={`${post.id}-${role}`}
                              href={`/edit/${post.id}?from=/schedule/week`}
                              className="flex flex-col gap-1 rounded-xl bg-white/[0.03] border border-white/8 p-2 active:scale-[0.98] transition-transform"
                            >
                              <span className="text-xs font-medium leading-snug line-clamp-2">
                                {post.name}
                              </span>
                              <div className="flex items-center justify-end">
                                {role === "shoot" && (
                                  <StatusTick
                                    label="S"
                                    done={post.shotDone}
                                    title={`Shot: ${post.shotDone ? "done" : "not done"}`}
                                  />
                                )}
                                {role === "edit" && (
                                  <StatusTick
                                    label="E"
                                    done={post.editedDone}
                                    title={`Edited: ${post.editedDone ? "done" : "not done"}`}
                                  />
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      );
                    })
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
