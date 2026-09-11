import Link from "next/link";
import type { TourneyLevel } from "@/lib/types";

const ITEMS = [
  { key: "hub", suffix: "", label: "Overview" },
  { key: "pre", suffix: "/pre", label: "Pre" },
  { key: "live", suffix: "/live", label: "Live" },
  { key: "budget", suffix: "/budget", label: "Budget" },
] as const;

export function TourneySectionTabs({
  level,
  tourneyId,
  active,
}: {
  level: TourneyLevel;
  tourneyId: string;
  active: "hub" | "pre" | "live" | "budget";
}) {
  const base = `/community/padel/tournament/${level}/${tourneyId}`;
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10 overflow-x-auto max-w-full">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={`${base}${item.suffix}`}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            active === item.key ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
