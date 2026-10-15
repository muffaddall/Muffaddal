"use client";

import { useActionState, useRef, useState } from "react";
import { createTripTransaction } from "./actions";
import { todayStr } from "@/lib/date";
import { TRIP_EXPENSE_CATEGORIES } from "@/lib/types";
import type { Account, TripTransactionType, TripWallet } from "@/lib/types";

const TYPES: { type: TripTransactionType; label: string }[] = [
  { type: "expense", label: "Expense" },
  { type: "income", label: "Add cash" },
  { type: "transfer", label: "Convert currency" },
];

const inputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]";

export default function AddTripTransactionForm({
  tripId,
  wallets,
  accounts,
}: {
  tripId: string;
  wallets: TripWallet[];
  accounts: Account[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<TripTransactionType>("expense");
  const [linkAccount, setLinkAccount] = useState(false);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createTripTransaction(prev, formData);
    if (!result) {
      formRef.current?.reset();
      setLinkAccount(false);
    }
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-dashed border-[var(--color-border)] p-4 mb-6"
    >
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="type" value={type} />

      <div className="flex gap-1 rounded-full bg-white/5 p-1 border border-white/10 self-start">
        {TYPES.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => setType(t.type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              type === t.type ? "bg-white/15 text-white" : "text-white/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input name="date" type="date" required defaultValue={todayStr()} className={inputCls} />

        <select name="walletId" required defaultValue="" className={inputCls}>
          <option value="" disabled>
            {type === "transfer" ? "From currency" : "Wallet"}
          </option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.currency}
            </option>
          ))}
        </select>

        <input
          name="amount"
          type="number"
          step="any"
          min={0}
          placeholder={type === "transfer" ? "Amount converted" : "Amount"}
          required
          className={`${inputCls} w-32`}
        />

        {type === "transfer" && (
          <>
            <select name="toWalletId" required defaultValue="" className={inputCls}>
              <option value="" disabled>
                To currency
              </option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.currency}
                </option>
              ))}
            </select>
            <input
              name="toAmount"
              type="number"
              step="any"
              min={0}
              placeholder="Amount received"
              required
              className={`${inputCls} w-32`}
            />
          </>
        )}

        {type === "expense" && (
          <select name="category" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              Category
            </option>
            {TRIP_EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        <input name="note" placeholder="Note" className={`${inputCls} flex-1 min-w-32`} />
      </div>

      {type === "income" && (
        <div className="flex flex-col gap-2 rounded-lg bg-white/5 p-3">
          <label className="flex items-center gap-1.5 text-xs text-[var(--color-fg-dim)] cursor-pointer">
            <input
              type="checkbox"
              checked={linkAccount}
              onChange={(e) => setLinkAccount(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--color-accent)]"
            />
            This cash came from a Day-to-Day account
          </label>
          {linkAccount && (
            <div className="flex flex-wrap gap-2">
              <select name="linkedAccountId" required defaultValue="" className={inputCls}>
                <option value="" disabled>
                  Account
                </option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
              <input
                name="linkedAmount"
                type="number"
                step="any"
                min={0}
                placeholder="Amount in that account's currency"
                required
                className={`${inputCls} flex-1 min-w-40`}
              />
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
