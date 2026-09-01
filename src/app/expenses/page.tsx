import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import AccountQuickTabs from "@/components/AccountQuickTabs";
import { getAccounts } from "@/lib/accounts";
import {
  getDefaultIncome,
  getExpensesForMonth,
  getIncomeForMonth,
  totalForMonth,
  totalPaidForMonth,
} from "@/lib/expenses";
import type { ExpenseEntry } from "@/lib/types";
import {
  currentMonth,
  formatMoney,
  formatSignedMoney,
  inputValueToMonth,
  monthToInputValue,
} from "@/lib/format";
import MonthNav from "./MonthNav";
import IncomeEditor from "./IncomeEditor";
import DefaultIncomeEditor from "./DefaultIncomeEditor";
import AddExpenseForm from "./AddExpenseForm";
import ExpenseRow from "./ExpenseRow";
import CopyPreviousMonthButton from "./CopyPreviousMonthButton";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; account?: string }>;
}) {
  const params = await searchParams;
  const month = params.month ? inputValueToMonth(params.month) : currentMonth();
  const monthInputValue = monthToInputValue(month);

  const accounts = await getAccounts();
  const selectedAccountId =
    params.account && accounts.some((a) => a.id === params.account)
      ? params.account
      : (accounts[0]?.id ?? null);
  const selectedAccount = selectedAccountId
    ? (accounts.find((a) => a.id === selectedAccountId) ?? null)
    : null;

  const [entries, income, defaultIncome]: [ExpenseEntry[], number, number] = selectedAccountId
    ? await Promise.all([
        getExpensesForMonth(month, selectedAccountId),
        getIncomeForMonth(month, selectedAccountId),
        getDefaultIncome(selectedAccountId),
      ])
    : [[], 0, 0];

  const total = totalForMonth(entries);
  const leftover = income - total;
  const paidTotal = totalPaidForMonth(entries);

  return (
    <div className="pb-10">
      <PageHeader
        title="Planned Expenses"
        right={
          <Link
            href={`/expenses/year?year=${month.slice(0, 4)}${
              selectedAccountId ? `&account=${selectedAccountId}` : ""
            }`}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
          >
            Year view
          </Link>
        }
      />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="expenses" />
      </div>
      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex justify-center mb-4">
          <AccountQuickTabs
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            basePath="/expenses"
            extraQuery={`month=${monthInputValue}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <MonthNav month={month} accountId={selectedAccountId} />
          {selectedAccountId && (
            <IncomeEditor month={month} accountId={selectedAccountId} income={income} />
          )}
        </div>
        {selectedAccountId && (
          <div className="flex justify-end mb-6">
            <DefaultIncomeEditor accountId={selectedAccountId} defaultIncome={defaultIncome} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3 sm:grid-cols-4">
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Income
            </p>
            <p className="font-display text-2xl">{formatMoney(income, selectedAccount?.currency)}</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Spent
            </p>
            <p className="font-display text-2xl">{formatMoney(total, selectedAccount?.currency)}</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Left over
            </p>
            <p
              className="font-display text-2xl"
              style={{ color: leftover < 0 ? "var(--color-negative)" : "var(--color-positive)" }}
            >
              {formatSignedMoney(leftover, selectedAccount?.currency)}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Paid so far
            </p>
            <p className="font-display text-2xl">{formatMoney(paidTotal, selectedAccount?.currency)}</p>
          </div>
        </div>
        <p className="text-xs text-[var(--color-fg-dim)] mb-6">
          Tick a planned expense off as &quot;Paid&quot; once it&apos;s actually left your account — that
          feeds the Actual Balance on the Day-to-Day page.
        </p>

        {selectedAccountId && (
          <div className="flex justify-end mb-3">
            <CopyPreviousMonthButton month={month} accountId={selectedAccountId} />
          </div>
        )}

        <ul className="flex flex-col gap-1 mb-4">
          {entries.map((entry) => (
            <ExpenseRow key={entry.id} entry={entry} currency={selectedAccount?.currency} />
          ))}
          {entries.length === 0 && (
            <li className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
              No expenses logged for {selectedAccount?.name ?? "this account"} this month yet.
            </li>
          )}
        </ul>

        {selectedAccountId && <AddExpenseForm month={month} accountId={selectedAccountId} />}
      </main>
    </div>
  );
}
