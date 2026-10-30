import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { QuickAddMenu } from "@/components/QuickAddMenu";
import { quoteOfTheDay } from "@/lib/quotes";
import { getHabitDoneDates, getHabits } from "@/lib/habits";
import { todayStr } from "@/lib/date";
import HabitDayButton from "./habits/HabitDayButton";

type Section = { href: string; label: string; description: string };

const GROUPS: { title: string; color: string; sections: Section[] }[] = [
  {
    title: "Content",
    color: "var(--color-shoot)",
    sections: [
      { href: "/schedule/day", label: "Shooting / Editing Schedule", description: "Shoot and edit — day/week/month" },
      { href: "/posting-schedule", label: "Posting Schedule", description: "This week's posts by time" },
      { href: "/vault", label: "Idea Vault", description: "Every idea, scheduled or not" },
      { href: "/podcast", label: "Podcast", description: "Podcast ideas and shoot/edit/post schedule" },
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
  {
    title: "Habits",
    color: "var(--color-habits)",
    sections: [
      { href: "/habits", label: "Habit Tracker", description: "Daily tick-offs, streaks and monthly %" },
    ],
  },
  {
    title: "Elevate Fitness Community",
    color: "var(--color-community)",
    sections: [
      { href: "/community/padel", label: "Padel", description: "Tournament divisions" },
    ],
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Habits are a nice-to-have on Home — never let a problem loading them
  // (e.g. their tables not created yet) take the whole home page down.
  const [habits, doneByHabit] = await Promise.all([getHabits(), getHabitDoneDates()]).catch(
    () => [[], new Map<string, Set<string>>()] as const
  );
  const today = todayStr();

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

      {/* Collapsed by default so habit names stay private if someone else
          glances at the screen — one tap opens the tick buttons. */}
      {habits.length > 0 && (
        <div className="px-4 max-w-2xl mx-auto mb-7">
          <details className="rounded-2xl bg-[var(--color-surface)] border border-white/8 overflow-hidden">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-4 py-3 flex items-center justify-between">
              <span className="font-display text-2xl tracking-wide leading-none" style={{ color: "var(--color-habits)" }}>
                Today&apos;s Habits
              </span>
              <span className="text-xs text-[var(--color-fg-dim)]">Tap to show ▾</span>
            </summary>
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {habits.map((h) => (
                  <HabitDayButton
                    key={h.id}
                    habitId={h.id}
                    date={today}
                    done={doneByHabit.get(h.id)?.has(today) ?? false}
                    label={h.name}
                    wide
                  />
                ))}
              </div>
              <Link href="/habits" className="block mt-3 text-xs text-[var(--color-fg-dim)] hover:text-white/80">
                Open Habits →
              </Link>
            </div>
          </details>
        </div>
      )}

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
