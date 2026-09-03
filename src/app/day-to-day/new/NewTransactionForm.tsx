"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { createTransaction, editTransaction } from "./actions";
import { todayStr } from "@/lib/date";
import { findCategoryTreePath } from "@/lib/types";
import type { Account, DdCategoryNode, Transaction, TransactionType } from "@/lib/types";

const inputClass =
  "w-full rounded-lg bg-white/5 border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-white/70">{label}</span>
      {children}
    </label>
  );
}

export default function NewTransactionForm({
  accounts,
  expenseTree,
  incomeTree,
  defaultAccountId,
  transaction,
  backHref,
}: {
  accounts: Account[];
  expenseTree: DdCategoryNode[];
  incomeTree: DdCategoryNode[];
  defaultAccountId?: string;
  /** Present when editing an existing transaction instead of adding a new one. */
  transaction?: Transaction;
  /** Where to send the browser after a successful edit. */
  backHref?: string;
}) {
  const isEditing = !!transaction;
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");

  const initialTree = transaction?.type === "income" ? incomeTree : expenseTree;
  const initialPath = transaction?.categoryId
    ? findCategoryTreePath(initialTree, transaction.categoryId)
    : [];
  const [level1, setLevel1] = useState(initialPath[0] ?? "");
  const [level2, setLevel2] = useState(initialPath[1] ?? "");
  const [level3, setLevel3] = useState(initialPath[2] ?? "");

  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const [fromAccountId, setFromAccountId] = useState(transaction?.accountId ?? defaultAccountId ?? "");
  const [toAccountId, setToAccountId] = useState(transaction?.toAccountId ?? "");
  const [amountStr, setAmountStr] = useState(String(transaction?.amount ?? ""));
  const [rateDirection, setRateDirection] = useState<"fromToOne" | "toToOne">("fromToOne");
  const [rateStr, setRateStr] = useState(
    transaction?.toAmount && transaction.amount
      ? String(transaction.toAmount / transaction.amount)
      : ""
  );

  const fromCurrency = accountsById.get(fromAccountId)?.currency;
  const toCurrency = accountsById.get(toAccountId)?.currency;
  const needsRate = type === "transfer" && !!fromCurrency && !!toCurrency && fromCurrency !== toCurrency;

  const amountNum = Number(amountStr);
  const rateNum = Number(rateStr);
  const validRate = Number.isFinite(rateNum) && rateNum > 0;
  const computedToAmount =
    needsRate && validRate && Number.isFinite(amountNum) && amountNum > 0
      ? rateDirection === "fromToOne"
        ? amountNum * rateNum
        : amountNum / rateNum
      : null;

  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = isEditing
      ? await editTransaction(transaction.id, backHref, prev, formData)
      : await createTransaction(prev, formData);
    if (!result && !isEditing) {
      formRef.current?.reset();
      setLevel1("");
      setLevel2("");
      setLevel3("");
      setAmountStr("");
      setRateStr("");
      setRateDirection("fromToOne");
      setFromAccountId(defaultAccountId ?? "");
      setToAccountId("");
    }
    return result;
  }, undefined);

  const tree = type === "income" ? incomeTree : expenseTree;
  const level1Node = tree.find((n) => n.id === level1);
  const level2Options = level1Node?.children ?? [];
  const level2Node = level2Options.find((n) => n.id === level2);
  const level3Options = level2Node?.children ?? [];

  const selectedCategoryId = level3 || level2 || level1 || "";

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setLevel1("");
    setLevel2("");
    setLevel3("");
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="type" value={type} />
      <input
        type="hidden"
        name="categoryId"
        value={type === "transfer" ? "" : selectedCategoryId}
      />

      <div className="grid grid-cols-3 gap-1 rounded-full bg-white/5 p-1 border border-white/10">
        {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`rounded-full py-2 text-sm font-medium capitalize transition-colors ${
              type === t ? "bg-white/15 text-white" : "text-white/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Field label="Date">
        <input
          name="date"
          type="date"
          required
          defaultValue={transaction?.date ?? todayStr()}
          className={inputClass}
        />
      </Field>

      <Field label="Amount">
        <input
          name="amount"
          type="number"
          step="any"
          min="0"
          required
          placeholder="0.00"
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label={type === "transfer" ? "From account" : "Account"}>
        <select
          name="accountId"
          required
          value={fromAccountId}
          onChange={(e) => setFromAccountId(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Select account
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </Field>

      {type === "transfer" && (
        <Field label="To account">
          <select
            name="toAccountId"
            required
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Select account
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </select>
        </Field>
      )}

      {needsRate && (
        <Field label="Exchange rate">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={rateDirection}
                onChange={(e) => setRateDirection(e.target.value as "fromToOne" | "toToOne")}
                className={`${inputClass} w-auto shrink-0`}
              >
                <option value="fromToOne">1 {fromCurrency} =</option>
                <option value="toToOne">1 {toCurrency} =</option>
              </select>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="0.0000"
                value={rateStr}
                onChange={(e) => setRateStr(e.target.value)}
                className={`${inputClass} min-w-0 flex-1 basis-20`}
              />
              <span className="text-sm text-white/60 shrink-0">
                {rateDirection === "fromToOne" ? toCurrency : fromCurrency}
              </span>
            </div>
            <p className="text-xs text-[var(--color-fg-dim)]">
              {computedToAmount !== null
                ? `${amountStr} ${fromCurrency} → ${computedToAmount.toFixed(2)} ${toCurrency}`
                : "Enter today's rate to convert the destination amount."}
            </p>
          </div>
        </Field>
      )}
      <input
        type="hidden"
        name="toAmount"
        value={needsRate && computedToAmount !== null ? computedToAmount : ""}
      />

      {type !== "transfer" && (
        <>
          <Field label="Category">
            <select
              value={level1}
              onChange={(e) => {
                setLevel1(e.target.value);
                setLevel2("");
                setLevel3("");
              }}
              className={inputClass}
            >
              <option value="">Select category</option>
              {tree.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </Field>

          {level2Options.length > 0 && (
            <Field label="Subcategory">
              <select
                value={level2}
                onChange={(e) => {
                  setLevel2(e.target.value);
                  setLevel3("");
                }}
                className={inputClass}
              >
                <option value="">(none)</option>
                {level2Options.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {level3Options.length > 0 && (
            <Field label="More specific">
              <select
                value={level3}
                onChange={(e) => setLevel3(e.target.value)}
                className={inputClass}
              >
                <option value="">(none)</option>
                {level3Options.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </>
      )}

      <Field label="Note (optional)">
        <input
          name="note"
          type="text"
          placeholder="What was this for?"
          defaultValue={transaction?.note ?? ""}
          className={inputClass}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-semibold px-4 py-3 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : isEditing ? "Save changes" : "Add transaction"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
