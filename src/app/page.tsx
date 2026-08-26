import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { quoteOfTheDay } from "@/lib/quotes";

const SECTIONS: { href: string; label: string; description: string }[] = [
  { href: "/schedule/day", label: "Content Schedule", description: "Shoot, edit, and post — day/week/month" },
  { href: "/posting-schedule", label: "Posting Schedule", description: "This week's posts by time" },
  { href: "/vault", label: "Idea Vault", description: "Every idea, scheduled or not" },
  { href: "/expenses", label: "Expenses", description: "Monthly income and spending" },
  { href: "/investments", label: "Investments", description: "Etoro contributions and P&L" },
  { href: "/savings", label: "Savings & debt", description: "Big Purchase Fund and savings progress" },
];

export default function HomePage() {
  return (
    <div className="pb-10">
      <PageHeader
        title="Muffaddal's Life Planner"
        right={
          <Link
            href="/new-idea?from=/"
            className="flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
          >
            <span className="text-base leading-none">+</span> New Idea
          </Link>
        }
      />

      <p className="text-center text-sm text-white/45 italic px-4 mb-8">
        &ldquo;{quoteOfTheDay()}&rdquo;
      </p>

      <div className="px-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
          >
            <p className="font-semibold text-base mb-1">{section.label}</p>
            <p className="text-xs text-white/45">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
