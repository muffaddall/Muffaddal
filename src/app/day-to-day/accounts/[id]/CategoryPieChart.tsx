import { formatMoney } from "@/lib/format";
import type { Currency } from "@/lib/types";

const COLORS = [
  "#818cf8",
  "#34d399",
  "#f472b6",
  "#fbbf24",
  "#60a5fa",
  "#a78bfa",
  "#fb7185",
  "#4ad9ff",
  "#ff6b4a",
  "#94a3b8",
];

export default function CategoryPieChart({
  data,
  currency,
}: {
  data: { label: string; value: number }[];
  currency: Currency;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return null;

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  const fractions = data.map((d) => d.value / total);
  const cumulativeStarts = fractions.reduce<number[]>((acc, fraction, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + fractions[i - 1]);
    return acc;
  }, []);

  const slices = data.map((d, i) => {
    const fraction = fractions[i];
    const startAngle = cumulativeStarts[i] * 2 * Math.PI - Math.PI / 2;
    const endAngle = (cumulativeStarts[i] + fraction) * 2 * Math.PI - Math.PI / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;

    const path =
      fraction >= 0.999
        ? undefined
        : `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

    return { ...d, path, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex flex-col sm:flex-row items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {slices.map((s, i) =>
          s.path ? (
            <path key={i} d={s.path} fill={s.color} />
          ) : (
            <circle key={i} cx={cx} cy={cy} r={r} fill={s.color} />
          )
        )}
      </svg>
      <div className="flex flex-col gap-1.5 text-xs min-w-0 w-full">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            <span className="truncate">{s.label}</span>
            <span className="ml-auto text-white/80 tabular-nums shrink-0">
              {formatMoney(s.value, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
