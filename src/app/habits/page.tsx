import { PageHeader } from "@/components/PageHeader";
import { getHabitDoneDates, getHabits } from "@/lib/habits";
import { bestHabitStreak, currentHabitStreak, habitMonthRate } from "@/lib/types";
import { formatWeekdayShort, shiftDate, todayStr } from "@/lib/date";
import HabitCard from "./HabitCard";
import AddHabitForm from "./AddHabitForm";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const [habits, doneByHabit] = await Promise.all([getHabits(), getHabitDoneDates()]);
  const today = todayStr();
  // The last 7 days ending today — tap any of them, so a forgotten tick
  // from earlier in the week can still be filled in.
  const week = Array.from({ length: 7 }, (_, i) => shiftDate(today, i - 6));

  const doneToday = habits.filter((h) => doneByHabit.get(h.id)?.has(today)).length;

  return (
    <div className="pb-10">
      <PageHeader title="Habits" />

      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        {habits.length > 0 && (
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center mb-6">
            <p className="text-xs mb-1" style={{ color: "var(--color-habits)" }}>
              Today
            </p>
            <p className="font-display text-3xl">
              {doneToday}/{habits.length} done
            </p>
            <p className="text-xs text-[var(--color-fg-dim)] mt-1">
              Tap a day to tick it off — tap again to undo
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-4">
          {habits.map((habit) => {
            const done = doneByHabit.get(habit.id) ?? new Set<string>();
            return (
              <HabitCard
                key={habit.id}
                id={habit.id}
                name={habit.name}
                currentStreak={currentHabitStreak(done, today)}
                bestStreak={bestHabitStreak(done)}
                monthRate={habitMonthRate(done, today, habit.createdAt)}
                days={week.map((date) => ({
                  date,
                  weekday: date === today ? "Today" : formatWeekdayShort(date),
                  dayNumber: Number(date.slice(8, 10)),
                  done: done.has(date),
                }))}
              />
            );
          })}
          {habits.length === 0 && (
            <p className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
              No habits yet — add your first one below.
            </p>
          )}
        </div>

        <AddHabitForm />
      </main>
    </div>
  );
}
