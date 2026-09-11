import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getTourney } from "@/lib/tourneys";
import { isTourneyLevel, TOURNEY_LEVEL_LABELS, type TourneyStatus } from "@/lib/types";
import { formatDateShort } from "@/lib/date";
import { TourneySectionTabs } from "./TourneySectionTabs";
import DeleteTourneyButton from "./DeleteTourneyButton";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<TourneyStatus, string> = {
  setup: "Setup",
  groups: "Groups",
  knockout: "Knockout",
  completed: "Completed",
};

export default async function TourneyHubPage(props: PageProps<"/community/padel/tournament/[level]/[tourneyId]">) {
  const { level: levelParam, tourneyId } = await props.params;
  if (!isTourneyLevel(levelParam)) notFound();
  const level = levelParam;

  const tourney = await getTourney(tourneyId);
  if (!tourney || tourney.level !== level) notFound();

  const base = `/community/padel/tournament/${level}/${tourneyId}`;

  return (
    <div className="pb-10">
      <PageHeader
        title={tourney.name}
        subtitle={TOURNEY_LEVEL_LABELS[level]}
        right={<DeleteTourneyButton level={level} tourneyId={tourneyId} tourneyName={tourney.name} />}
      />
      <div className="flex justify-center mb-4">
        <TourneySectionTabs level={level} tourneyId={tourneyId} active="hub" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-1 -mt-2">
          <p className="text-sm text-white/40">{formatDateShort(tourney.date)}</p>
          <span className="rounded-full border border-[var(--color-community)] px-2.5 py-1 text-[10px] uppercase tracking-wide text-[var(--color-community)]">
            {STATUS_LABELS[tourney.status]}
          </span>
        </div>

        <Link
          href={`${base}/pre`}
          className="block rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
        >
          <p className="font-semibold text-base mb-1">Pre-Tournament</p>
          <p className="text-xs text-white/45">Teams, players, and the group draw</p>
        </Link>

        <Link
          href={`${base}/live`}
          className="block rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
        >
          <p className="font-semibold text-base mb-1">During Event</p>
          <p className="text-xs text-white/45">Payments, live scores, and the knockout bracket</p>
        </Link>

        <Link
          href={`${base}/budget`}
          className="block rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
        >
          <p className="font-semibold text-base mb-1">Budget Sheet</p>
          <p className="text-xs text-white/45">Income, outflow, and netflow — budgeted vs actual</p>
        </Link>
      </main>
    </div>
  );
}
