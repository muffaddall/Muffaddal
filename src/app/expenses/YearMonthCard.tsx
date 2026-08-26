import Link from "next/link";
import { formatMoney, formatMonthShort, formatSignedMoney, monthToInputValue } from "@/lib/format";
import type { YearMonth } from "@/lib/expenses";

export default function YearMonthCard({ data }: { data: YearMonth }) {
  const { month, entries, income, total, leftover } = data;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden flex flex-col">
      <Link
        href={`/expenses?month=${monthToInputValue(month)}`}
        className="block bg-[var(--color-post)] text-black font-display text-lg tracking-wide text-center py-1.5 hover:opacity-90 transition-opacity"
      >
        {formatMonthShort(month)}
      </Link>

      <div className="flex-1 px-3 py-2">
        {entries.length === 0 ? (
          <p className="text-xs text-[var(--color-fg-dim)] text-center py-4">No entries</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left text-[var(--color-fg-dim)]">
                <th className="font-medium pb-1 pr-1">Date</th>
                <th className="font-medium pb-1 pr-1">Name</th>
                <th className="font-medium pb-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-0.5 pr-1 text-[var(--color-fg-dim)] whitespace-nowrap">
                    {entry.date_label}
                  </td>
                  <td className="py-0.5 pr-1 truncate max-w-[8rem]">{entry.name}</td>
                  <td className="py-0.5 text-right tabular-nums">{formatMoney(entry.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] px-3 py-2 text-xs flex flex-col gap-0.5">
        <div className="flex justify-between">
          <span className="text-[var(--color-fg-dim)]">Spent</span>
          <span className="tabular-nums">{formatMoney(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-fg-dim)]">Income</span>
          <span className="tabular-nums">{formatMoney(income)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="text-[var(--color-fg-dim)]">Left over</span>
          <span
            className="tabular-nums"
            style={{ color: leftover < 0 ? "var(--color-negative)" : "var(--color-positive)" }}
          >
            {formatSignedMoney(leftover)}
          </span>
        </div>
      </div>
    </div>
  );
}
