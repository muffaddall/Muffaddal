import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getExpensesForMonth, getIncomeForMonth, totalForMonth } from "@/lib/expenses";
import { currentMonth, formatMoney, formatSignedMoney, inputValueToMonth } from "@/lib/format";
import MonthNav from "./MonthNav";
import IncomeEditor from "./IncomeEditor";
import AddExpenseForm from "./AddExpenseForm";
import ExpenseRow from "./ExpenseRow";
import CopyPreviousMonthButton from "./CopyPreviousMonthButton";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = params.month ? inputValueToMonth(params.month) : currentMonth();

  const [entries, income] = await Promise.all([
    getExpensesForMonth(month),
    getIncomeForMonth(month),
  ]);

  const total = totalForMonth(entries);
  const leftover = income - total;

  return (
    <div className="pb-10">
      <PageHeader
        title="Planned Expenses"
        right={
          <Link
            href={`/expenses/year?year=${month.slice(0, 4)}`}
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <MonthNav month={month} />
          <IncomeEditor month={month} income={income} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Income
            </p>
            <p className="font-display text-2xl">{formatMoney(income)}</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Spent
            </p>
            <p className="font-display text-2xl">{formatMoney(total)}</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
              Left over
            </p>
            <p
              className="font-display text-2xl"
              style={{ color: leftover < 0 ? "var(--color-negative)" : "var(--color-positive)" }}
            >
              {formatSignedMoney(leftover)}
            </p>
          </div>
        </div>

        <div className="flex justify-end mb-3">
          <CopyPreviousMonthButton month={month} />
        </div>

        <ul className="flex flex-col gap-1 mb-4">
          {entries.map((entry) => (
            <ExpenseRow key={entry.id} entry={entry} />
          ))}
          {entries.length === 0 && (
            <li className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
              No expenses logged for this month yet.
            </li>
          )}
        </ul>

        <AddExpenseForm month={month} />
      </main>
    </div>
  );
}
