import Link from "next/link";
import { getPostsForRange } from "@/lib/posts";
import { isInMonth, monthGridDays, shiftMonth } from "@/lib/date";
import { TopBar } from "@/components/TopBar";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function ScheduleMonthPage(
  props: PageProps<"/schedule/month">
) {
  const searchParams = await props.searchParams;
  const now = new Date();
  const year = Number(searchParams.y) || now.getFullYear();
  const month = Number(searchParams.m) || now.getMonth() + 1;

  const days = monthGridDays(year, month);
  const posts = await getPostsForRange(days[0], days[days.length - 1]);

  const dotsByDate = new Map<
    string,
    { shoot: boolean; edit: boolean; post: boolean }
  >();
  for (const day of days) dotsByDate.set(day, { shoot: false, edit: false, post: false });
  for (const p of posts) {
    if (dotsByDate.has(p.shootDate)) dotsByDate.get(p.shootDate)!.shoot = true;
    if (dotsByDate.has(p.editDate)) dotsByDate.get(p.editDate)!.edit = true;
    if (dotsByDate.has(p.postDate)) dotsByDate.get(p.postDate)!.post = true;
  }

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="pb-10">
      <TopBar active="month" />

      <div className="px-4 mt-2 mb-4 flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-wide">
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

      <div className="px-3">
        <div className="grid grid-cols-7 mb-1.5">
          {WEEKDAY_LABELS.map((w, i) => (
            <div
              key={i}
              className="text-center text-[11px] font-medium text-white/35 py-1"
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dots = dotsByDate.get(day)!;
            const inMonth = isInMonth(day, year, month);
            const isToday = day === todayStr;
            const dayNum = Number(day.slice(-2));

            return (
              <Link
                key={day}
                href={`/schedule/day?date=${day}`}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-colors ${
                  isToday
                    ? "border-[var(--color-post)]/70 bg-[var(--color-post)]/10"
                    : "border-white/5 bg-white/[0.02]"
                } ${inMonth ? "" : "opacity-30"}`}
              >
                <span className="text-sm font-medium">{dayNum}</span>
                <span className="flex items-center gap-0.5 h-1.5">
                  {dots.shoot && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--color-shoot)" }}
                    />
                  )}
                  {dots.edit && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--color-edit)" }}
                    />
                  )}
                  {dots.post && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--color-post)" }}
                    />
                  )}
                </span>
              </Link>
            );
          })}
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
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-post)" }} />
          Post
        </span>
      </div>
    </div>
  );
}
