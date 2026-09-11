import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { getLeaderboard } from "@/lib/tourneys";
import { TOURNEY_LEVEL_LABELS } from "@/lib/types";
import { PadelSectionTabs } from "../PadelSectionTabs";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="pb-10">
      <PageHeader title="Leaderboard" subtitle="Padel" />
      <div className="flex justify-center mb-4">
        <PadelSectionTabs active="leaderboard" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6">
        {leaderboard.length === 0 ? (
          <EmptyState label="No players yet — they'll show up once teams join a tournament." />
        ) : (
          <div className="rounded-2xl border border-white/8 bg-[var(--color-surface)] overflow-hidden">
            {leaderboard.map((entry, i) => (
              <Link
                key={entry.playerId}
                href={`/community/padel/players/${entry.playerId}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-white/8 last:border-b-0 hover:bg-white/5 transition-colors"
              >
                <span className="w-6 shrink-0 text-center font-display text-lg text-white/40">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {entry.name}
                    {entry.country && <span className="text-white/40 font-normal"> · {entry.country}</span>}
                  </p>
                  <p className="text-xs text-white/45">
                    {entry.currentLevel ? TOURNEY_LEVEL_LABELS[entry.currentLevel] : "—"} · {entry.tourneysPlayed} tourney
                    {entry.tourneysPlayed === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="shrink-0 font-display text-xl" style={{ color: "var(--color-community)" }}>
                  {entry.totalPoints}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
