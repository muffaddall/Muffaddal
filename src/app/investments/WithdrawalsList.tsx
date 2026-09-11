"use client";

import { useTransition } from "react";
import { removeWithdrawal } from "./actions";
import { formatMoney } from "@/lib/format";
import { formatDateShort } from "@/lib/date";
import { investmentWithdrawalLocalAmount } from "@/lib/types";
import type { Account, InvestmentWithdrawal } from "@/lib/types";

export default function WithdrawalsList({
  withdrawals,
  accounts,
}: {
  withdrawals: InvestmentWithdrawal[];
  accounts: Account[];
}) {
  const accountsById = new Map(accounts.map((a) => [a.id, a]));

  if (withdrawals.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--color-fg-dim)] mb-2">Withdrawals</p>
      <div className="flex flex-col gap-1.5">
        {withdrawals.map((w) => (
          <WithdrawalItem key={w.id} withdrawal={w} account={accountsById.get(w.accountId)} />
        ))}
      </div>
    </div>
  );
}

function WithdrawalItem({ withdrawal, account }: { withdrawal: InvestmentWithdrawal; account?: Account }) {
  const [isDeleting, startDelete] = useTransition();
  const localAmount = investmentWithdrawalLocalAmount(withdrawal);

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="truncate">
          {formatDateShort(withdrawal.date)} · {formatMoney(withdrawal.amountUsd, "USD")} → {formatMoney(localAmount, account?.currency ?? "AED")}
          {account ? ` (${account.name})` : ""}
        </p>
        {withdrawal.note && <p className="text-xs text-[var(--color-fg-dim)] truncate">{withdrawal.note}</p>}
      </div>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDelete(() => removeWithdrawal(withdrawal.id))}
        className="shrink-0 text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isDeleting ? "…" : "Delete"}
      </button>
    </div>
  );
}
