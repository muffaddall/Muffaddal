import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getAccounts } from "@/lib/accounts";
import { getDdCategories } from "@/lib/ddCategories";
import { getTransaction } from "@/lib/transactions";
import { buildCategoryTree } from "@/lib/types";
import NewTransactionForm from "../../new/NewTransactionForm";

export const dynamic = "force-dynamic";

export default async function EditTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; account?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;

  const [transaction, accounts, expenseCategories, incomeCategories] = await Promise.all([
    getTransaction(id),
    getAccounts(),
    getDdCategories("expense"),
    getDdCategories("income"),
  ]);
  if (!transaction) notFound();

  const backQuery = new URLSearchParams();
  if (search.month) backQuery.set("month", search.month);
  if (search.account) backQuery.set("account", search.account);
  const backHref = `/day-to-day${backQuery.size > 0 ? `?${backQuery.toString()}` : ""}`;

  return (
    <div className="pb-10">
      <PageHeader title="Edit Transaction" subtitle="Day-to-Day Expenses" />
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
          transaction={transaction}
          backHref={backHref}
        />
      </main>
    </div>
  );
}
