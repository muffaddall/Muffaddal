import type { WeightLog } from "@/lib/types";
import { formatDateShort } from "@/lib/date";

export default function WeightChart({ logs }: { logs: WeightLog[] }) {
  const width = 640;
  const height = 220;
  const padding = 36;

  const weights = logs.map((l) => l.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const points = logs.map((log, i) => {
    const x =
      padding + (i / Math.max(logs.length - 1, 1)) * (width - padding * 2);
    const y =
      height - padding - ((log.weight - min) / range) * (height - padding * 2);
    return { x, y, log };
  });

  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 500 }}>
        <text x={padding} y={16} fontSize={11} fill="var(--color-fg-dim)">
          {max} kg
        </text>
        <text x={padding} y={height - padding + 18} fontSize={11} fill="var(--color-fg-dim)">
          {min} kg
        </text>
        <polyline
          points={points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--color-accent)">
            <title>{`${formatDateShort(p.log.date)} — ${p.log.weight} kg`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
