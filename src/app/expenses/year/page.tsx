import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import AccountQuickTabs from "@/components/AccountQuickTabs";
import { getAccounts } from "@/lib/accounts";
import { getExpensesForYear } from "@/lib/expenses";
import YearMonthCard from "../YearMonthCard";

export const dynamic = "force-dynamic";

export default async function ExpensesYearPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; account?: string }>;
}) {
  const params = await searchParams;
  const year = Number(params.year) || new Date().getUTCFullYear();

  const accounts = await getAccounts();
  const selectedAccountId =
    params.account && accounts.some((a) => a.id === params.account)
      ? params.account
      : (accounts[0]?.id ?? null);
  const selectedAccount = selectedAccountId
    ? (accounts.find((a) => a.id === selectedAccountId) ?? null)
    : null;

  const months = selectedAccountId ? await getExpensesForYear(year, selectedAccountId) : [];
  const accountQuery = selectedAccountId ? `&account=${selectedAccountId}` : "";

  return (
    <div className="pb-10">
      <PageHeader
        title={String(year)}
        subtitle="Planned Expenses"
        right={
          <Link
            href={`/expenses${selectedAccountId ? `?account=${selectedAccountId}` : ""}`}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
          >
            Month view
          </Link>
        }
      />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="expenses" />
      </div>

      <div className="flex justify-center mb-4">
        <AccountQuickTabs
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          basePath="/expenses/year"
          extraQuery={`year=${year}`}
        />
      </div>

      <div className="flex items-center justify-center gap-3 mb-6">
        <Link
          href={`/expenses/year?year=${year - 1}${accountQuery}`}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
        >
          ← {year - 1}
        </Link>
        <Link
          href={`/expenses/year?year=${year + 1}${accountQuery}`}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
        >
          {year + 1} →
        </Link>
      </div>

      <div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {months.map((data) => (
          <YearMonthCard
            key={data.month}
            data={data}
            accountId={selectedAccountId}
            currency={selectedAccount?.currency}
          />
        ))}
      </div>
    </div>
  );
}
