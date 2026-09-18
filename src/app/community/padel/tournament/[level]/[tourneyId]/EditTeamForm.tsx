"use client";

import { useActionState } from "react";
import { editTeamAction } from "./actions";
import PlayerCombobox from "./PlayerCombobox";
import type { TourneyLevel, TourneyPlayer, TourneyTeam } from "@/lib/types";

const inputCls =
  "min-w-0 w-full rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

/** Inline "change a partner" form — same player combobox as team entry, pre-filled with the team's current names. Used from both the Pre-Tournament team list and the During Event payments list. */
export default function EditTeamForm({
  level,
  tourneyId,
  team,
  players,
  onDone,
}: {
  level: TourneyLevel;
  tourneyId: string;
  team: TourneyTeam;
  players: TourneyPlayer[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await editTeamAction(prev, formData);
    if (!result) onDone();
    return result;
  }, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-lg bg-white/5 p-3"
    >
      <input type="hidden" name="teamId" value={team.id} />
      <input type="hidden" name="level" value={level} />
      <input type="hidden" name="tourneyId" value={tourneyId} />
      <p className="text-xs uppercase tracking-wide text-white/40">Edit team</p>
      <div className="grid grid-cols-2 gap-2">
        <PlayerCombobox name="playerAName" players={players} placeholder="Player 1 name" defaultValue={team.playerAName} />
        <input name="playerACountry" placeholder="Country (optional)" className={inputCls} />
        <PlayerCombobox name="playerBName" players={players} placeholder="Player 2 name" defaultValue={team.playerBName} />
        <input name="playerBCountry" placeholder="Country (optional)" className={inputCls} />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-community)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-[var(--color-border)] text-sm px-3 py-1.5 hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
