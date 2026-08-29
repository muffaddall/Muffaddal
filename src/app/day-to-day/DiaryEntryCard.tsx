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

export default function DiaryEntryCard({
  tx,
  accountsById,
  categoriesById,
}: {
  tx: Transaction;
  accountsById: Map<string, Account>;
  categoriesById: Map<string, DdCategory>;
}) {
  const [isDeleting, startDelete] = useTransition();
  const account = accountsById.get(tx.accountId);
  const currency: Currency = account?.currency ?? "AED";

  let detail: string;
  let sign: string;
  let color: string;

  if (tx.type === "transfer") {
    const toName = accountsById.get(tx.toAccountId ?? "")?.name ?? "?";
    detail = `${account?.name ?? "?"} → ${toName}`;
    sign = "";
    color = "var(--color-fg-dim)";
  } else {
    detail = `${categoryPath(tx.categoryId, categoriesById)} · ${account?.name ?? "?"}`;
    sign = tx.type === "income" ? "+" : "-";
    color = tx.type === "income" ? "var(--color-positive)" : "var(--color-negative)";
  }

  const accountIds = tx.toAccountId ? [tx.accountId, tx.toAccountId] : [tx.accountId];

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate capitalize">{tx.type}</p>
        <p className="text-xs text-[var(--color-fg-dim)] truncate">
          {detail}
          {tx.note ? ` — ${tx.note}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold tabular-nums" style={{ color }}>
          {sign}
          {formatMoney(tx.amount, currency)}
        </span>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeTransaction(tx.id, accountIds))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
