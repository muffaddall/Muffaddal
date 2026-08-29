"use client";

import { useTransition } from "react";
import { removeTransaction } from "./transactionActions";
import { formatMoney } from "@/lib/format";
import {
  categoryPath,
  type Account,
  type Currency,
  type DdCategory,
  type Transaction,
} from "@/lib/types";

/**
 * Renders one transaction row. When `perspectiveAccountId` is set (on an
 * account's own page) the sign and detail are relative to that account —
 * a transfer out shows red/"→ UK", a transfer in shows green/"← UAE".
 * Without it (the all-accounts diary) transfers show neutral with both
 * account names.
 */
export default function TransactionRow({
  tx,
  accountsById,
  categoriesById,
  perspectiveAccountId,
}: {
  tx: Transaction;
  accountsById: Map<string, Account>;
  categoriesById: Map<string, DdCategory>;
  perspectiveAccountId?: string;
}) {
  const [isDeleting, startDelete] = useTransition();

  const accountIds = tx.toAccountId ? [tx.accountId, tx.toAccountId] : [tx.accountId];
  const currency: Currency = accountsById.get(tx.accountId)?.currency ?? "AED";

  let detail: string;
  let sign: "+" | "-" | "";
  let color: string;

  if (tx.type === "transfer") {
    const fromName = accountsById.get(tx.accountId)?.name ?? "?";
    const toName = accountsById.get(tx.toAccountId ?? "")?.name ?? "?";
    if (perspectiveAccountId === tx.toAccountId) {
      detail = `← ${fromName}`;
      sign = "+";
      color = "var(--color-positive)";
    } else if (perspectiveAccountId === tx.accountId) {
      detail = `→ ${toName}`;
      sign = "-";
      color = "var(--color-negative)";
    } else {
      detail = `${fromName} → ${toName}`;
      sign = "";
      color = "var(--color-fg-dim)";
    }
  } else {
    detail = categoryPath(tx.categoryId, categoriesById);
    sign = tx.type === "income" ? "+" : "-";
    color = tx.type === "income" ? "var(--color-positive)" : "var(--color-negative)";
  }

  return (
    <tr className="border-t border-[var(--color-border)] text-sm">
      <td className="py-2 pr-3 whitespace-nowrap">{tx.date}</td>
      <td className="py-2 pr-3 capitalize">{tx.type}</td>
      <td className="py-2 pr-3">{detail}</td>
      <td className="py-2 pr-3 text-[var(--color-fg-dim)] max-w-[10rem] truncate">
        {tx.note || "—"}
      </td>
      <td className="py-2 pr-3 text-right tabular-nums font-medium" style={{ color }}>
        {sign}
        {formatMoney(tx.amount, currency)}
      </td>
      <td className="py-2 text-right">
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeTransaction(tx.id, accountIds))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </td>
    </tr>
  );
}
