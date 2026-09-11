import Link from "next/link";
import { TOURNEY_LEVELS, TOURNEY_LEVEL_LABELS, type TourneyLevel } from "@/lib/types";

export function TourneyLevelTabs({ active }: { active: TourneyLevel }) {
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10 overflow-x-auto max-w-full">
      {TOURNEY_LEVELS.map((level) => (
        <Link
          key={level}
          href={`/community/padel/tournament/${level}`}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            active === level ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          {TOURNEY_LEVEL_LABELS[level]}
        </Link>
      ))}
    </nav>
  );
}
