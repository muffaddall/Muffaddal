"use client";

import Link from "next/link";
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
  perspectiveAccountId,
  month,
  outstandingOwed = 0,
}: {
  tx: Transaction;
  accountsById: Map<string, Account>;
  categoriesById: Map<string, DdCategory>;
  perspectiveAccountId?: string;
  /** "yyyy-mm" input value, carried into the edit page's back link. */
  month?: string;
  /** Sum of this expense's still-outstanding "People Owe Me" splits. */
  outstandingOwed?: number;
}) {
  const [isDeleting, startDelete] = useTransition();
  const account = accountsById.get(tx.accountId);
  const toAccount = accountsById.get(tx.toAccountId ?? "");
  const currency: Currency = account?.currency ?? "AED";

  let detail: string;
  let sign: string;
  let color: string;
  let displayAmount = tx.amount;
  let displayCurrency = currency;

  if (tx.type === "transfer") {
    const fromName = account?.name ?? "?";
    const toName = toAccount?.name ?? "?";
    if (perspectiveAccountId === tx.toAccountId) {
      detail = `← ${fromName}`;
      sign = "+";
      color = "var(--color-positive)";
      // A cross-currency transfer lands as the converted amount, in the
      // destination account's own currency — not the amount that left
      // the source account.
      displayAmount = tx.toAmount ?? tx.amount;
      displayCurrency = toAccount?.currency ?? currency;
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
    detail = `${categoryPath(tx.categoryId, categoriesById)} · ${account?.name ?? "?"}`;
    sign = tx.type === "income" ? "+" : "-";
    color = tx.type === "income" ? "var(--color-positive)" : "var(--color-negative)";
  }

  const accountIds = tx.toAccountId ? [tx.accountId, tx.toAccountId] : [tx.accountId];

  const editHref = `/day-to-day/edit/${tx.id}${
    month || perspectiveAccountId
      ? `?${new URLSearchParams({
          ...(month ? { month } : {}),
          ...(perspectiveAccountId ? { account: perspectiveAccountId } : {}),
        }).toString()}`
      : ""
  }`;

  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
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
            {formatMoney(displayAmount, displayCurrency)}
          </span>
          <Link
            href={editHref}
            className="text-xs text-[var(--color-fg-dim)] hover:text-white/80 transition-colors"
          >
            Edit
          </Link>
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
      {tx.type === "expense" && (
        <div className="flex items-center justify-between gap-3 mt-1.5 pt-1.5 border-t border-white/5">
          <span className="text-xs" style={{ color: outstandingOwed > 0 ? "var(--color-negative)" : "var(--color-fg-dim)" }}>
            {outstandingOwed > 0 ? `${formatMoney(outstandingOwed, currency)} owed to you` : "Nobody owes you on this"}
          </span>
          <Link
            href={`/day-to-day/receivables/${tx.id}`}
            className="text-xs text-[var(--color-fg-dim)] hover:text-white/80 transition-colors"
          >
            Split →
          </Link>
        </div>
      )}
    </div>
  );
}
