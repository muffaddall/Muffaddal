import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { getPlayerProfile } from "@/lib/tourneys";
import { TOURNEY_LEVEL_LABELS } from "@/lib/types";
import { formatDateShort } from "@/lib/date";
import { PadelSectionTabs } from "../../PadelSectionTabs";
import DeletePlayerButton from "./DeletePlayerButton";
import LoyaltyProgress from "./LoyaltyProgress";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage(props: PageProps<"/community/padel/players/[playerId]">) {
  const { playerId } = await props.params;
  const profile = await getPlayerProfile(playerId);
  if (!profile) notFound();

  const { player, currentLevel, totalPoints, joinPoints, winPoints, history, stats, loyalty } = profile;

  return (
    <div className="pb-10">
      <PageHeader
        title={player.name}
        subtitle="Player Profile"
        right={<DeletePlayerButton playerId={player.id} playerName={player.name} tourneysPlayed={history.length} />}
      />
      <div className="flex justify-center mb-4">
        <PadelSectionTabs active="players" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-1">
          {player.country && <p className="text-sm text-white/45">{player.country}</p>}
          <span className="rounded-full border border-[var(--color-community)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--color-community)]">
            {currentLevel ? TOURNEY_LEVEL_LABELS[currentLevel] : "Unranked"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Total Points" value={totalPoints} />
          <Stat label="Join Points" value={joinPoints} />
          <Stat label="Win Points" value={winPoints} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Tournaments" value={stats.tournamentsPlayed} />
          <Stat label="Matches Won" value={stats.matchesWon} />
          <Stat label="Matches Lost" value={stats.matchesLost} />
          <Stat label="1st Place" value={stats.firstPlaceCount} />
          <Stat label="2nd Place" value={stats.secondPlaceCount} />
        </div>

        <LoyaltyProgress playerId={player.id} loyalty={loyalty} />

        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
            Tournament History
          </h2>
          {history.length === 0 ? (
            <EmptyState label="Hasn't joined a tournament yet." />
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((h) => (
                <li
                  key={h.team.id}
                  className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-sm">{h.tourney.name}</p>
                    <p className="text-xs text-white/45">
                      {TOURNEY_LEVEL_LABELS[h.tourney.level]} · with {h.partnerName} · {formatDateShort(h.tourney.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
      <p className="text-xs mb-1" style={{ color: "var(--color-community)" }}>
        {label}
      </p>
      <p className="font-display text-xl">{value}</p>
    </div>
  );
}
