"use client";

import { useTransition } from "react";
import { markPaidBack, removeReceivable } from "./actions";
import { formatMoney } from "@/lib/format";
import type { Currency, Receivable } from "@/lib/types";

export default function ReceivableRow({
  receivable,
  personName,
  accountId,
  currency,
}: {
  receivable: Receivable;
  personName: string;
  accountId: string;
  currency: Currency;
}) {
  const [isMarking, startMarking] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const isOutstanding = receivable.status === "outstanding";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{personName}</p>
        <p className="text-xs text-[var(--color-fg-dim)]">
          {isOutstanding ? "Outstanding" : "Paid back"}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: isOutstanding ? "var(--color-negative)" : "var(--color-positive)" }}
        >
          {formatMoney(receivable.amount, currency)}
        </span>
        {isOutstanding && (
          <button
            type="button"
            disabled={isMarking}
            onClick={() =>
              startMarking(() =>
                markPaidBack(receivable.id, receivable.transactionId, accountId, receivable.amount, personName)
              )
            }
            className="text-xs text-[var(--color-positive)] hover:opacity-80 disabled:opacity-60"
          >
            {isMarking ? "…" : "Mark paid back"}
          </button>
        )}
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDeleting(() => removeReceivable(receivable.id, receivable.transactionId, accountId))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
