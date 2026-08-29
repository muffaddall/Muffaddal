import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getAccounts } from "@/lib/accounts";
import { getAllTransactions } from "@/lib/transactions";
import { computeAccountBalance } from "@/lib/types";
import AddAccountForm from "./AddAccountForm";
import AccountRow from "./AccountRow";

export const dynamic = "force-dynamic";

export default async function DdAccountsPage() {
  const [accounts, transactions] = await Promise.all([
    getAccounts(),
    getAllTransactions(),
  ]);

  return (
    <div className="pb-10">
      <PageHeader title="Accounts" subtitle="Day-to-Day Expenses" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="day-to-day" />
      </div>
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <ul className="flex flex-col gap-2 mb-4">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              balance={computeAccountBalance(transactions, account.id)}
            />
          ))}
          {accounts.length === 0 && (
            <li className="text-sm text-[var(--color-fg-dim)] py-4 text-center">
              No accounts yet.
            </li>
          )}
        </ul>

        <AddAccountForm />
      </main>
    </div>
  );
}
