"use client";

import { useActionState } from "react";
import { updateTourneyPointsAction } from "./actions";
import type { Tourney, TourneyLevel } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

export default function PointsSettingsForm({
  level,
  tourneyId,
  tourney,
}: {
  level: TourneyLevel;
  tourneyId: string;
  tourney: Tourney;
}) {
  const [state, formAction, pending] = useActionState(updateTourneyPointsAction, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-white/8 bg-[var(--color-surface)] p-3"
    >
      <input type="hidden" name="tourneyId" value={tourneyId} />
      <input type="hidden" name="level" value={level} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="Joining a team" name="joinPoints" defaultValue={tourney.joinPoints} />
        <Field label="Group stage win" name="groupWinPoints" defaultValue={tourney.groupWinPoints} />
        <Field label="Quarterfinal win" name="quarterfinalPoints" defaultValue={tourney.quarterfinalPoints} />
        <Field label="Semifinal win" name="semifinalPoints" defaultValue={tourney.semifinalPoints} />
        <Field label="Final win" name="finalPoints" defaultValue={tourney.finalPoints} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-[var(--color-community)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save points"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
      <p className="text-xs text-white/40">
        Only affects points awarded from now on — teams already joined or matches already scored keep
        the points they were given at the time.
      </p>
    </form>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-white/40">{label}</span>
      <input
        name={name}
        type="number"
        min={0}
        step={1}
        defaultValue={defaultValue}
        required
        className={inputCls}
      />
    </label>
  );
}
