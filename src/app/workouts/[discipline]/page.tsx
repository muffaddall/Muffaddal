import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getWorkoutLogs } from "@/lib/workouts";
import {
  WORKOUT_DISCIPLINE_LABELS,
  computeWorkoutStats,
  formatPace,
  isWorkoutDiscipline,
} from "@/lib/types";
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
  const { personalBestPace, averagePace } = computeWorkoutStats(logs);

  return (
    <div className="pb-10">
      <PageHeader title={WORKOUT_DISCIPLINE_LABELS[discipline]} subtitle="Workout Tracker" />
      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs text-[var(--color-fg-dim)] mb-1">Personal Best</p>
            <p className="font-display text-2xl">{formatPace(personalBestPace)}</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs text-[var(--color-fg-dim)] mb-1">Average pace</p>
            <p className="font-display text-2xl">{formatPace(averagePace)}</p>
          </div>
        </div>

        <AddWorkoutForm discipline={discipline} />

        <section className="mt-6">
          <h2 className="text-sm font-medium text-[var(--color-fg-dim)] mb-3">Entries</h2>
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
