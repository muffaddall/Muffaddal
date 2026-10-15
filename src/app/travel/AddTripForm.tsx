"use client";

import { useActionState, useRef, useState } from "react";
import { createTrip } from "./actions";
import CurrencyCombobox from "@/components/CurrencyCombobox";

export default function AddTripForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createTrip(prev, formData);
    if (!result) {
      formRef.current?.reset();
      setCurrencies([]);
    }
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-dashed border-[var(--color-border)] p-4"
    >
      <input
        name="name"
        placeholder="Trip name (e.g. Tanzania 2026)"
        required
        className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />

      <div>
        <p className="text-xs text-white/50 mb-1.5">Currencies you&apos;ll use on this trip</p>
        <CurrencyCombobox
          excludeCodes={currencies}
          onSelect={(code) => setCurrencies((prev) => [...prev, code])}
        />
        {currencies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {currencies.map((code) => (
              <span
                key={code}
                className="flex items-center gap-1 rounded-full border border-[var(--color-accent)] px-2.5 py-1 text-xs text-[var(--color-accent)]"
              >
                {code}
                <input type="hidden" name="currencies" value={code} />
                <button
                  type="button"
                  onClick={() => setCurrencies((prev) => prev.filter((c) => c !== code))}
                  className="text-white/40 hover:text-white"
                  aria-label={`Remove ${code}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || currencies.length === 0}
        className="self-start rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create trip"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
