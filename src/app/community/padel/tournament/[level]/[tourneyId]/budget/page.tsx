import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getBudgetLines, getTourney } from "@/lib/tourneys";
import { isTourneyLevel, TOURNEY_LEVEL_LABELS } from "@/lib/types";
import BudgetPLTable from "./BudgetPLTable";

export const dynamic = "force-dynamic";

export default async function BudgetPage(props: PageProps<"/community/padel/tournament/[level]/[tourneyId]/budget">) {
  const { level: levelParam, tourneyId } = await props.params;
  if (!isTourneyLevel(levelParam)) notFound();
  const level = levelParam;

  const tourney = await getTourney(tourneyId);
  if (!tourney || tourney.level !== level) notFound();

  const lines = await getBudgetLines(tourneyId);
  const income = lines.filter((l) => l.type === "income");
  const outflow = lines.filter((l) => l.type === "outflow");

  return (
    <div className="pb-10">
      <PageHeader title="Budget Sheet" subtitle={`${tourney.name} · ${TOURNEY_LEVEL_LABELS[level]}`} />
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-6">
        <BudgetPLTable title="Budgeted" mode="budgeted" income={income} outflow={outflow} level={level} tourneyId={tourneyId} />
        <BudgetPLTable title="Actual" mode="actual" income={income} outflow={outflow} level={level} tourneyId={tourneyId} />
      </main>
    </div>
  );
}
