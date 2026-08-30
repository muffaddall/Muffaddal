import Link from "next/link";
import { addMonths, formatMonth, monthToInputValue } from "@/lib/format";

export default function MonthNav({
  month,
  accountId,
}: {
  month: string;
  accountId: string | null;
}) {
  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);
  const accountQuery = accountId ? `&account=${accountId}` : "";

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/expenses?month=${monthToInputValue(prev)}${accountQuery}`}
        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
        aria-label="Previous month"
      >
        ←
      </Link>
      <span className="font-display text-2xl min-w-[12ch] text-center">
        {formatMonth(month)}
      </span>
      <Link
        href={`/expenses?month=${monthToInputValue(next)}${accountQuery}`}
        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
        aria-label="Next month"
      >
        →
      </Link>
    </div>
  );
}
