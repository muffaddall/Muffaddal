import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { TOURNEY_LEVELS, TOURNEY_LEVEL_LABELS } from "@/lib/types";
import { PadelSectionTabs } from "../PadelSectionTabs";

export default function TournamentPage() {
  return (
    <div className="pb-10">
      <PageHeader title="Tournament" subtitle="Padel" />
      <div className="flex justify-center mb-4">
        <PadelSectionTabs active="tournament" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-3">
        {TOURNEY_LEVELS.map((level) => (
          <Link
            key={level}
            href={`/community/padel/tournament/${level}`}
            className="block rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
          >
            <p className="font-semibold text-base">{TOURNEY_LEVEL_LABELS[level]}</p>
          </Link>
        ))}
      </main>
    </div>
  );
}
