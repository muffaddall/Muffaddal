import Link from "next/link";

export function PostingScheduleTabs({ active }: { active: "week" | "month" }) {
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
      <Link
        href="/posting-schedule"
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === "week" ? "bg-white/15 text-white" : "text-white/50"
        }`}
      >
        Week
      </Link>
      <Link
        href="/posting-schedule/month"
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === "month" ? "bg-white/15 text-white" : "text-white/50"
        }`}
      >
        Month
      </Link>
    </nav>
  );
}
