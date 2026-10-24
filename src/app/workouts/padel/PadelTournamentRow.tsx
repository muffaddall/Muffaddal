"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { removePadelTournament, savePadelTournament } from "./actions";
import { formatMoney } from "@/lib/format";
import { formatDateShort } from "@/lib/date";
import { PADEL_TOURNAMENT_RESULTS, PADEL_TOURNAMENT_RESULT_LABELS } from "@/lib/types";
import type { PadelLoggedTournament } from "@/lib/padel";

const inputClass =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]";

export function ResultSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select name="result" defaultValue={defaultValue} className={inputClass}>
      <option value="">Result not set</option>
      {PADEL_TOURNAMENT_RESULTS.map((r) => (
        <option key={r} value={r}>
          {PADEL_TOURNAMENT_RESULT_LABELS[r]}
        </option>
      ))}
    </select>
  );
}

export default function PadelTournamentRow({ tournament }: { tournament: PadelLoggedTournament }) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await savePadelTournament(prev, formData);
    if (!result) setEditing(false);
    return result;
  }, undefined);
  const linked = tournament.transactionId !== null;

  if (editing) {
    return (
      <li className="rounded-lg bg-white/5 p-2">
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          {tournament.id && <input type="hidden" name="id" value={tournament.id} />}
          {linked && <input type="hidden" name="transactionId" value={tournament.transactionId!} />}
          <input
            name="name"
            defaultValue={tournament.name}
            placeholder="Tournament name"
            required
            className={`min-w-0 flex-1 ${inputClass}`}
          />
          {!linked && (
            <>
              <input name="date" type="date" defaultValue={tournament.date ?? ""} className={inputClass} />
              <input
                name="entryFee"
                type="number"
                step="any"
                placeholder="Entry fee"
                defaultValue={tournament.entryFee ?? ""}
                className={`w-28 ${inputClass}`}
              />
            </>
          )}
          <ResultSelect defaultValue={tournament.result ?? ""} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[var(--color-accent)] text-black text-sm px-3 py-1.5 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-[var(--color-border)] text-sm px-3 py-1.5 hover:bg-white/5"
          >
            Cancel
          </button>
        </form>
        {linked && (
          <p className="text-xs text-[var(--color-fg-dim)] mt-1.5">
            Date and fee come from the Day-to-Day expense —{" "}
            <Link href={`/day-to-day/edit/${tournament.transactionId}`} className="underline">
              edit the expense
            </Link>{" "}
            to change them.
          </p>
        )}
        {state?.error && <p className="text-xs text-[var(--color-negative)] mt-1">{state.error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
      <div className="min-w-0">
        <p className="text-sm truncate">{tournament.name}</p>
        <p className="text-xs text-[var(--color-fg-dim)]">
          {[
            tournament.date ? formatDateShort(tournament.date) : "No date",
            tournament.entryFee !== null ? formatMoney(tournament.entryFee) : null,
            linked ? "from Day-to-Day" : "added by hand",
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className="text-sm"
          style={{
            color:
              tournament.result === "winner"
                ? "var(--color-positive)"
                : tournament.result
                  ? undefined
                  : "var(--color-fg-dim)",
          }}
        >
          {tournament.result ? PADEL_TOURNAMENT_RESULT_LABELS[tournament.result] : "—"}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-[var(--color-fg-dim)] hover:text-[var(--color-fg)]"
        >
          Edit
        </button>
        {!linked && tournament.id && (
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => startDelete(() => removePadelTournament(tournament.id!))}
            className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
          >
            {isDeleting ? "…" : "Delete"}
          </button>
        )}
      </div>
    </li>
  );
}
