import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getAccount, getAccounts } from "@/lib/accounts";
import { getTransactionsForAccount } from "@/lib/transactions";
import { getAllDdCategories } from "@/lib/ddCategories";
import { getReconciledAccountBalance } from "@/lib/accountBalance";
import { topLevelCategoryId } from "@/lib/types";
import { currentMonth, formatMoney } from "@/lib/format";
import TransactionRow from "../../TransactionRow";
import CategoryPieChart from "@/components/CategoryPieChart";

export const dynamic = "force-dynamic";

export default async function AccountDetailPage(
  props: PageProps<"/day-to-day/accounts/[id]">
) {
  const { id } = await props.params;

  const [account, accounts, transactions, categories, balance] = await Promise.all([
    getAccount(id),
    getAccounts(),
    getTransactionsForAccount(id),
    getAllDdCategories(),
    getReconciledAccountBalance(id),
  ]);
  if (!account) notFound();

  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  const monthPrefix = currentMonth().slice(0, 7);

  function pieDataFor(type: "expense" | "income") {
    const byTopCategory = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type !== type || tx.accountId !== id || tx.date.slice(0, 7) !== monthPrefix) continue;
      if (!tx.categoryId) continue;
      const topId = topLevelCategoryId(tx.categoryId, categoriesById);
      if (!topId) continue;
      byTopCategory.set(topId, (byTopCategory.get(topId) ?? 0) + tx.amount);
    }
    return Array.from(byTopCategory.entries())
      .map(([catId, amount]) => ({ label: categoriesById.get(catId)?.name ?? "Other", value: amount }))
      .sort((a, b) => b.value - a.value);
  }

  const expensePieData = pieDataFor("expense");
  const incomePieData = pieDataFor("income");

  return (
    <div className="pb-10">
      <PageHeader title={account.name} subtitle="Day-to-Day Expenses" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="day-to-day" />
      </div>
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          href="/day-to-day/accounts"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-dim)] hover:text-white/80 transition-colors mb-4"
        >
          ← Back to Accounts
        </Link>

        <div className="mb-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
          <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
            Balance
          </p>
          <p
            className="font-display text-4xl"
            style={{ color: balance < 0 ? "var(--color-negative)" : undefined }}
          >
            {formatMoney(balance, account.currency)}
          </p>
        </div>

        {expensePieData.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
              This month&apos;s spending by category
            </h2>
            <CategoryPieChart data={expensePieData} currency={account.currency} />
          </section>
        )}

        {incomePieData.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
              This month&apos;s income by category
            </h2>
            <CategoryPieChart data={incomePieData} currency={account.currency} />
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
            Transactions
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="text-left text-xs text-[var(--color-fg-dim)]">
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Type</th>
                  <th className="pb-2 pr-3 font-medium">Category / To</th>
                  <th className="pb-2 pr-3 font-medium">Note</th>
                  <th className="pb-2 pr-3 font-medium text-right">Amount</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    accountsById={accountsById}
                    categoriesById={categoriesById}
                    perspectiveAccountId={id}
                  />
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-[var(--color-fg-dim)]">
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
