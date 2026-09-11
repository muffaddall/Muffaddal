"use client";

import { useActionState, useRef } from "react";
import { createFormatAction } from "./actions";

const inputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

export default function AddFormatForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createFormatAction(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <p className="text-xs uppercase tracking-wide text-white/40">Add format</p>
      <div className="grid grid-cols-2 gap-2">
        <input name="name" placeholder="Name (e.g. 16 Teams)" required className={`${inputCls} col-span-2`} />
        <input name="groupSizes" placeholder="Group sizes (e.g. 4,4,4,4)" required className={inputCls} />
        <input name="qualifiersPerGroup" type="number" min={1} step={1} defaultValue={2} placeholder="Qualifiers/group" required className={inputCls} />
        <input name="wildcardCount" type="number" min={0} step={1} defaultValue={0} placeholder="Wildcard slots" className={inputCls} />
      </div>

      <p className="text-xs uppercase tracking-wide text-white/40 mt-1">Court-fee preset (optional)</p>
      <div className="grid grid-cols-2 gap-2">
        <input name="groupStageCourtHours" type="number" min={0} step="any" placeholder="Group stage court-hrs" className={inputCls} />
        <input name="quarterfinalCourtHours" type="number" min={0} step="any" placeholder="Quarterfinal court-hrs" className={inputCls} />
        <input name="semifinalFinalCourtHours" type="number" min={0} step="any" placeholder="SF + Final court-hrs" className={inputCls} />
        <input name="courtHourRate" type="number" min={0} step="any" placeholder="Rate per court-hr" className={inputCls} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-community)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "+ Add Format"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
