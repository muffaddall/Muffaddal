import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export default function PadelPage() {
  return (
    <div className="pb-10">
      <PageHeader title="Padel" />
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-3">
        <Link
          href="/community/padel/tournament"
          className="block rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
        >
          <p className="font-semibold text-base mb-1">Tournament</p>
          <p className="text-xs text-white/45">Divisions and results</p>
        </Link>
        <Link
          href="/community/padel/players"
          className="block rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
        >
          <p className="font-semibold text-base mb-1">Players</p>
          <p className="text-xs text-white/45">Leaderboard and profiles</p>
        </Link>
        <Link
          href="/community/padel/formats"
          className="block rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
        >
          <p className="font-semibold text-base mb-1">Formats</p>
          <p className="text-xs text-white/45">Saved group-count presets</p>
        </Link>
      </main>
    </div>
  );
}
