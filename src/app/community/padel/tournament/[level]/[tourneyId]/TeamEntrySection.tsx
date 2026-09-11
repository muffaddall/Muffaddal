"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { addTeamAction, generateGroupsAction, removeTeamAction } from "./actions";
import { formatTeamCount } from "@/lib/types";
import type { TourneyFormat, TourneyLevel, TourneyTeam } from "@/lib/types";

const inputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

export default function TeamEntrySection({
  level,
  tourneyId,
  teams,
  formats,
  locked,
}: {
  level: TourneyLevel;
  tourneyId: string;
  teams: TourneyTeam[];
  formats: TourneyFormat[];
  locked: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {teams.length === 0 && <p className="text-sm text-white/40 text-center py-2">No teams entered yet.</p>}
        {teams.map((team) => (
          <TeamRow key={team.id} team={team} level={level} tourneyId={tourneyId} locked={locked} />
        ))}
      </div>

      {!locked && <AddTeamForm level={level} tourneyId={tourneyId} />}
      {!locked && teams.length >= 2 && (
        <GenerateGroupsForm level={level} tourneyId={tourneyId} teamCount={teams.length} formats={formats} />
      )}
    </div>
  );
}

function TeamRow({
  team,
  level,
  tourneyId,
  locked,
}: {
  team: TourneyTeam;
  level: TourneyLevel;
  tourneyId: string;
  locked: boolean;
}) {
  const [isRemoving, startRemove] = useTransition();
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--color-surface)] border border-white/8 p-3">
      <span className="text-sm">
        {team.playerAName} <span className="text-white/40">&amp;</span> {team.playerBName}
      </span>
      {!locked && (
        <button
          type="button"
          disabled={isRemoving}
          onClick={() => startRemove(() => removeTeamAction(team.id, level, tourneyId))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60 shrink-0"
        >
          {isRemoving ? "…" : "Remove"}
        </button>
      )}
    </div>
  );
}

function AddTeamForm({ level, tourneyId }: { level: TourneyLevel; tourneyId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await addTeamAction(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <input type="hidden" name="tourneyId" value={tourneyId} />
      <input type="hidden" name="level" value={level} />
      <p className="text-xs uppercase tracking-wide text-white/40">Add team</p>
      <div className="grid grid-cols-2 gap-2">
        <input name="playerAName" placeholder="Player 1 name" required className={inputCls} />
        <input name="playerACountry" placeholder="Country (optional)" className={inputCls} />
        <input name="playerBName" placeholder="Player 2 name" required className={inputCls} />
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

function GenerateGroupsForm({
  level,
  tourneyId,
  teamCount,
  formats,
}: {
  level: TourneyLevel;
  tourneyId: string;
  teamCount: number;
  formats: TourneyFormat[];
}) {
  const [state, formAction, pending] = useActionState(generateGroupsAction, undefined);
  const [selection, setSelection] = useState<string>(formats.length > 0 ? formats[0].id : "custom");
  const selectedFormat = formats.find((f) => f.id === selection);
  const showCustomInput = formats.length === 0 || selection === "custom";

  const [customGroupSizes, setCustomGroupSizes] = useState("");
  const [customQualifiers, setCustomQualifiers] = useState("1");
  const [customWildcard, setCustomWildcard] = useState("0");

  const groupSizesValue = showCustomInput ? customGroupSizes : selectedFormat?.groupSizes.join(",") ?? "";
  const qualifiersValue = showCustomInput ? customQualifiers : String(selectedFormat?.qualifiersPerGroup ?? "");
  const wildcardValue = showCustomInput ? customWildcard : String(selectedFormat?.wildcardCount ?? 0);

  const formatMismatch = !showCustomInput && selectedFormat && formatTeamCount(selectedFormat.groupSizes) !== teamCount;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-[var(--color-community)] p-3"
    >
      <input type="hidden" name="tourneyId" value={tourneyId} />
      <input type="hidden" name="level" value={level} />
      <input type="hidden" name="groupSizes" value={groupSizesValue} />
      <input type="hidden" name="qualifiersPerGroup" value={qualifiersValue} />
      <input type="hidden" name="wildcardCount" value={wildcardValue} />
      {!showCustomInput && selectedFormat && <input type="hidden" name="formatId" value={selectedFormat.id} />}
      <p className="text-xs uppercase tracking-wide text-white/40">
        Generate groups — {teamCount} team{teamCount === 1 ? "" : "s"} entered
      </p>

      {formats.length > 0 && (
        <select value={selection} onChange={(e) => setSelection(e.target.value)} className={inputCls}>
          {formats.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({formatTeamCount(f.groupSizes)} teams · groups of {f.groupSizes.join("+")})
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>
      )}

      {formatMismatch && (
        <p className="text-xs text-[var(--color-negative)]">
          This format expects {formatTeamCount(selectedFormat!.groupSizes)} teams, but {teamCount} are entered.
        </p>
      )}

      {showCustomInput && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={customGroupSizes}
            onChange={(e) => setCustomGroupSizes(e.target.value)}
            placeholder="Group sizes (e.g. 4,4,4,4)"
            required
            className={`${inputCls} col-span-2`}
          />
          <input
            value={customQualifiers}
            onChange={(e) => setCustomQualifiers(e.target.value)}
            type="number"
            min={1}
            step={1}
            placeholder="Qualifiers/group"
            required
            className={inputCls}
          />
          <input
            value={customWildcard}
            onChange={(e) => setCustomWildcard(e.target.value)}
            type="number"
            min={0}
            step={1}
            placeholder="Wildcard slots"
            className={inputCls}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-[var(--color-community)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Generating…" : "Shuffle & Generate"}
      </button>
      <p className="text-xs text-white/40">
        (Qualifiers per group × groups) + wildcard slots must add up to a power of 2 (2, 4, 8, 16…) so the qualifiers
        seed cleanly into a bracket. Teams are randomly shuffled into the group sizes given, in order.{" "}
        <Link href="/community/padel/formats" className="underline">
          Manage formats
        </Link>
        .
      </p>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
