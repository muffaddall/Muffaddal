import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getAccounts } from "@/lib/accounts";
import { getDdCategories } from "@/lib/ddCategories";
import { buildCategoryTree } from "@/lib/types";
import NewTransactionForm from "./NewTransactionForm";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; account?: string }>;
}) {
  const params = await searchParams;
  const [accounts, expenseCategories, incomeCategories] = await Promise.all([
    getAccounts(),
    getDdCategories("expense"),
    getDdCategories("income"),
  ]);

  const defaultAccountId =
    params.account && accounts.some((a) => a.id === params.account) ? params.account : undefined;
  const backQuery = new URLSearchParams();
  if (params.month) backQuery.set("month", params.month);
  if (defaultAccountId) backQuery.set("account", defaultAccountId);
  const backHref = `/day-to-day${backQuery.size > 0 ? `?${backQuery.toString()}` : ""}`;

  return (
    <div className="pb-10">
      <PageHeader title="Add Transaction" subtitle="Day-to-Day Expenses" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="day-to-day" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-dim)] hover:text-white/80 transition-colors mb-4"
        >
          ← Back to diary
        </Link>
        <NewTransactionForm
          accounts={accounts}
          expenseTree={buildCategoryTree(expenseCategories)}
          incomeTree={buildCategoryTree(incomeCategories)}
          defaultAccountId={defaultAccountId}
        />
      </main>
    </div>
  );
}
