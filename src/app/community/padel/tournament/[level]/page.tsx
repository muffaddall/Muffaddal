import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { getTourneysByLevel } from "@/lib/tourneys";
import { isTourneyLevel, TOURNEY_LEVEL_LABELS, type TourneyStatus } from "@/lib/types";
import { formatDateShort } from "@/lib/date";
import CreateTourneyForm from "./CreateTourneyForm";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<TourneyStatus, string> = {
  setup: "Setup",
  groups: "Groups",
  knockout: "Knockout",
  completed: "Completed",
};

export default async function TourneyLevelPage(props: PageProps<"/community/padel/tournament/[level]">) {
  const { level: levelParam } = await props.params;
  if (!isTourneyLevel(levelParam)) notFound();
  const level = levelParam;

  const tourneys = await getTourneysByLevel(level);

  return (
    <div className="pb-10">
      <PageHeader title={TOURNEY_LEVEL_LABELS[level]} subtitle="Tournament" />
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-4">
        <CreateTourneyForm level={level} />

        <div className="flex flex-col gap-2">
          {tourneys.length === 0 && <EmptyState label="No tournaments yet — create one above." />}
          {tourneys.map((t) => (
            <Link
              key={t.id}
              href={`/community/padel/tournament/${level}/${t.id}`}
              className="flex items-center justify-between rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
            >
              <div>
                <p className="font-semibold text-base">{t.name}</p>
                <p className="text-xs text-white/45">{formatDateShort(t.date)}</p>
              </div>
              <span className="shrink-0 rounded-full border border-[var(--color-community)] px-2.5 py-1 text-[10px] uppercase tracking-wide text-[var(--color-community)]">
                {STATUS_LABELS[t.status]}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
