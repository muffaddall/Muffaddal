import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FitnessSectionTabs } from "@/components/FitnessSectionTabs";
import { WORKOUT_DISCIPLINES, WORKOUT_DISCIPLINE_LABELS } from "@/lib/types";

const DESCRIPTIONS: Record<string, string> = {
  running: "Log runs and track your pace",
  cycling: "Log rides and track your pace",
  swimming: "Log swims and track your pace",
};

export default function WorkoutsPage() {
  return (
    <div className="pb-10">
      <PageHeader title="Workout Tracker" />
      <div className="flex justify-center mb-4">
        <FitnessSectionTabs active="workouts" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WORKOUT_DISCIPLINES.map((discipline) => (
            <Link
              key={discipline}
              href={`/workouts/${discipline}`}
              className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
            >
              <p className="font-semibold text-base mb-1">
                {WORKOUT_DISCIPLINE_LABELS[discipline]}
              </p>
              <p className="text-xs text-white/45">{DESCRIPTIONS[discipline]}</p>
            </Link>
          ))}
          <Link
            href="/workouts/padel"
            className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
          >
            <p className="font-semibold text-base mb-1">Padel</p>
            <p className="text-xs text-white/45">Money spent/won and games played</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
