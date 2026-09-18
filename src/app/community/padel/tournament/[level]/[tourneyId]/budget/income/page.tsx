import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getBudgetLines, getTeamsForTourney, getTourney } from "@/lib/tourneys";
import { isTourneyLevel, registrationsActualTotal, registrationsBudgetedTotal, TOURNEY_LEVEL_LABELS } from "@/lib/types";
import { TourneySectionTabs } from "../../TourneySectionTabs";
import { BudgetSectionTabs } from "../BudgetSectionTabs";
import BudgetTypeTable from "../BudgetTypeTable";
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
  const registrationsBudgeted = registrationsBudgetedTotal(teams);
  const registrationsActual = registrationsActualTotal(teams);

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
      </main>
    </div>
  );
}
