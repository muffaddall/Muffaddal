"use client";

import { useActionState, useRef, useState } from "react";
import { saveWithdrawal } from "./actions";
import { todayStr } from "@/lib/date";
import type { Account } from "@/lib/types";

const inputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]";

export default function WithdrawForm({ accounts }: { accounts: Account[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [amountUsd, setAmountUsd] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");

  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await saveWithdrawal(prev, formData);
    if (!result) {
      formRef.current?.reset();
      setAmountUsd("");
      setExchangeRate("");
    }
    return result;
  }, undefined);

  const account = accounts.find((a) => a.id === accountId);
  const usdNum = Number(amountUsd);
  const rateNum = Number(exchangeRate);
  const localAmount =
    Number.isFinite(usdNum) && Number.isFinite(rateNum) && amountUsd !== "" && exchangeRate !== ""
      ? usdNum * rateNum
      : null;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <p className="text-xs uppercase tracking-wide text-[var(--color-fg-dim)]">Withdraw from portfolio</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input name="date" type="date" required defaultValue={todayStr()} className={inputCls} />
        <input
          name="amountUsd"
          type="number"
          step="any"
          min={0}
          placeholder="USD amount"
          required
          value={amountUsd}
          onChange={(e) => setAmountUsd(e.target.value)}
          className={inputCls}
        />
        <input
          name="exchangeRate"
          type="number"
          step="any"
          min={0}
          placeholder={account ? `${account.currency} per USD` : "Exchange rate"}
          required
          value={exchangeRate}
          onChange={(e) => setExchangeRate(e.target.value)}
          className={inputCls}
        />
        <select name="accountId" required value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </div>
      <input name="note" placeholder="Note (optional)" className={inputCls} />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--color-fg-dim)]">
          {localAmount !== null && account
            ? `Credits ${account.name} with ${localAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${account.currency}`
            : "Enter the amount and the rate you actually got for this withdrawal."}
        </p>
        <button
          type="submit"
          disabled={pending || accounts.length === 0}
          className="shrink-0 rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
        >
          {pending ? "Saving…" : "Withdraw"}
        </button>
      </div>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
