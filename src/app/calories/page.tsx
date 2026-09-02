import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FitnessSectionTabs } from "@/components/FitnessSectionTabs";
import { CaloriesTabs } from "@/components/CaloriesTabs";
import { getAllCalorieLogs, getCalorieLog } from "@/lib/calories";
import { getFoodItems } from "@/lib/foodItems";
import { computeCalorieAverages, computeCalorieLog, WATER_GOAL_ML } from "@/lib/types";
import { formatDayHeading, formatMonthYear, shiftDate, todayStr } from "@/lib/date";
import CalorieLogForm from "./CalorieLogForm";

export const dynamic = "force-dynamic";

export default async function CaloriesPage(props: PageProps<"/calories">) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams.date;
  const date = typeof dateParam === "string" ? dateParam : todayStr();
  const isToday = date === todayStr();

  const [log, allLogs, foodItems] = await Promise.all([
    getCalorieLog(date),
    getAllCalorieLogs(),
    getFoodItems(),
  ]);
  const computed = log ? computeCalorieLog(log) : null;
  const { avgIntake, avgBurned, avgWater } = computeCalorieAverages(allLogs);

  return (
    <div className="pb-10">
      <PageHeader title="Calorie Tracker" />
      <div className="flex justify-center mb-2">
        <FitnessSectionTabs active="calories" />
      </div>
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
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Stat label="Intake" value={`${computed.intake} kcal`} />
            <Stat label="Burned" value={`${computed.burned} kcal`} />
            <Stat
              label={computed.isDeficit ? "Deficit" : "Surplus"}
              value={`${computed.net > 0 ? "+" : ""}${computed.net} kcal`}
              color={computed.isDeficit ? "var(--color-positive)" : "var(--color-negative)"}
            />
          </div>
        )}

        {computed && (
          <div className="mb-6">
            <Stat
              label="Water"
              value={`${computed.water} / ${WATER_GOAL_ML} ml`}
              color={computed.hitWaterGoal ? "var(--color-positive)" : "var(--color-negative)"}
            />
          </div>
        )}

        <CalorieLogForm key={date} date={date} log={log} foodItems={foodItems} />

        <section className="mt-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-fitness)" }}>
            All-time averages
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Avg Intake/day"
              value={avgIntake !== null ? `${avgIntake} kcal` : "—"}
            />
            <Stat
              label="Avg Burned/day"
              value={avgBurned !== null ? `${avgBurned} kcal` : "—"}
            />
            <Stat
              label="Avg Water/day"
              value={avgWater !== null ? `${avgWater} ml` : "—"}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  const labelColor = color ?? "var(--color-fitness)";
  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
      <p className="text-xs mb-1" style={{ color: labelColor }}>
        {label}
      </p>
      <p className="font-display text-xl" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}
