import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { getAllPlayers } from "@/lib/tourneys";
import AddPlayerForm from "./AddPlayerForm";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await getAllPlayers();

  return (
    <div className="pb-10">
      <PageHeader
        title="Players"
        subtitle="Padel"
        right={
          <Link
            href="/community/padel/leaderboard"
            className="rounded-full border border-[var(--color-community)] px-3 py-1.5 text-xs text-[var(--color-community)]"
          >
            Leaderboard
          </Link>
        }
      />
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-4">
        <AddPlayerForm />

        {players.length === 0 ? (
          <EmptyState label="No players yet — add one above, or they'll show up once a team joins a tournament." />
        ) : (
          <div className="rounded-2xl border border-white/8 bg-[var(--color-surface)] overflow-hidden">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/community/padel/players/${player.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/8 last:border-b-0 hover:bg-white/5 transition-colors"
              >
                <p className="font-semibold text-sm truncate">{player.name}</p>
                {player.country && <p className="text-xs text-white/45 shrink-0">{player.country}</p>}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
