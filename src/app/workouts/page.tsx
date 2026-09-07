import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FitnessSectionTabs } from "@/components/FitnessSectionTabs";
import { getAllWorkoutLogs, getWeeklyTarget } from "@/lib/workouts";
import {
  WORKOUT_DISCIPLINE_LABELS,
  WORKOUT_DISCIPLINES,
  computeTargetProgress,
  sumDistanceInRange,
  sumDistanceOnDate,
  type WorkoutDiscipline,
} from "@/lib/types";
import { todayStr, weekDays, formatWeekRangeLabel } from "@/lib/date";
import WeeklyTargetForm from "./WeeklyTargetForm";

export const dynamic = "force-dynamic";

const DISCIPLINE_ICON_BG: Record<WorkoutDiscipline, string> = {
  running: "var(--color-fitness)",
  cycling: "var(--color-accent)",
  swimming: "var(--color-post)",
};

const DESCRIPTIONS: Record<string, string> = {
  running: "Log runs and track your pace",
  cycling: "Log rides and track your pace",
  swimming: "Log swims and track your pace",
};

export default async function WorkoutsPage() {
  const today = todayStr();
  const days = weekDays(today);
  const weekStart = days[0];
  const weekEnd = days[days.length - 1];

  const [logs, target] = await Promise.all([getAllWorkoutLogs(), getWeeklyTarget(weekStart)]);

  const todayByDiscipline = Object.fromEntries(
    WORKOUT_DISCIPLINES.map((d) => [d, sumDistanceOnDate(logs, d, today)])
  ) as Record<WorkoutDiscipline, number>;

  const weekByDiscipline = Object.fromEntries(
    WORKOUT_DISCIPLINES.map((d) => [d, sumDistanceInRange(logs, d, weekStart, weekEnd)])
  ) as Record<WorkoutDiscipline, number>;

  const progress = computeTargetProgress(target, weekByDiscipline);
  const weekTotal = Math.round(WORKOUT_DISCIPLINES.reduce((sum, d) => sum + weekByDiscipline[d], 0) * 10) / 10;

  return (
    <div className="pb-10">
      <PageHeader title="Workout Tracker" />
      <div className="flex justify-center mb-4">
        <FitnessSectionTabs active="workouts" />
      </div>
      <main className="mx-auto max-w-2xl px-4 sm:px-6 flex flex-col gap-8">
        <section>
          <h2
            className="font-display text-3xl tracking-wide leading-none mb-3"
            style={{ color: "var(--color-fitness)" }}
          >
            Today
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {WORKOUT_DISCIPLINES.map((d) => (
              <div
                key={d}
                className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-3.5 text-center"
              >
                <p
                  className="text-sm font-bold uppercase tracking-wide mb-1.5"
                  style={{ color: DISCIPLINE_ICON_BG[d] }}
                >
                  {WORKOUT_DISCIPLINE_LABELS[d]}
                </p>
                <p className="font-display text-3xl">{todayByDiscipline[d]}</p>
                <p className="text-xs text-white/50 mt-0.5">km</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2
              className="font-display text-3xl tracking-wide leading-none"
              style={{ color: "var(--color-fitness)" }}
            >
              This Week
            </h2>
            <span className="text-sm font-semibold text-white/60">
              {formatWeekRangeLabel(days)}
            </span>
          </div>
          <div className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 mb-3">
            <p className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-fitness)" }}>
              Total Volume
            </p>
            <p className="font-display text-4xl">{weekTotal} km</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {WORKOUT_DISCIPLINES.map((d) => (
              <div
                key={d}
                className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-3.5 text-center"
              >
                <p
                  className="text-sm font-bold uppercase tracking-wide mb-1.5"
                  style={{ color: DISCIPLINE_ICON_BG[d] }}
                >
                  {WORKOUT_DISCIPLINE_LABELS[d]}
                </p>
                <p className="font-display text-2xl">{weekByDiscipline[d]}</p>
                <p className="text-xs text-white/50 mt-0.5">km</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2
            className="font-display text-3xl tracking-wide leading-none mb-3"
            style={{ color: "var(--color-fitness)" }}
          >
            Weekly Target
          </h2>
          <WeeklyTargetForm weekStart={weekStart} target={target} progress={progress} />
        </section>

        <section>
          <h2
            className="font-display text-3xl tracking-wide leading-none mb-3"
            style={{ color: "var(--color-fitness)" }}
          >
            Logs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WORKOUT_DISCIPLINES.map((discipline) => (
              <Link
                key={discipline}
                href={`/workouts/${discipline}`}
                className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
              >
                <p className="font-bold text-lg mb-1" style={{ color: DISCIPLINE_ICON_BG[discipline] }}>
                  {WORKOUT_DISCIPLINE_LABELS[discipline]}
                </p>
                <p className="text-sm text-white/55">{DESCRIPTIONS[discipline]}</p>
              </Link>
            ))}
            <Link
              href="/workouts/padel"
              className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
            >
              <p className="font-bold text-lg mb-1" style={{ color: "var(--color-fitness)" }}>
                Padel
              </p>
              <p className="text-sm text-white/55">Money spent/won and games played</p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
