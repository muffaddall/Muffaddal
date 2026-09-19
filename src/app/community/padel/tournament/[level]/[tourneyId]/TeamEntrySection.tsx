"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { addTeamAction, removeTeamAction } from "./actions";
import PlayerCombobox from "./PlayerCombobox";
import EditTeamForm from "./EditTeamForm";
import GenerateGroupsForm from "./GenerateGroupsForm";
import type { TourneyFormat, TourneyLevel, TourneyPlayer, TourneyTeam } from "@/lib/types";

const inputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

export default function TeamEntrySection({
  level,
  tourneyId,
  teams,
  formats,
  players,
  locked,
  initialQualifiersPerGroup,
  initialWildcardCount,
  initialHasKnockout,
}: {
  level: TourneyLevel;
  tourneyId: string;
  teams: TourneyTeam[];
  formats: TourneyFormat[];
  players: TourneyPlayer[];
  locked: boolean;
  initialQualifiersPerGroup: number;
  initialWildcardCount: number;
  initialHasKnockout: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {teams.length === 0 && <p className="text-sm text-white/40 text-center py-2">No teams entered yet.</p>}
        {teams.map((team) => (
          <TeamRow key={team.id} team={team} level={level} tourneyId={tourneyId} players={players} locked={locked} />
        ))}
      </div>

      {!locked && <AddTeamForm level={level} tourneyId={tourneyId} players={players} />}
      {!locked && teams.length >= 2 && (
        <GenerateGroupsForm
          level={level}
          tourneyId={tourneyId}
          teamCount={teams.length}
          formats={formats}
          initialQualifiersPerGroup={initialQualifiersPerGroup}
          initialWildcardCount={initialWildcardCount}
          initialHasKnockout={initialHasKnockout}
        />
      )}
    </div>
  );
}

function TeamRow({
  team,
  level,
  tourneyId,
  players,
  locked,
}: {
  team: TourneyTeam;
  level: TourneyLevel;
  tourneyId: string;
  players: TourneyPlayer[];
  locked: boolean;
}) {
  const [isRemoving, startRemove] = useTransition();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <EditTeamForm level={level} tourneyId={tourneyId} team={team} players={players} onDone={() => setEditing(false)} />
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--color-surface)] border border-white/8 p-3">
      <span className="text-sm">
        {team.disqualified && (
          <span className="mr-1.5 rounded-full border border-[var(--color-negative)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-negative)]">
            DQ
          </span>
        )}
        {team.noShow && (
          <span className="mr-1.5 rounded-full border border-white/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
            NS
          </span>
        )}
        {team.playerAName} <span className="text-white/40">&amp;</span> {team.playerBName}
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-white/50 hover:text-white/80"
        >
          Edit
        </button>
        {!locked && (
          <button
            type="button"
            disabled={isRemoving}
            onClick={() => startRemove(() => removeTeamAction(team.id, level, tourneyId))}
            className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
          >
            {isRemoving ? "…" : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}

function AddTeamForm({
  level,
  tourneyId,
  players,
}: {
  level: TourneyLevel;
  tourneyId: string;
  players: TourneyPlayer[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await addTeamAction(prev, formData);
    if (!result) {
      formRef.current?.reset();
      setFormKey((k) => k + 1); // remounts the comboboxes so their typed query clears too
    }
    return result;
  }, undefined);

  return (
    <form
      key={formKey}
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <input type="hidden" name="tourneyId" value={tourneyId} />
      <input type="hidden" name="level" value={level} />
      <p className="text-xs uppercase tracking-wide text-white/40">
        Add team — pick an existing player or type a new name
      </p>
      <div className="grid grid-cols-2 gap-2">
        <PlayerCombobox name="playerAName" players={players} placeholder="Player 1 name" />
        <input name="playerACountry" placeholder="Country (optional)" className={inputCls} />
        <PlayerCombobox name="playerBName" players={players} placeholder="Player 2 name" />
        <input name="playerBCountry" placeholder="Country (optional)" className={inputCls} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-community)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Adding…" : "+ Add Team"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}

