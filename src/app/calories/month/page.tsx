import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { CaloriesTabs } from "@/components/CaloriesTabs";
import { getCalorieLogsForRange } from "@/lib/calories";
import { computeCalorieLog } from "@/lib/types";
import { isInMonth, monthGridDays, shiftMonth } from "@/lib/date";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const dynamic = "force-dynamic";

export default async function CaloriesMonthPage(props: PageProps<"/calories/month">) {
  const searchParams = await props.searchParams;
  const now = new Date();
  const year = Number(searchParams.y) || now.getFullYear();
  const month = Number(searchParams.m) || now.getMonth() + 1;

  const days = monthGridDays(year, month);
  const logs = await getCalorieLogsForRange(days[0], days[days.length - 1]);

  const logByDate = new Map(logs.map((log) => [log.date, computeCalorieLog(log)]));

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="pb-10">
      <PageHeader title="Calorie Tracker" />
      <div className="flex justify-center mb-2">
        <CaloriesTabs active="month" />
      </div>

      <div className="px-4 mt-2 mb-4 flex flex-col items-center gap-2">
        <h2 className="font-display text-5xl tracking-wide text-center">
          {MONTH_NAMES[month - 1]} <span className="text-white/40">{year}</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/calories/month?y=${prev.year}&m=${prev.month}`}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
          >
            ‹
          </Link>
          <Link
            href={`/calories/month?y=${next.year}&m=${next.month}`}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="px-3">
        <div className="grid grid-cols-7 mb-1.5">
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
            const computed = logByDate.get(day);
            const inMonth = isInMonth(day, year, month);
            const isToday = day === todayStr;
            const dayNum = Number(day.slice(-2));

            const stateClass = computed
              ? computed.isDeficit
                ? "border-[var(--color-positive)]/60 bg-[var(--color-positive)]/20"
                : "border-[var(--color-negative)]/60 bg-[var(--color-negative)]/20"
              : isToday
                ? "border-[var(--color-post)]/70 bg-[var(--color-post)]/10"
                : "border-white/5 bg-white/[0.02]";

            return (
              <Link
                key={day}
                href={`/calories?date=${day}`}
                className={`aspect-square rounded-xl flex items-center justify-center border transition-colors ${stateClass} ${
                  inMonth ? "" : "opacity-30"
                }`}
              >
                <span className="text-sm font-medium">{dayNum}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 justify-center mt-6 text-xs text-white/40">
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--color-positive)" }}
          />
          Deficit
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--color-negative)" }}
          />
          Surplus
        </span>
      </div>
    </div>
  );
}
