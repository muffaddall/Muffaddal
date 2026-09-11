import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getBudgetLines, getFormat, getTourney } from "@/lib/tourneys";
import { formatHasCourtFeePreset, isTourneyLevel, TOURNEY_LEVEL_LABELS } from "@/lib/types";
import { TourneySectionTabs } from "../TourneySectionTabs";
import BudgetPLTable from "./BudgetPLTable";
import ApplyCourtFeesButton from "./ApplyCourtFeesButton";

export const dynamic = "force-dynamic";

export default async function BudgetPage(props: PageProps<"/community/padel/tournament/[level]/[tourneyId]/budget">) {
  const { level: levelParam, tourneyId } = await props.params;
  if (!isTourneyLevel(levelParam)) notFound();
  const level = levelParam;

  const tourney = await getTourney(tourneyId);
  if (!tourney || tourney.level !== level) notFound();

  const [lines, format] = await Promise.all([
    getBudgetLines(tourneyId),
    tourney.formatId ? getFormat(tourney.formatId) : Promise.resolve(null),
  ]);
  const income = lines.filter((l) => l.type === "income");
  const outflow = lines.filter((l) => l.type === "outflow");

  return (
    <div className="pb-10">
      <PageHeader title="Budget Sheet" subtitle={`${tourney.name} · ${TOURNEY_LEVEL_LABELS[level]}`} />
      <div className="flex justify-center mb-4">
        <TourneySectionTabs level={level} tourneyId={tourneyId} active="budget" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-6">
        {format && formatHasCourtFeePreset(format) && (
          <ApplyCourtFeesButton level={level} tourneyId={tourneyId} formatName={format.name} />
        )}
        <BudgetPLTable title="Budgeted" mode="budgeted" income={income} outflow={outflow} level={level} tourneyId={tourneyId} />
        <BudgetPLTable title="Actual" mode="actual" income={income} outflow={outflow} level={level} tourneyId={tourneyId} />
      </main>
    </div>
  );
}
