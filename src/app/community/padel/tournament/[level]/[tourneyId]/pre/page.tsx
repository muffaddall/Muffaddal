import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getAllFormats, getGroupsWithStandings, getTeamsForTourney, getTourney } from "@/lib/tourneys";
import { isTourneyLevel, TOURNEY_LEVEL_LABELS } from "@/lib/types";
import TeamEntrySection from "../TeamEntrySection";
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
  const [teams, groups, formats] = await Promise.all([
    getTeamsForTourney(tourneyId),
    hasGroups ? getGroupsWithStandings(tourneyId) : Promise.resolve([]),
    tourney.status === "setup" ? getAllFormats() : Promise.resolve([]),
  ]);

  return (
    <div className="pb-10">
      <PageHeader title="Pre-Tournament" subtitle={`${tourney.name} · ${TOURNEY_LEVEL_LABELS[level]}`} />
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
            locked={tourney.status !== "setup"}
          />
        </section>

        {hasGroups && (
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
              Groups
            </h2>
            <div className="flex flex-col gap-3">
              <GroupsSummary groups={groups} />
              <p className="text-xs text-white/40">
                Scoring and the knockout bracket happen on the During Event page once the day starts.
              </p>
              <RegenerateGroupsButton level={level} tourneyId={tourneyId} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
