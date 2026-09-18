import { formatMoney, formatSignedMoney } from "@/lib/format";

/** Combined Income vs Expenses vs Net summary — sits at the bottom of both the Income and Expenses pages so either tab shows the full picture, not just its own half. */
export default function ProfitAndLossTable({
  incomeBudgeted,
  incomeActual,
  outflowBudgeted,
  outflowActual,
}: {
  incomeBudgeted: number;
  incomeActual: number;
  outflowBudgeted: number;
  outflowActual: number;
}) {
  const netBudgeted = incomeBudgeted - outflowBudgeted;
  const netActual = incomeActual - outflowActual;

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4">
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
        Profit &amp; Loss
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-white/40">
            <th className="text-left font-normal pb-1">Line</th>
            <th className="text-right font-normal pb-1 px-1">Budgeted</th>
            <th className="text-right font-normal pb-1 pl-1">Actual</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1">Income</td>
            <td className="py-1 px-1 text-right tabular-nums" style={{ color: "var(--color-positive)" }}>
              {formatMoney(incomeBudgeted)}
            </td>
            <td className="py-1 pl-1 text-right tabular-nums" style={{ color: "var(--color-positive)" }}>
              {formatMoney(incomeActual)}
            </td>
          </tr>
          <tr>
            <td className="py-1">Expenses</td>
            <td className="py-1 px-1 text-right tabular-nums" style={{ color: "var(--color-negative)" }}>
              {formatMoney(outflowBudgeted)}
            </td>
            <td className="py-1 pl-1 text-right tabular-nums" style={{ color: "var(--color-negative)" }}>
              {formatMoney(outflowActual)}
            </td>
          </tr>
          <tr className="font-bold border-t-2 border-white/20">
            <td className="pt-2">Net</td>
            <td
              className="pt-2 px-1 text-right tabular-nums"
              style={{ color: netBudgeted >= 0 ? "var(--color-positive)" : "var(--color-negative)" }}
            >
              {formatSignedMoney(netBudgeted)}
            </td>
            <td
              className="pt-2 pl-1 text-right tabular-nums"
              style={{ color: netActual >= 0 ? "var(--color-positive)" : "var(--color-negative)" }}
            >
              {formatSignedMoney(netActual)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
