import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getGroupsWithStandings, getMatchesForTourney, getTeamsForTourney, getTourney } from "@/lib/tourneys";
import { isTourneyLevel, TOURNEY_LEVEL_LABELS } from "@/lib/types";
import PaymentsSection from "./PaymentsSection";
import GroupStageSection from "./GroupStageSection";
import KnockoutSection from "./KnockoutSection";

export const dynamic = "force-dynamic";

export default async function DuringEventPage(
  props: PageProps<"/community/padel/tournament/[level]/[tourneyId]/live">
) {
  const { level: levelParam, tourneyId } = await props.params;
  if (!isTourneyLevel(levelParam)) notFound();
  const level = levelParam;

  const tourney = await getTourney(tourneyId);
  if (!tourney || tourney.level !== level) notFound();

  const showGroups = tourney.status !== "setup";
  const showKnockout = tourney.status === "knockout" || tourney.status === "completed";

  const [teams, groups, matches] = await Promise.all([
    getTeamsForTourney(tourneyId),
    showGroups ? getGroupsWithStandings(tourneyId) : Promise.resolve([]),
    showKnockout ? getMatchesForTourney(tourneyId) : Promise.resolve([]),
  ]);
  const knockoutMatches = matches.filter((m) => m.stage === "knockout");

  return (
    <div className="pb-10">
      <PageHeader title="During Event" subtitle={`${tourney.name} · ${TOURNEY_LEVEL_LABELS[level]}`} />
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-6">
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
            Payments
          </h2>
          <PaymentsSection level={level} tourneyId={tourneyId} teams={teams} />
        </section>

        {showGroups ? (
          <>
            <section>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
                Group Stage
              </h2>
              <GroupStageSection
                level={level}
                tourneyId={tourneyId}
                groups={groups}
                locked={tourney.status !== "groups"}
                qualifiersPerGroup={tourney.qualifiersPerGroup}
                wildcardCount={tourney.wildcardCount}
              />
            </section>

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
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 py-6 text-center text-sm text-white/35">
            No groups drawn yet —{" "}
            <Link href={`/community/padel/tournament/${level}/${tourneyId}/pre`} className="underline">
              set up teams and generate groups
            </Link>{" "}
            first.
          </div>
        )}
      </main>
    </div>
  );
}
