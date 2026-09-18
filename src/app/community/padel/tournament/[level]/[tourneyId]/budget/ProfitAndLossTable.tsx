import { formatMoney, formatSignedMoney } from "@/lib/format";

/** Combined Income vs Expenses vs Net summary — sits at the bottom of both the Income and Expenses pages so either tab shows the full picture, not just its own half. */
export default function ProfitAndLossTable({
  income,
  outflow,
}: {
  income: number;
  outflow: number;
}) {
  const net = income - outflow;

  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4">
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-community)" }}>
        Profit &amp; Loss
      </h2>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="py-1">Income</td>
            <td className="py-1 text-right tabular-nums" style={{ color: "var(--color-positive)" }}>
              {formatMoney(income)}
            </td>
          </tr>
          <tr>
            <td className="py-1">Expenses</td>
            <td className="py-1 text-right tabular-nums" style={{ color: "var(--color-negative)" }}>
              {formatMoney(outflow)}
            </td>
          </tr>
          <tr className="font-bold border-t-2 border-white/20">
            <td className="pt-2">Net</td>
            <td
              className="pt-2 text-right tabular-nums"
              style={{ color: net >= 0 ? "var(--color-positive)" : "var(--color-negative)" }}
            >
              {formatSignedMoney(net)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
