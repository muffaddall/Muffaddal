import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getExpensesForYear } from "@/lib/expenses";
import YearMonthCard from "../YearMonthCard";

export const dynamic = "force-dynamic";

export default async function ExpensesYearPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = Number(params.year) || new Date().getUTCFullYear();
  const months = await getExpensesForYear(year);

  return (
    <div className="pb-10">
      <PageHeader
        title={String(year)}
        subtitle="Planned Expenses"
        right={
          <Link
            href={`/expenses`}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
          >
            Month view
          </Link>
        }
      />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="expenses" />
      </div>

      <div className="flex items-center justify-center gap-3 mb-6">
        <Link
          href={`/expenses/year?year=${year - 1}`}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
        >
          ← {year - 1}
        </Link>
        <Link
          href={`/expenses/year?year=${year + 1}`}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
        >
          {year + 1} →
        </Link>
      </div>

      <div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {months.map((data) => (
          <YearMonthCard key={data.month} data={data} />
        ))}
      </div>
    </div>
  );
}
