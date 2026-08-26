import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { CaloriesTabs } from "@/components/CaloriesTabs";
import { getCalorieLog } from "@/lib/calories";
import { computeCalorieLog } from "@/lib/types";
import { formatDayHeading, formatMonthYear, shiftDate, todayStr } from "@/lib/date";
import CalorieLogForm from "./CalorieLogForm";

export const dynamic = "force-dynamic";

export default async function CaloriesPage(props: PageProps<"/calories">) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams.date;
  const date = typeof dateParam === "string" ? dateParam : todayStr();
  const isToday = date === todayStr();

  const log = await getCalorieLog(date);
  const computed = log ? computeCalorieLog(log) : null;

  return (
    <div className="pb-10">
      <PageHeader title="Calorie Tracker" />
      <div className="flex justify-center mb-2">
        <CaloriesTabs active="day" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col items-center gap-2">
          <p className="text-sm text-white/40">{formatMonthYear(date)}</p>
          <h2 className="font-display text-5xl leading-none tracking-wide">
            {formatDayHeading(date)}
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Link
              href={`/calories?date=${shiftDate(date, -1)}`}
              aria-label="Previous day"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
            >
              ‹
            </Link>
            {!isToday && (
              <Link
                href="/calories"
                className="rounded-full bg-white/5 border border-white/10 px-3 h-9 flex items-center text-xs font-medium text-white/70"
              >
                Today
              </Link>
            )}
            <Link
              href={`/calories?date=${shiftDate(date, 1)}`}
              aria-label="Next day"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
            >
              ›
            </Link>
          </div>
        </div>

        {computed && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Stat label="Intake" value={`${computed.intake} kcal`} />
            <Stat label="Burned" value={`${computed.burned} kcal`} />
            <Stat
              label={computed.isDeficit ? "Deficit" : "Surplus"}
              value={`${computed.net > 0 ? "+" : ""}${computed.net} kcal`}
              color={computed.isDeficit ? "var(--color-positive)" : "var(--color-negative)"}
            />
          </div>
        )}

        <CalorieLogForm key={date} date={date} log={log} />
      </main>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
      <p className="text-xs text-[var(--color-fg-dim)] mb-1">{label}</p>
      <p className="font-display text-xl" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}
