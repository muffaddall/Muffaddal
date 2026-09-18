import Link from "next/link";
import type { TourneyLevel } from "@/lib/types";

const ITEMS = [
  { key: "income", label: "Income" },
  { key: "expenses", label: "Expenses" },
] as const;

export function BudgetSectionTabs({
  level,
  tourneyId,
  active,
}: {
  level: TourneyLevel;
  tourneyId: string;
  active: "income" | "expenses";
}) {
  const base = `/community/padel/tournament/${level}/${tourneyId}/budget`;
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={`${base}/${item.key}`}
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
