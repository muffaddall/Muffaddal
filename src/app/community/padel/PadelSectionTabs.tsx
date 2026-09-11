import Link from "next/link";

const ITEMS = [
  { key: "tournament", href: "/community/padel/tournament", label: "Tournament" },
  { key: "players", href: "/community/padel/players", label: "Players" },
  { key: "leaderboard", href: "/community/padel/leaderboard", label: "Leaderboard" },
  { key: "formats", href: "/community/padel/formats", label: "Formats" },
] as const;

export function PadelSectionTabs({
  active,
}: {
  active: "tournament" | "players" | "leaderboard" | "formats";
}) {
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10 overflow-x-auto max-w-full">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
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
