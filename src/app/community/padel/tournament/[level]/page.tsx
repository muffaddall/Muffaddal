import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { getTourneysByLevel } from "@/lib/tourneys";
import { isTourneyLevel, TOURNEY_LEVEL_LABELS } from "@/lib/types";
import CreateTourneyForm from "./CreateTourneyForm";
import TourneyRow from "./TourneyRow";

export const dynamic = "force-dynamic";

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
            <TourneyRow key={t.id} tourney={t} level={level} />
          ))}
        </div>
      </main>
    </div>
  );
}
