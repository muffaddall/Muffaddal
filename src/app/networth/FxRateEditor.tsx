"use client";

import { useActionState } from "react";
import { saveAedPerGbpRate, saveAedPerInrRate } from "./actions";

export default function FxRateEditor({
  aedPerGbp,
  aedPerInr,
}: {
  aedPerGbp: number;
  aedPerInr: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <RateForm label="AED per GBP" defaultValue={aedPerGbp} action={saveAedPerGbpRate} />
      <RateForm label="AED per INR" defaultValue={aedPerInr} action={saveAedPerInrRate} />
    </div>
  );
}

function RateForm({
  label,
  defaultValue,
  action,
}: {
  label: string;
  defaultValue: number;
  action: (
    prev: { error: string } | undefined,
    formData: FormData
  ) => Promise<{ error: string } | undefined>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <label className="text-sm text-[var(--color-fg-dim)]">{label}</label>
      <input
        name="rate"
        type="number"
        step="any"
        defaultValue={defaultValue}
        className="w-24 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state?.error && <span className="text-xs text-[var(--color-negative)]">{state.error}</span>}
    </form>
  );
}
