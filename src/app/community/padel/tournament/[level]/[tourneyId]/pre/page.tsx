import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getAllFormats, getAllPlayers, getGroupsWithStandings, getTeamsForTourney, getTourney } from "@/lib/tourneys";
import { isTourneyLevel, TOURNEY_LEVEL_LABELS } from "@/lib/types";
import { TourneySectionTabs } from "../TourneySectionTabs";
import TeamEntrySection from "../TeamEntrySection";
import PointsSettingsForm from "../PointsSettingsForm";
import GroupsSummary from "./GroupsSummary";
import RegenerateGroupsButton from "./RegenerateGroupsButton";

export const dynamic = "force-dynamic";

export default async function PreTournamentPage(
  props: PageProps<"/community/padel/tournament/[level]/[tourneyId]/pre">
) {
  const { level: levelParam, tourneyId } = await props.params;
  if (!isTourneyLevel(levelParam)) notFound();
  const level = levelParam;

  const tourney = await getTourney(tourneyId);
  if (!tourney || tourney.level !== level) notFound();

  const hasGroups = tourney.status !== "setup";
  const [teams, groups, formats, players] = await Promise.all([
    getTeamsForTourney(tourneyId),
    hasGroups ? getGroupsWithStandings(tourneyId) : Promise.resolve([]),
    tourney.status === "setup" ? getAllFormats() : Promise.resolve([]),
    getAllPlayers(),
  ]);

  return (
    <div className="pb-10">
      <PageHeader title="Pre-Tournament" subtitle={`${tourney.name} · ${TOURNEY_LEVEL_LABELS[level]}`} />
      <div className="flex justify-center mb-4">
        <TourneySectionTabs level={level} tourneyId={tourneyId} active="pre" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-6">
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
            Teams
          </h2>
          <TeamEntrySection
            level={level}
            tourneyId={tourneyId}
            teams={teams}
            formats={formats}
            players={players}
            locked={tourney.status !== "setup"}
            initialQualifiersPerGroup={tourney.qualifiersPerGroup}
            initialWildcardCount={tourney.wildcardCount}
            initialHasKnockout={tourney.hasKnockout}
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
            Points
          </h2>
          <PointsSettingsForm level={level} tourneyId={tourneyId} tourney={tourney} />
        </section>

        {hasGroups && (
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
              Groups
            </h2>
            <div className="flex flex-col gap-3">
              <GroupsSummary groups={groups} />
              <p className="text-xs text-white/40">
                {tourney.hasKnockout
                  ? "Scoring and the knockout bracket happen on the During Event page once the day starts."
                  : "This tournament has no knockout stage — group standings decide the result. Score matches and finish it from the During Event page."}
              </p>
              <RegenerateGroupsButton level={level} tourneyId={tourneyId} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
