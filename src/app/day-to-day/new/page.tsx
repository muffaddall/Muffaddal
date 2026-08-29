import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getAccounts } from "@/lib/accounts";
import { getDdCategories } from "@/lib/ddCategories";
import { buildCategoryTree } from "@/lib/types";
import NewTransactionForm from "./NewTransactionForm";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const [accounts, expenseCategories, incomeCategories] = await Promise.all([
    getAccounts(),
    getDdCategories("expense"),
    getDdCategories("income"),
  ]);

  return (
    <div className="pb-10">
      <PageHeader title="Add Transaction" subtitle="Day-to-Day Expenses" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="day-to-day" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6">
        <NewTransactionForm
          accounts={accounts}
          expenseTree={buildCategoryTree(expenseCategories)}
          incomeTree={buildCategoryTree(incomeCategories)}
        />
      </main>
    </div>
  );
}
