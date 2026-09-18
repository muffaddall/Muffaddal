import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getBudgetLines, getTeamsForTourney, getTourney } from "@/lib/tourneys";
import {
  budgetLineActualTotal,
  budgetLineBudgetedTotal,
  isTourneyLevel,
  registrationsActualTotal,
  registrationsBudgetedTotal,
  TOURNEY_LEVEL_LABELS,
} from "@/lib/types";
import { TourneySectionTabs } from "../../TourneySectionTabs";
import { BudgetSectionTabs } from "../BudgetSectionTabs";
import BudgetTypeTable from "../BudgetTypeTable";
import ProfitAndLossTable from "../ProfitAndLossTable";
import RegistrationsSection from "./RegistrationsSection";

export const dynamic = "force-dynamic";

export default async function BudgetIncomePage(
  props: PageProps<"/community/padel/tournament/[level]/[tourneyId]/budget/income">
) {
  const { level: levelParam, tourneyId } = await props.params;
  if (!isTourneyLevel(levelParam)) notFound();
  const level = levelParam;

  const tourney = await getTourney(tourneyId);
  if (!tourney || tourney.level !== level) notFound();

  const [lines, teams] = await Promise.all([getBudgetLines(tourneyId), getTeamsForTourney(tourneyId)]);
  const income = lines.filter((l) => l.type === "income");
  const outflow = lines.filter((l) => l.type === "outflow");
  const registrationsBudgeted = registrationsBudgetedTotal(teams);
  const registrationsActual = registrationsActualTotal(teams);
  const incomeBudgeted = registrationsBudgeted + income.reduce((s, l) => s + budgetLineBudgetedTotal(l), 0);
  const incomeActual = registrationsActual + income.reduce((s, l) => s + budgetLineActualTotal(l), 0);
  const outflowBudgeted = outflow.reduce((s, l) => s + budgetLineBudgetedTotal(l), 0);
  const outflowActual = outflow.reduce((s, l) => s + budgetLineActualTotal(l), 0);

  return (
    <div className="pb-10">
      <PageHeader title="Budget Sheet" subtitle={`${tourney.name} · ${TOURNEY_LEVEL_LABELS[level]}`} />
      <div className="flex justify-center mb-4">
        <TourneySectionTabs level={level} tourneyId={tourneyId} active="budget" />
      </div>
      <div className="flex justify-center mb-4">
        <BudgetSectionTabs level={level} tourneyId={tourneyId} active="income" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-4">
        <RegistrationsSection level={level} tourneyId={tourneyId} teams={teams} />
        <BudgetTypeTable
          title="Budgeted"
          mode="budgeted"
          type="income"
          lines={income}
          level={level}
          tourneyId={tourneyId}
          extraLabel="Team Registrations"
          extraBudgeted={registrationsBudgeted}
          extraActual={registrationsActual}
        />
        <BudgetTypeTable
          title="Actual"
          mode="actual"
          type="income"
          lines={income}
          level={level}
          tourneyId={tourneyId}
          extraLabel="Team Registrations"
          extraBudgeted={registrationsBudgeted}
          extraActual={registrationsActual}
        />
        <ProfitAndLossTable
          incomeBudgeted={incomeBudgeted}
          incomeActual={incomeActual}
          outflowBudgeted={outflowBudgeted}
          outflowActual={outflowActual}
        />
      </main>
    </div>
  );
}
