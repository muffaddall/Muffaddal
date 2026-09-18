"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { generateGroupsAction } from "./actions";
import { evenGroupSizes, formatTeamCount } from "@/lib/types";
import type { TourneyFormat, TourneyLevel } from "@/lib/types";

const inputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

export default function GenerateGroupsForm({
  level,
  tourneyId,
  teamCount,
  formats,
  initialQualifiersPerGroup,
  initialWildcardCount,
  initialHasKnockout,
}: {
  level: TourneyLevel;
  tourneyId: string;
  teamCount: number;
  formats: TourneyFormat[];
  initialQualifiersPerGroup: number;
  initialWildcardCount: number;
  initialHasKnockout: boolean;
}) {
  const [state, formAction, pending] = useActionState(generateGroupsAction, undefined);
  const [selection, setSelection] = useState<string>(formats.length > 0 ? formats[0].id : "custom");
  const selectedFormat = formats.find((f) => f.id === selection);
  const showCustomInput = formats.length === 0 || selection === "custom";

  const formatMismatch = !showCustomInput && selectedFormat && formatTeamCount(selectedFormat.groupSizes) !== teamCount;

  // --- custom wizard state ---
  const [numGroups, setNumGroups] = useState("2");
  const numGroupsInt = Math.max(0, Math.floor(Number(numGroups) || 0));
  const [groupSizes, setGroupSizes] = useState<string[]>(() =>
    evenGroupSizes(teamCount, 2).map((n) => String(n))
  );

  // Re-suggest sizes whenever the entered team count changes (e.g. a team
  // gets added/removed after this form already mounted) — the same
  // resync-on-prop-change pattern GroupStageSection uses for scores.
  const [syncedTeamCount, setSyncedTeamCount] = useState(teamCount);
  if (teamCount !== syncedTeamCount) {
    setSyncedTeamCount(teamCount);
    setGroupSizes(evenGroupSizes(teamCount, numGroupsInt).map((n) => String(n)));
  }

  const setGroupCount = (value: string) => {
    setNumGroups(value);
    const n = Math.max(0, Math.floor(Number(value) || 0));
    setGroupSizes(evenGroupSizes(teamCount, n).map((s) => String(s)));
  };

  const setGroupSizeAt = (index: number, value: string) => {
    setGroupSizes((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const groupSizesNums = groupSizes.map((s) => Number(s));
  const groupSizesValid = numGroupsInt > 0 && groupSizesNums.every((n) => Number.isFinite(n) && n > 0);
  const groupSizesSum = groupSizesValid ? groupSizesNums.reduce((a, b) => a + b, 0) : 0;
  const groupSizesMatch = groupSizesValid && groupSizesSum === teamCount;

  // --- knockout stage selection (Quarterfinal / Semifinal / Final, cascading) ---
  const [hasKnockout, setHasKnockout] = useState(initialHasKnockout);
  const [wantsQF, setWantsQF] = useState(true);
  const [wantsSF, setWantsSF] = useState(true);
  const [wantsF, setWantsF] = useState(true);

  const toggleQF = (checked: boolean) => {
    setWantsQF(checked);
    if (checked) {
      setWantsSF(true);
      setWantsF(true);
    }
  };
  const toggleSF = (checked: boolean) => {
    setWantsSF(checked);
    if (checked) setWantsF(true);
    else setWantsQF(false);
  };
  const toggleF = (checked: boolean) => {
    setWantsF(checked);
    if (!checked) {
      setWantsSF(false);
      setWantsQF(false);
    }
  };

  const requiredQualifiers = !hasKnockout ? null : wantsQF ? 8 : wantsSF ? 4 : wantsF ? 2 : 0;

  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(String(initialQualifiersPerGroup || 1));
  const [includeWildcards, setIncludeWildcards] = useState(initialWildcardCount > 0);
  const [wildcardCount, setWildcardCount] = useState(String(initialWildcardCount || 0));

  const qualifiersPerGroupNum = Number(qualifiersPerGroup);
  const wildcardCountNum = includeWildcards ? Number(wildcardCount) : 0;
  const totalQualifiers = numGroupsInt * (Number.isFinite(qualifiersPerGroupNum) ? qualifiersPerGroupNum : 0) + wildcardCountNum;

  const qualifierMathOk =
    !hasKnockout ||
    (requiredQualifiers !== null && requiredQualifiers >= 2 && totalQualifiers === requiredQualifiers);

  const canGenerateCustom = groupSizesMatch && qualifierMathOk && (!hasKnockout || Number.isFinite(qualifiersPerGroupNum));

  const groupSizesValue = useMemo(() => groupSizes.join(","), [groupSizes]);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-[var(--color-community)] p-3">
      <input type="hidden" name="tourneyId" value={tourneyId} />
      <input type="hidden" name="level" value={level} />
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

      {!showCustomInput && selectedFormat && (
        <>
          <input type="hidden" name="groupSizes" value={selectedFormat.groupSizes.join(",")} />
          <input type="hidden" name="qualifiersPerGroup" value={selectedFormat.qualifiersPerGroup} />
          <input type="hidden" name="wildcardCount" value={selectedFormat.wildcardCount} />
          <input type="hidden" name="hasKnockout" value="on" />
          <input type="hidden" name="formatId" value={selectedFormat.id} />
          {formatMismatch && (
            <p className="text-xs text-[var(--color-negative)]">
              This format expects {formatTeamCount(selectedFormat.groupSizes)} teams, but {teamCount} are entered.
            </p>
          )}
        </>
      )}

      {showCustomInput && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/40">How many groups?</span>
            <input
              value={numGroups}
              onChange={(e) => setGroupCount(e.target.value)}
              type="number"
              min={1}
              step={1}
              className={`${inputCls} w-24`}
            />
          </label>

          {numGroupsInt > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-white/40">Teams per group (edit any of these to rebalance)</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {groupSizes.map((size, i) => (
                  <label key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="text-white/40 shrink-0">Group {String.fromCharCode(65 + i)}</span>
                    <input
                      value={size}
                      onChange={(e) => setGroupSizeAt(i, e.target.value)}
                      type="number"
                      min={1}
                      step={1}
                      className={`${inputCls} w-16`}
                    />
                  </label>
                ))}
              </div>
              <p className={`text-xs ${groupSizesMatch ? "text-white/40" : "text-[var(--color-negative)]"}`}>
                {groupSizesSum} of {teamCount} teams placed
                {!groupSizesMatch && " — adjust sizes so they add up to the entered team count."}
              </p>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={hasKnockout}
              onChange={(e) => setHasKnockout(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-community)]"
            />
            Knockout stage after groups
          </label>

          {hasKnockout && (
            <div className="flex flex-col gap-2 rounded-lg bg-white/5 p-2.5">
              <span className="text-xs text-white/40">Which rounds?</span>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={wantsQF} onChange={(e) => toggleQF(e.target.checked)} className="h-4 w-4 accent-[var(--color-community)]" />
                  Quarterfinal
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={wantsSF} onChange={(e) => toggleSF(e.target.checked)} className="h-4 w-4 accent-[var(--color-community)]" />
                  Semifinal
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={wantsF} onChange={(e) => toggleF(e.target.checked)} className="h-4 w-4 accent-[var(--color-community)]" />
                  Final
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-white/40">Qualifiers per group</span>
                <input
                  value={qualifiersPerGroup}
                  onChange={(e) => setQualifiersPerGroup(e.target.value)}
                  type="number"
                  min={1}
                  step={1}
                  className={`${inputCls} w-24`}
                />
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWildcards}
                  onChange={(e) => setIncludeWildcards(e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-community)]"
                />
                Include best 3rd-place teams
              </label>

              {includeWildcards && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-white/40">How many best 3rd-place teams qualify?</span>
                  <input
                    value={wildcardCount}
                    onChange={(e) => setWildcardCount(e.target.value)}
                    type="number"
                    min={0}
                    step={1}
                    className={`${inputCls} w-24`}
                  />
                </label>
              )}

              <p className={`text-xs ${qualifierMathOk ? "text-white/40" : "text-[var(--color-negative)]"}`}>
                Needs {requiredQualifiers} qualifiers total ({numGroupsInt} groups × {qualifiersPerGroup || 0} per
                group{includeWildcards ? ` + ${wildcardCount || 0} wildcard` : ""} = {totalQualifiers})
                {!qualifierMathOk && " — adjust qualifiers per group or wildcards to match."}
              </p>
            </div>
          )}

          <input type="hidden" name="groupSizes" value={groupSizesValue} />
          <input type="hidden" name="qualifiersPerGroup" value={hasKnockout ? qualifiersPerGroup : "0"} />
          <input type="hidden" name="wildcardCount" value={hasKnockout ? String(wildcardCountNum) : "0"} />
          <input type="hidden" name="hasKnockout" value={hasKnockout ? "on" : ""} />
        </div>
      )}

      <button
        type="submit"
        disabled={pending || (showCustomInput && !canGenerateCustom)}
        className="shrink-0 rounded-lg bg-[var(--color-community)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {pending ? "Generating…" : "Shuffle & Generate"}
      </button>
      <p className="text-xs text-white/40">
        Teams are randomly shuffled into the group sizes given, in order.{" "}
        <Link href="/community/padel/formats" className="underline">
          Manage formats
        </Link>
        .
      </p>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
