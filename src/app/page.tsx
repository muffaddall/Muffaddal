import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { QuickAddMenu } from "@/components/QuickAddMenu";
import { quoteOfTheDay } from "@/lib/quotes";
import { getTodaysClasses, getTodaysDeadlines, getUpcomingWeekItems } from "@/lib/education";
import { daysUntil } from "@/lib/types";
import { formatDateShort, parseDateStr, shiftDate, todayStr } from "@/lib/date";
import { TodayClasses } from "./TodayClasses";

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
    title: "Education",
    color: "var(--color-education)",
    sections: [
      { href: "/education", label: "Semesters & GPA", description: "Courses, grades, and cumulative GPA" },
    ],
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = todayStr();
  const dayOfWeek = parseDateStr(today).getDay();
  const [todaysClasses, todaysDeadlines, weekItems] = await Promise.all([
    getTodaysClasses(today, dayOfWeek),
    getTodaysDeadlines(today),
    getUpcomingWeekItems(today, shiftDate(today, 6)),
  ]);

  const KIND_LABELS: Record<string, string> = { assignment: "Assignment", exam: "Exam", quiz: "Quiz" };

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

      <div className="px-4 max-w-2xl mx-auto">
        <TodayClasses classes={todaysClasses} />

        {todaysDeadlines.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-2xl tracking-wide leading-none mb-3 px-1" style={{ color: "var(--color-education)" }}>
              Today&apos;s Deadlines
            </h2>
            <ul className="flex flex-col gap-2">
              {todaysDeadlines.map((d) => (
                <li key={`${d.kind}-${d.id}`} className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4">
                  <p className="font-semibold text-base">{d.title}</p>
                  <p className="text-xs text-white/45">
                    {KIND_LABELS[d.kind]} · {d.courseName}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {weekItems.length > 0 && (
          <div className="mb-7">
            <h2 className="font-display text-2xl tracking-wide leading-none mb-3 px-1" style={{ color: "var(--color-education)" }}>
              This Week
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {weekItems.map((item) => {
                const remaining = daysUntil(item.date, today);
                return (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className="shrink-0 w-40 rounded-2xl bg-[var(--color-surface)] border border-white/8 p-3"
                  >
                    <p className="text-xs text-white/45 mb-1">
                      {KIND_LABELS[item.kind]} · {remaining === 0 ? "Today" : `${remaining}d`}
                    </p>
                    <p className="font-semibold text-sm truncate">{item.title}</p>
                    <p className="text-xs text-white/45 truncate">
                      {item.courseName} · {formatDateShort(item.date)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
