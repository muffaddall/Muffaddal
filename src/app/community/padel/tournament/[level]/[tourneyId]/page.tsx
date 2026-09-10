import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import {
  getGroupsWithStandings,
  getMatchesForTourney,
  getTeamsForTourney,
  getTourney,
} from "@/lib/tourneys";
import { isTourneyLevel, TOURNEY_LEVEL_LABELS } from "@/lib/types";
import { formatDateShort } from "@/lib/date";
import TeamEntrySection from "./TeamEntrySection";
import GroupStageSection from "./GroupStageSection";
import KnockoutSection from "./KnockoutSection";

export const dynamic = "force-dynamic";

export default async function TourneyPage(props: PageProps<"/community/padel/tournament/[level]/[tourneyId]">) {
  const { level: levelParam, tourneyId } = await props.params;
  if (!isTourneyLevel(levelParam)) notFound();
  const level = levelParam;

  const tourney = await getTourney(tourneyId);
  if (!tourney || tourney.level !== level) notFound();

  const teams = await getTeamsForTourney(tourneyId);
  const showGroups = tourney.status !== "setup";
  const showKnockout = tourney.status === "knockout" || tourney.status === "completed";

  const [groups, matches] = await Promise.all([
    showGroups ? getGroupsWithStandings(tourneyId) : Promise.resolve([]),
    showKnockout ? getMatchesForTourney(tourneyId) : Promise.resolve([]),
  ]);
  const knockoutMatches = matches.filter((m) => m.stage === "knockout");

  return (
    <div className="pb-10">
      <PageHeader title={tourney.name} subtitle={TOURNEY_LEVEL_LABELS[level]} />
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-6">
        <p className="text-center text-sm text-white/40 -mt-2">{formatDateShort(tourney.date)}</p>

        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
            Teams
          </h2>
          <TeamEntrySection level={level} tourneyId={tourneyId} teams={teams} locked={tourney.status !== "setup"} />
        </section>

        {showGroups && (
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
              Group Stage
            </h2>
            <GroupStageSection level={level} tourneyId={tourneyId} groups={groups} locked={tourney.status !== "groups"} />
          </section>
        )}

        {showKnockout && (
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
              Knockout
            </h2>
            <KnockoutSection
              level={level}
              tourneyId={tourneyId}
              matches={knockoutMatches}
              teams={teams}
              status={tourney.status}
            />
          </section>
        )}
      </main>
    </div>
  );
}
