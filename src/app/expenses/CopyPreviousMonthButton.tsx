"use client";

import { useState, useTransition } from "react";
import { copyPreviousMonth } from "./actions";
import { addMonths, formatMonth } from "@/lib/format";

export default function CopyPreviousMonthButton({ month }: { month: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const previousMonth = addMonths(month, -1);

  const handleClick = () => {
    const confirmed = window.confirm(
      `Copy every expense from ${formatMonth(previousMonth)} into ${formatMonth(month)}?`
    );
    if (!confirmed) return;

    setMessage(null);
    startTransition(async () => {
      const result = await copyPreviousMonth(month);
      if (result.error) {
        setMessage(result.error);
      } else if (!result.copied) {
        setMessage(`No expenses found in ${formatMonth(previousMonth)} to copy.`);
      } else {
        setMessage(`Copied ${result.copied} expense${result.copied === 1 ? "" : "s"}.`);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors disabled:opacity-60"
      >
        {isPending ? "Copying…" : `Copy ${formatMonth(previousMonth)}'s expenses`}
      </button>
      {message && <span className="text-xs text-[var(--color-fg-dim)]">{message}</span>}
    </div>
  );
}
