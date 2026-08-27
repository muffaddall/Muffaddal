import Link from "next/link";
import { WORKOUT_DISCIPLINES, WORKOUT_DISCIPLINE_LABELS, type WorkoutDiscipline } from "@/lib/types";

export function WorkoutDisciplineTabs({ active }: { active: WorkoutDiscipline }) {
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
      {WORKOUT_DISCIPLINES.map((discipline) => (
        <Link
          key={discipline}
          href={`/workouts/${discipline}`}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === discipline ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          {WORKOUT_DISCIPLINE_LABELS[discipline]}
        </Link>
      ))}
    </nav>
  );
}
