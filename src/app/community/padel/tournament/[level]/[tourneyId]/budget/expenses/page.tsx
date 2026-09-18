import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getBudgetLines, getFormat, getTeamsForTourney, getTourney } from "@/lib/tourneys";
import { budgetLineTotal, formatHasCourtFeePreset, isTourneyLevel, registrationsTotal, TOURNEY_LEVEL_LABELS } from "@/lib/types";
import { TourneySectionTabs } from "../../TourneySectionTabs";
import { BudgetSectionTabs } from "../BudgetSectionTabs";
import BudgetTypeTable from "../BudgetTypeTable";
import ProfitAndLossTable from "../ProfitAndLossTable";
import ApplyCourtFeesButton from "../ApplyCourtFeesButton";

export const dynamic = "force-dynamic";

export default async function BudgetExpensesPage(
  props: PageProps<"/community/padel/tournament/[level]/[tourneyId]/budget/expenses">
) {
  const { level: levelParam, tourneyId } = await props.params;
  if (!isTourneyLevel(levelParam)) notFound();
  const level = levelParam;

  const tourney = await getTourney(tourneyId);
  if (!tourney || tourney.level !== level) notFound();

  const [lines, format, teams] = await Promise.all([
    getBudgetLines(tourneyId),
    tourney.formatId ? getFormat(tourney.formatId) : Promise.resolve(null),
    getTeamsForTourney(tourneyId),
  ]);
  const income = lines.filter((l) => l.type === "income");
  const outflow = lines.filter((l) => l.type === "outflow");
  const incomeTotal = registrationsTotal(teams) + income.reduce((s, l) => s + budgetLineTotal(l), 0);
  const outflowTotal = outflow.reduce((s, l) => s + budgetLineTotal(l), 0);

  return (
    <div className="pb-10">
      <PageHeader title="Budget Sheet" subtitle={`${tourney.name} · ${TOURNEY_LEVEL_LABELS[level]}`} />
      <div className="flex justify-center mb-4">
        <TourneySectionTabs level={level} tourneyId={tourneyId} active="budget" />
      </div>
      <div className="flex justify-center mb-4">
        <BudgetSectionTabs level={level} tourneyId={tourneyId} active="expenses" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-4">
        {format && formatHasCourtFeePreset(format) && (
          <ApplyCourtFeesButton level={level} tourneyId={tourneyId} formatName={format.name} />
        )}
        <BudgetTypeTable type="outflow" lines={outflow} level={level} tourneyId={tourneyId} />
        <ProfitAndLossTable income={incomeTotal} outflow={outflowTotal} />
      </main>
    </div>
  );
}
