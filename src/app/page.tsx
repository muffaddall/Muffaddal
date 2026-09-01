import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { QuickAddMenu } from "@/components/QuickAddMenu";
import { quoteOfTheDay } from "@/lib/quotes";

type Section = { href: string; label: string; description: string };

const GROUPS: { title: string; color: string; sections: Section[] }[] = [
  {
    title: "Content",
    color: "var(--color-shoot)",
    sections: [
      { href: "/schedule/day", label: "Shooting / Editing Schedule", description: "Shoot and edit — day/week/month" },
      { href: "/posting-schedule", label: "Posting Schedule", description: "This week's posts by time" },
      { href: "/vault", label: "Idea Vault", description: "Every idea, scheduled or not" },
    ],
  },
  {
    title: "Finance",
    color: "var(--color-accent)",
    sections: [
      { href: "/expenses", label: "Planned Expenses", description: "Monthly income and spending" },
      { href: "/day-to-day", label: "Day-to-Day Expenses", description: "Daily diary, accounts and transfers" },
      { href: "/investments", label: "Investments", description: "Etoro contributions and P&L" },
      { href: "/savings", label: "Savings & debt", description: "Big Purchase Fund and savings progress" },
      { href: "/networth", label: "Net Worth", description: "Cash, investments, savings and BPF, combined" },
    ],
  },
  {
    title: "Fitness",
    color: "var(--color-fitness)",
    sections: [
      { href: "/calories", label: "Calorie Tracker", description: "Daily log and weekly deficit/surplus" },
      { href: "/weight", label: "Weight Tracker", description: "Log entries and see your trend" },
      { href: "/workouts", label: "Workout Tracker", description: "Running, cycling & swimming logs" },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="pb-10">
      <PageHeader
        title="Muffaddal's Life Planner"
        showHome={false}
        right={<QuickAddMenu />}
      />

      <p className="text-center text-sm text-white/45 italic px-4 mb-8">
        &ldquo;{quoteOfTheDay()}&rdquo;
      </p>

      <div className="px-4 flex flex-col gap-7 max-w-2xl mx-auto">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h2
              className="font-display text-2xl tracking-wide leading-none mb-3 px-1"
              style={{ color: group.color }}
            >
              {group.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.sections.map((section) => (
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
        ))}
      </div>
    </div>
  );
}
