import Link from "next/link";

export function TopBar({ active }: { active: "day" | "week" | "month" }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-2">
      <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
        <Link
          href="/"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === "day"
              ? "bg-white/15 text-white"
              : "text-white/50"
          }`}
        >
          Day
        </Link>
        <Link
          href="/week"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === "week"
              ? "bg-white/15 text-white"
              : "text-white/50"
          }`}
        >
          Week
        </Link>
        <Link
          href="/month"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === "month"
              ? "bg-white/15 text-white"
              : "text-white/50"
          }`}
        >
          Month
        </Link>
      </nav>

      <Link
        href="/add"
        className="ml-auto flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
      >
        <span className="text-base leading-none">+</span> Add post
      </Link>
    </div>
  );
}
