"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { createTransaction } from "./actions";
import { todayStr } from "@/lib/date";
import type { Account, DdCategoryNode, TransactionType } from "@/lib/types";

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
}: {
  accounts: Account[];
  expenseTree: DdCategoryNode[];
  incomeTree: DdCategoryNode[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<TransactionType>("expense");
  const [level1, setLevel1] = useState("");
  const [level2, setLevel2] = useState("");
  const [level3, setLevel3] = useState("");

  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createTransaction(prev, formData);
    if (!result) {
      formRef.current?.reset();
      setLevel1("");
      setLevel2("");
      setLevel3("");
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
          defaultValue={todayStr()}
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
          className={inputClass}
        />
      </Field>

      <Field label={type === "transfer" ? "From account" : "Account"}>
        <select name="accountId" required defaultValue="" className={inputClass}>
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
          <select name="toAccountId" required defaultValue="" className={inputClass}>
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
        <input name="note" type="text" placeholder="What was this for?" className={inputClass} />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-semibold px-4 py-3 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add transaction"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
