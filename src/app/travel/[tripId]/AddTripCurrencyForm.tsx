"use client";

import { useActionState, useRef, useState } from "react";
import { createTripCurrency } from "./actions";
import CurrencyCombobox from "@/components/CurrencyCombobox";

export default function AddTripCurrencyForm({
  tripId,
  existingCurrencies,
}: {
  tripId: string;
  existingCurrencies: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState("");
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createTripCurrency(prev, formData);
    if (!result) {
      formRef.current?.reset();
      setCode("");
    }
    return result;
  }, undefined);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="currency" value={code} />
      <div className="flex-1">
        <CurrencyCombobox excludeCodes={existingCurrencies} onSelect={setCode} />
      </div>
      {code && <span className="shrink-0 text-xs text-[var(--color-accent)]">{code}</span>}
      <button
        type="submit"
        disabled={pending || !code}
        className="shrink-0 rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {state?.error && <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
