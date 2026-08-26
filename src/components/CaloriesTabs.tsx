import Link from "next/link";

export function CaloriesTabs({ active }: { active: "day" | "week" | "month" }) {
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
      <Link
        href="/calories"
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === "day" ? "bg-white/15 text-white" : "text-white/50"
        }`}
      >
        Day
      </Link>
      <Link
        href="/calories/week"
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === "week" ? "bg-white/15 text-white" : "text-white/50"
        }`}
      >
        Week
      </Link>
      <Link
        href="/calories/month"
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === "month" ? "bg-white/15 text-white" : "text-white/50"
        }`}
      >
        Month
      </Link>
    </nav>
  );
}
