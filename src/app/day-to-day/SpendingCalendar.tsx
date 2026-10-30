import { MaskedAmount } from "@/components/AmountVisibility";
import { formatMoney } from "@/lib/format";
import type { Currency } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Short amount that fits a phone-width calendar cell: 85, 640, 1.2k, 12k. */
function compactAmount(value: number): string {
  if (value >= 10000) return `${Math.round(value / 1000)}k`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(Math.round(value));
}

/**
 * Month grid (Monday-start, like the rest of the app) showing what was
 * spent on each day — every logged expense dated that day, cleared or
 * still pending. Days are shaded by how big that day's spend was relative
 * to the month's biggest day, so heavy days stand out at a glance.
 */
export default function SpendingCalendar({
  monthStart,
  monthEnd,
  spentByDate,
  today,
  currency,
}: {
  monthStart: string; // "yyyy-mm-01"
  monthEnd: string; // "yyyy-mm-dd", last day
  spentByDate: Map<string, number>;
  today: string;
  currency: Currency;
}) {
  const [y, m] = monthStart.split("-").map(Number);
  const daysInMonth = Number(monthEnd.slice(8, 10));
  const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7; // 0 = Monday
  const maxSpent = Math.max(0, ...spentByDate.values());
  const monthPrefix = monthStart.slice(0, 8);

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${monthPrefix}${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <p key={d} className="text-[10px] text-center text-[var(--color-fg-dim)]">
            {d}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const spent = spentByDate.get(date) ?? 0;
          const intensity = maxSpent > 0 ? spent / maxSpent : 0;
          const isToday = date === today;
          return (
            <div
              key={date}
              className="rounded-lg min-h-14 p-1 flex flex-col items-center justify-between"
              style={{
                background: spent > 0 ? `rgba(255, 107, 107, ${0.08 + intensity * 0.32})` : "rgba(255,255,255,0.03)",
                border: `1px solid ${isToday ? "var(--color-accent)" : "var(--color-border)"}`,
              }}
            >
              <span className={`text-[11px] ${isToday ? "font-semibold" : "text-[var(--color-fg-dim)]"}`}>
                {Number(date.slice(8, 10))}
              </span>
              {spent > 0 && (
                <MaskedAmount id={`calendar-${date}`} hideToggle className="text-[11px] font-semibold tabular-nums">
                  {compactAmount(spent)}
                </MaskedAmount>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-[var(--color-fg-dim)] mt-2 text-center">
        Amounts in {currency} · biggest day{" "}
        <MaskedAmount id="calendar-max" hideToggle>
          {formatMoney(maxSpent, currency)}
        </MaskedAmount>
      </p>
    </div>
  );
}
