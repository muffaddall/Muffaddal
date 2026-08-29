import Link from "next/link";
import type { DdCategoryKind } from "@/lib/types";

export default function CategoryKindTabs({ active }: { active: DdCategoryKind }) {
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10 w-fit mx-auto">
      <Link
        href="/day-to-day/categories?kind=expense"
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === "expense" ? "bg-white/15 text-white" : "text-white/50"
        }`}
      >
        Expense
      </Link>
      <Link
        href="/day-to-day/categories?kind=income"
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === "income" ? "bg-white/15 text-white" : "text-white/50"
        }`}
      >
        Income
      </Link>
    </nav>
  );
}
