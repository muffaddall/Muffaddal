"use client";

import { useState, useTransition } from "react";
import { updateTeamFeesAction } from "../actions";
import { formatMoney } from "@/lib/format";
import { registrationsTotal } from "@/lib/types";
import type { TourneyLevel, TourneyTeam } from "@/lib/types";

/** Team-by-team registration fees, tucked into a dropdown so it doesn't crowd out sponsors and other income lines below. Each team starts at 0 for both players — set the actual amount here (discounts included); the During Event payments screen reads the same numbers to show what each person owes. */
export default function RegistrationsSection({
  level,
  tourneyId,
  teams,
}: {
  level: TourneyLevel;
  tourneyId: string;
  teams: TourneyTeam[];
}) {
  const total = registrationsTotal(teams);

  return (
    <details className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-3 py-2.5 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold" style={{ color: "var(--color-community)" }}>
          Team Registrations
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs tabular-nums text-white/50">{formatMoney(total)}</span>
          <span className="text-xs text-white/40">▾</span>
        </div>
      </summary>
      <div className="px-3 pb-3 flex flex-col gap-1.5">
        <p className="text-xs text-white/40 pt-1">
          Set what each player is actually paying (discounts included) — starts at 0 for a new team.
        </p>
        {teams.length === 0 && (
          <p className="text-xs text-white/40 text-center py-3">
            No teams entered yet — add them on the Pre-Tournament page.
          </p>
        )}
        {teams.map((team) => (
          <TeamFeeRow key={team.id} level={level} tourneyId={tourneyId} team={team} />
        ))}
      </div>
    </details>
  );
}

function TeamFeeRow({
  level,
  tourneyId,
  team,
}: {
  level: TourneyLevel;
  tourneyId: string;
  team: TourneyTeam;
}) {
  const [aFee, setAFee] = useState(String(team.playerAFee));
  const [bFee, setBFee] = useState(String(team.playerBFee));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  const save = () => {
    const a = Number(aFee);
    const b = Number(bFee);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) {
      setError("Enter valid amounts.");
      return;
    }
    setError(null);
    startSave(async () => {
      const result = await updateTeamFeesAction(team.id, a, b, level, tourneyId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="rounded-lg bg-white/5 p-2 flex flex-col gap-1.5">
      <p className="text-xs text-white/60 truncate">
        {team.playerAName} &amp; {team.playerBName}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <FeeInput label={team.playerAName} paid={team.playerAPaid} value={aFee} onChange={setAFee} />
        <FeeInput label={team.playerBName} paid={team.playerBPaid} value={bFee} onChange={setBFee} />
        <button
          type="button"
          disabled={isSaving}
          onClick={save}
          className="text-xs text-white/60 hover:text-white/90 disabled:opacity-60"
        >
          {isSaving ? "…" : "Save"}
        </button>
      </div>
      {error && <p className="text-[10px] text-[var(--color-negative)]">{error}</p>}
    </div>
  );
}

function FeeInput({
  label,
  paid,
  value,
  onChange,
}: {
  label: string;
  paid: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="text-white/40 truncate max-w-[6rem]">
        {label}
        {paid ? " ✓" : ""}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="number"
        step="any"
        min={0}
        className="w-20 rounded-lg bg-white/5 border border-[var(--color-border)] px-1.5 py-1 text-xs text-right outline-none focus:border-[var(--color-community)]"
      />
    </label>
  );
}
