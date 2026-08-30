import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getAccounts } from "@/lib/accounts";
import { getReconciledAccountBalance } from "@/lib/accountBalance";
import AddAccountForm from "./AddAccountForm";
import AccountRow from "./AccountRow";

export const dynamic = "force-dynamic";

export default async function DdAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; account?: string }>;
}) {
  const params = await searchParams;
  const accounts = await getAccounts();
  const balances = await Promise.all(
    accounts.map((account) => getReconciledAccountBalance(account.id))
  );

  const backQuery = new URLSearchParams();
  if (params.month) backQuery.set("month", params.month);
  if (params.account) backQuery.set("account", params.account);
  const backHref = `/day-to-day${backQuery.size > 0 ? `?${backQuery.toString()}` : ""}`;

  return (
    <div className="pb-10">
      <PageHeader title="Accounts" subtitle="Day-to-Day Expenses" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="day-to-day" />
      </div>
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-dim)] hover:text-white/80 transition-colors mb-4"
        >
          ← Back to Day-to-Day
        </Link>

        <ul className="flex flex-col gap-2 mb-4">
          {accounts.map((account, i) => (
            <AccountRow key={account.id} account={account} balance={balances[i]} />
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
