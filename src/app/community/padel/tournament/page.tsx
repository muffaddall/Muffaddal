import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

const DIVISIONS = [
  { href: "/community/padel/tournament/open-d", label: "Open D" },
  { href: "/community/padel/tournament/d-plus-c-minus", label: "D+ C -" },
  { href: "/community/padel/tournament/c-minus-c", label: "C- C" },
];

export default function TournamentPage() {
  return (
    <div className="pb-10">
      <PageHeader title="Tournament" subtitle="Padel" />
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-3">
        {DIVISIONS.map((division) => (
          <Link
            key={division.href}
            href={division.href}
            className="block rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
          >
            <p className="font-semibold text-base">{division.label}</p>
          </Link>
        ))}
      </main>
    </div>
  );
}
