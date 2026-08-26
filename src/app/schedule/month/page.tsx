import Link from "next/link";
import { getPostsForRange } from "@/lib/posts";
import type { ScheduledPost } from "@/lib/types";
import { isInMonth, monthGridDays, shiftMonth } from "@/lib/date";
import { TopBar } from "@/components/TopBar";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Role = "shoot" | "edit";

const ROLE_META: Record<Role, { label: string; color: string }> = {
  shoot: { label: "Shoot", color: "var(--color-shoot)" },
  edit: { label: "Edit", color: "var(--color-edit)" },
};

const MAX_VISIBLE_PER_DAY = 3;

export default async function ScheduleMonthPage(
  props: PageProps<"/schedule/month">
) {
  const searchParams = await props.searchParams;
  const now = new Date();
  const year = Number(searchParams.y) || now.getFullYear();
  const month = Number(searchParams.m) || now.getMonth() + 1;

  const days = monthGridDays(year, month);
  const posts = await getPostsForRange(days[0], days[days.length - 1]);

  const entriesByDate = new Map<string, { role: Role; post: ScheduledPost }[]>();
  for (const day of days) entriesByDate.set(day, []);
  for (const p of posts) {
    entriesByDate.get(p.shootDate)?.push({ role: "shoot", post: p });
    entriesByDate.get(p.editDate)?.push({ role: "edit", post: p });
  }

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="pb-10">
      <TopBar active="month" />

      <div className="px-4 mt-2 mb-4 flex flex-col items-center gap-2">
        <h1 className="font-display text-6xl tracking-wide text-center">
          {MONTH_NAMES[month - 1]} <span className="text-white/40">{year}</span>
        </h1>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/schedule/month?y=${prev.year}&m=${prev.month}`}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
          >
            ‹
          </Link>
          <Link
            href={`/schedule/month?y=${next.year}&m=${next.month}`}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
          >
            ›
          </Link>
        </div>
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
              const dayEntries = entriesByDate.get(day)!;
              const inMonth = isInMonth(day, year, month);
              const isToday = day === todayStr;
              const dayNum = Number(day.slice(-2));
              const overflow = dayEntries.length - MAX_VISIBLE_PER_DAY;

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
                    {dayEntries.slice(0, MAX_VISIBLE_PER_DAY).map(({ role, post }, i) => {
                      const meta = ROLE_META[role];
                      return (
                        <Link
                          key={`${post.id}-${role}-${i}`}
                          href={`/edit/${post.id}?from=/schedule/month`}
                          className="block rounded px-1 py-0.5 text-[10px] font-medium leading-tight truncate"
                          style={{
                            background: `color-mix(in srgb, ${meta.color} 18%, transparent)`,
                            color: meta.color,
                          }}
                          title={`${meta.label}: ${post.name}`}
                        >
                          {post.name}
                        </Link>
                      );
                    })}
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

      <div className="flex items-center gap-4 justify-center mt-6 text-xs text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-shoot)" }} />
          Shoot
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-edit)" }} />
          Edit
        </span>
      </div>
    </div>
  );
}
