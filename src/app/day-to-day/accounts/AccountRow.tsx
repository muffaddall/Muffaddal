"use client";

import Link from "next/link";
import { useTransition } from "react";
import { removeAccount } from "./actions";
import { formatMoney } from "@/lib/format";
import type { Account } from "@/lib/types";
import type { AccountBalances } from "@/lib/accountBalance";

export default function AccountRow({
  account,
  balances,
}: {
  account: Account;
  balances: AccountBalances;
}) {
  const [isDeleting, startDelete] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <Link href={`/day-to-day/accounts/${account.id}`} className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{account.name}</p>
        <p className="text-xs text-[var(--color-fg-dim)]">{account.currency}</p>
      </Link>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span
            className="font-display text-lg block"
            style={{ color: balances.bank < 0 ? "var(--color-negative)" : "var(--color-positive)" }}
          >
            {formatMoney(balances.bank, account.currency)}
          </span>
          {balances.outstandingOwed > 0 && (
            <span className="text-xs" style={{ color: "var(--color-positive)" }}>
              +{formatMoney(balances.outstandingOwed, account.currency)} owed
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeAccount(account.id))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
