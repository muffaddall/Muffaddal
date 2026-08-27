import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { FitnessSectionTabs } from "@/components/FitnessSectionTabs";
import { WorkoutDisciplineTabs } from "@/components/WorkoutDisciplineTabs";
import { getWorkoutLogs } from "@/lib/workouts";
import {
  WORKOUT_DISCIPLINE_LABELS,
  computeWorkoutStats,
  computeWorkoutVolume,
  formatDistance,
  formatPace,
  isWorkoutDiscipline,
  type VolumePeriod,
  type WorkoutDiscipline,
} from "@/lib/types";
import { todayStr } from "@/lib/date";
import AddWorkoutForm from "./AddWorkoutForm";
import WorkoutRow from "./WorkoutRow";

export const dynamic = "force-dynamic";

export default async function WorkoutDisciplinePage(
  props: PageProps<"/workouts/[discipline]">
) {
  const { discipline: disciplineParam } = await props.params;
  if (!isWorkoutDiscipline(disciplineParam)) notFound();
  const discipline = disciplineParam;

  const logs = await getWorkoutLogs(discipline);
  const { personalBestDistance, personalBestPace, averageDistance, averagePace } =
    computeWorkoutStats(logs);
  const volume = computeWorkoutVolume(logs, todayStr());

  return (
    <div className="pb-10">
      <PageHeader title={WORKOUT_DISCIPLINE_LABELS[discipline]} subtitle="Workout Tracker" />
      <div className="flex justify-center mb-2">
        <FitnessSectionTabs active="workouts" />
      </div>
      <div className="flex justify-center mb-4">
        <WorkoutDisciplineTabs active={discipline} />
      </div>
      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-fitness)" }}>
              PB Distance
            </p>
            <p className="font-display text-xl">
              {formatDistance(personalBestDistance, discipline)}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-fitness)" }}>
              PB Pace
            </p>
            <p className="font-display text-xl">{formatPace(personalBestPace, discipline)}</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-fitness)" }}>
              Average Distance
            </p>
            <p className="font-display text-xl">{formatDistance(averageDistance, discipline)}</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-fitness)" }}>
              Average Pace
            </p>
            <p className="font-display text-xl">{formatPace(averagePace, discipline)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <VolumeCard title="This Week" period={volume.week} discipline={discipline} />
          <VolumeCard title="This Month" period={volume.month} discipline={discipline} />
        </div>

        <AddWorkoutForm discipline={discipline} />

        <section className="mt-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-fitness)" }}>
            Entries
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr className="text-left text-xs text-[var(--color-fg-dim)]">
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Time</th>
                  <th className="pb-2 pr-3 font-medium">Distance</th>
                  <th className="pb-2 pr-3 font-medium">Duration</th>
                  <th className="pb-2 pr-3 font-medium">Pace</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <WorkoutRow key={log.id} log={log} />
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-[var(--color-fg-dim)]">
                      No workouts logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function VolumeCard({
  title,
  period,
  discipline,
}: {
  title: string;
  period: VolumePeriod;
  discipline: WorkoutDiscipline;
}) {
  const vsPrevious = Math.round((period.current - period.previous) * 10) / 10;
  const vsBest = Math.round((period.current - period.best) * 10) / 10;

  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
      <p className="text-xs mb-1" style={{ color: "var(--color-fitness)" }}>
        {title}
      </p>
      <p className="font-display text-2xl mb-2">{formatDistance(period.current, discipline)}</p>
      <div className="flex flex-col gap-0.5 text-xs text-white/80">
        <span>
          vs previous ({formatDistance(period.previous, discipline)}):{" "}
          {vsPrevious > 0 ? "+" : ""}
          {formatDistance(vsPrevious, discipline)}
        </span>
        <span>
          vs best ({formatDistance(period.best, discipline)}): {vsBest > 0 ? "+" : ""}
          {formatDistance(vsBest, discipline)}
        </span>
      </div>
    </div>
  );
}
