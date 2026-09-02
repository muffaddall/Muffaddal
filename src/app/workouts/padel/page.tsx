import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FitnessSectionTabs } from "@/components/FitnessSectionTabs";
import { getPadelStats, totalPadelWinnings } from "@/lib/padel";
import { formatMoney, formatMonth } from "@/lib/format";
import PadelWinningRow from "./PadelWinningRow";
import AddPadelWinningForm from "./AddPadelWinningForm";
import PadelBaselineEditor from "./PadelBaselineEditor";

export const dynamic = "force-dynamic";

export default async function PadelTrackerPage() {
  const stats = await getPadelStats();
  const { baseline, winnings, totalIncome, totalSpent, net, breakdown, games } = stats;

  return (
    <div className="pb-10">
      <PageHeader
        title="Padel Tracker"
        right={
          <Link
            href="/workouts"
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
          >
            ← Workouts
          </Link>
        }
      />
      <div className="flex justify-center mb-4">
        <FitnessSectionTabs active="workouts" />
      </div>

      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <p className="text-xs text-[var(--color-fg-dim)] mb-4 text-center">
          Pulled automatically from every &ldquo;Working out &rsaquo; Padel&rdquo; expense logged in
          Day-to-Day, plus tournament winnings you add below.
        </p>

        <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Padel Income
            </p>
            <p className="font-display text-2xl" style={{ color: "var(--color-positive)" }}>
              {formatMoney(totalIncome)}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Padel Deficit
            </p>
            <p className="font-display text-2xl" style={{ color: "var(--color-negative)" }}>
              {formatMoney(totalSpent)}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Net ({net < 0 ? "Deficit" : "Surplus"})
            </p>
            <p
              className="font-display text-2xl"
              style={{ color: net < 0 ? "var(--color-negative)" : "var(--color-positive)" }}
            >
              {formatMoney(Math.abs(net))}
            </p>
          </div>
        </div>

        {breakdown.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
              Where it&apos;s gone
            </h2>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-white/8">
              {breakdown.map((row) => (
                <div key={row.name} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-[var(--color-fg-dim)]">{row.name}</span>
                  <span className="text-sm tabular-nums">{formatMoney(row.amount)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--color-fg-dim)] mt-2">
              Plus {formatMoney(baseline.spent)} from before individual games/tournaments were logged.
            </p>
          </section>
        )}

        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
            Games played
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                Since September 2024
              </p>
              <p className="font-display text-3xl">{games.allTime}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                This year
              </p>
              <p className="font-display text-3xl">{games.thisYear}</p>
              <p className="text-xs text-[var(--color-fg-dim)] mt-1">
                {games.lastYear} last year
                {games.bestYear && ` · best ${games.bestYear.count} (${games.bestYear.key})`}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                This month
              </p>
              <p className="font-display text-3xl">{games.thisMonth}</p>
              <p className="text-xs text-[var(--color-fg-dim)] mt-1">
                {games.lastMonth} last month
                {games.bestMonth &&
                  ` · best ${games.bestMonth.count} (${formatMonth(`${games.bestMonth.key}-01`)})`}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
            Tournament record
          </h2>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
            <Stat label="Played" value={baseline.tournaments} />
            <Stat label="Wins" value={baseline.wins} />
            <Stat label="Runner-up" value={baseline.runnersUp} />
            <Stat label="Reached knockouts" value={`${baseline.knockouts}/${baseline.tournaments}`} />
          </div>
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
              Tournament winnings
            </h2>
            {winnings.length > 0 && (
              <span className="text-sm tabular-nums text-[var(--color-positive)]">
                +{formatMoney(totalPadelWinnings(winnings))}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-fg-dim)] mb-3">
            Won a cash prize? Log it here — it adds straight to Padel Income above.
          </p>
          <ul className="flex flex-col gap-1 mb-3">
            {winnings.map((w) => (
              <PadelWinningRow key={w.id} winning={w} />
            ))}
            {winnings.length === 0 && (
              <li className="text-sm text-[var(--color-fg-dim)] py-4 text-center">
                No tournament winnings logged yet.
              </li>
            )}
          </ul>
          <AddPadelWinningForm />
        </section>

        <PadelBaselineEditor baseline={baseline} />
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-fg-dim)] mb-0.5">{label}</p>
      <p className="font-display text-xl">{value}</p>
    </div>
  );
}
