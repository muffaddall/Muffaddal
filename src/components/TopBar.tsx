import Link from "next/link";
import { MenuButton } from "@/components/MenuButton";

export function TopBar({ active }: { active: "day" | "week" | "month" }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-2">
      <MenuButton />

      <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
        <Link
          href="/schedule/day"
          className={`px-2.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === "day" ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          Day
        </Link>
        <Link
          href="/schedule/week"
          className={`px-2.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === "week" ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          Week
        </Link>
        <Link
          href="/schedule/month"
          className={`px-2.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === "month" ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          Month
        </Link>
      </nav>

      <Link
        href="/add?from=/schedule/day"
        className="ml-auto flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-3.5 py-1.5 active:scale-95 transition-transform shrink-0"
      >
        <span className="text-base leading-none">+</span> Add
      </Link>
    </div>
  );
}
