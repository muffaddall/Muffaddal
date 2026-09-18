import { redirect } from "next/navigation";

export default async function BudgetPage(props: PageProps<"/community/padel/tournament/[level]/[tourneyId]/budget">) {
  const { level, tourneyId } = await props.params;
  redirect(`/community/padel/tournament/${level}/${tourneyId}/budget/income`);
}
