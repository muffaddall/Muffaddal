import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FitnessSectionTabs } from "@/components/FitnessSectionTabs";
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
    <div className="pb-6">
      <PageHeader title="Calorie Tracker" />
      <div className="flex justify-center mb-2">
        <FitnessSectionTabs active="calories" />
      </div>
      <div className="flex justify-center mb-3">
        <CaloriesTabs active="month" />
      </div>

      <div className="mx-auto max-w-xs px-4">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Link
            href={`/calories/month?y=${prev.year}&m=${prev.month}`}
            aria-label="Previous month"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 border border-white/10 text-xs"
          >
            ‹
          </Link>
          <h2 className="font-display text-lg tracking-wide leading-none text-center min-w-[9rem]">
            {MONTH_NAMES[month - 1]} <span className="text-white/40">{year}</span>
          </h2>
          <Link
            href={`/calories/month?y=${next.year}&m=${next.month}`}
            aria-label="Next month"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 border border-white/10 text-xs"
          >
            ›
          </Link>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="text-center text-[9px] font-medium text-white/35">
              {w[0]}
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
                className={`h-8 rounded-md flex items-center justify-center border transition-colors ${stateClass} ${
                  inMonth ? "" : "opacity-30"
                }`}
              >
                <span className="text-[11px] font-medium">{dayNum}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 justify-center mt-3 text-[11px] text-white/40">
          <span className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--color-positive)" }}
            />
            Deficit
          </span>
          <span className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--color-negative)" }}
            />
            Surplus
          </span>
        </div>
      </div>
    </div>
  );
}
