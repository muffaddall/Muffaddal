import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { CaloriesTabs } from "@/components/CaloriesTabs";
import { getCalorieLogsForRange } from "@/lib/calories";
import { computeCalorieLog } from "@/lib/types";
import {
  formatWeekdayShort,
  formatWeekRangeLabel,
  parseDateStr,
  shiftWeek,
  todayStr,
  weekDays,
} from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function CaloriesWeekPage(props: PageProps<"/calories/week">) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams.date;
  const anchor = typeof dateParam === "string" ? dateParam : todayStr();

  const days = weekDays(anchor);
  const logs = await getCalorieLogsForRange(days[0], days[days.length - 1]);
  const today = todayStr();

  const logByDate = new Map(logs.map((log) => [log.date, computeCalorieLog(log)]));
  const containsToday = days.includes(today);

  const loggedDays = days
    .map((d) => logByDate.get(d))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);
  const totalIntake = loggedDays.reduce((sum, c) => sum + c.intake, 0);
  const totalBurned = loggedDays.reduce((sum, c) => sum + c.burned, 0);
  const weeklyNet = totalIntake - totalBurned;
  const weekIsDeficit = weeklyNet <= 0;

  return (
    <div className="pb-10">
      <PageHeader title="Calorie Tracker" subtitle={formatWeekRangeLabel(days)} />
      <div className="flex justify-center mb-2">
        <CaloriesTabs active="week" />
      </div>

      <div className="px-4 mt-1 mb-6 flex items-center justify-center gap-1.5">
        <Link
          href={`/calories/week?date=${shiftWeek(anchor, -1)}`}
          aria-label="Previous week"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-xl"
        >
          ‹
        </Link>
        {!containsToday && (
          <Link
            href="/calories/week"
            className="rounded-full bg-white/5 border border-white/10 px-3 h-10 flex items-center text-xs font-medium text-white/70"
          >
            Today
          </Link>
        )}
        <Link
          href={`/calories/week?date=${shiftWeek(anchor, 1)}`}
          aria-label="Next week"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-xl"
        >
          ›
        </Link>
      </div>

      <div className="px-4 overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[980px]">
          {days.map((day) => {
            const computed = logByDate.get(day);
            const isToday = day === today;
            const dayNum = parseDateStr(day).getDate();

            const stateClass = computed
              ? computed.isDeficit
                ? "border-[var(--color-positive)]/60 bg-[var(--color-positive)]/10"
                : "border-[var(--color-negative)]/60 bg-[var(--color-negative)]/10"
              : isToday
                ? "border-[var(--color-post)]/70 bg-[var(--color-post)]/10"
                : "border-white/8 bg-[var(--color-surface)]";

            return (
              <Link
                key={day}
                href={`/calories?date=${day}`}
                className={`rounded-2xl border flex flex-col active:scale-[0.98] transition-transform ${stateClass}`}
              >
                <div className="px-3 pt-3 pb-2 border-b border-white/8 text-center">
                  <p className="text-[11px] font-medium text-white/45 uppercase tracking-wide">
                    {formatWeekdayShort(day)}
                  </p>
                  <p className="font-display text-2xl leading-none">{dayNum}</p>
                </div>

                <div className="flex-1 p-2.5 flex flex-col gap-1">
                  {computed ? (
                    <>
                      <Row label="Intake" value={computed.intake} />
                      <Row label="Burned" value={computed.burned} />
                      <Row label="Net" value={computed.net} signed />
                      <p
                        className="text-center mt-1.5 text-[11px] font-semibold uppercase tracking-wide"
                        style={{
                          color: computed.isDeficit
                            ? "var(--color-positive)"
                            : "var(--color-negative)",
                        }}
                      >
                        {computed.isDeficit ? "Deficit" : "Surplus"}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-white/25 text-center py-3">No log</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div
          className={`rounded-2xl border p-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 ${
            weekIsDeficit
              ? "border-[var(--color-positive)]/60 bg-[var(--color-positive)]/10"
              : "border-[var(--color-negative)]/60 bg-[var(--color-negative)]/10"
          }`}
        >
          <SummaryStat label="Total intake" value={`${totalIntake} kcal`} />
          <SummaryStat label="Total burned" value={`${totalBurned} kcal`} />
          <SummaryStat label="Weekly net" value={`${weeklyNet > 0 ? "+" : ""}${weeklyNet} kcal`} />
          <span
            className="font-display text-2xl tracking-wide leading-none"
            style={{ color: weekIsDeficit ? "var(--color-positive)" : "var(--color-negative)" }}
          >
            Weekly {weekIsDeficit ? "Deficit" : "Surplus"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, signed = false }: { label: string; value: number; signed?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-white/45">{label}</span>
      <span className="font-medium">
        {signed && value > 0 ? "+" : ""}
        {value}
      </span>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] text-white/45 mb-0.5">{label}</p>
      <p className="font-display text-lg leading-none">{value}</p>
    </div>
  );
}
