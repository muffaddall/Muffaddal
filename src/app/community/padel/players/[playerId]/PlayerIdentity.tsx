"use client";

import { useState, useTransition } from "react";
import { updatePlayerAction } from "./actions";
import type { TourneyPlayer } from "@/lib/types";

const inputCls =
  "min-w-0 w-full rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

/** Inline name/country editor for a player's own profile — existing team rows only store the player id, so past history and points automatically pick up the new name. */
export default function PlayerIdentity({ player }: { player: TourneyPlayer }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player.name);
  const [country, setCountry] = useState(player.country ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setName(player.name);
          setCountry(player.country ?? "");
          setError(null);
          setEditing(true);
        }}
        className="text-xs text-white/50 hover:text-white/80 underline"
      >
        Edit name
      </button>
    );
  }

  const save = () => {
    if (!name.trim()) {
      setError("Name can't be empty.");
      return;
    }
    setError(null);
    startSave(async () => {
      const result = await updatePlayerAction(player.id, name, country.trim() || null);
      if (result?.error) setError(result.error);
      else setEditing(false);
    });
  };

  return (
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-lg bg-white/5 p-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputCls} />
      <input
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        placeholder="Country (optional)"
        className={inputCls}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={save}
          className="rounded-lg bg-[var(--color-community)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border border-[var(--color-border)] text-sm px-3 py-1.5 hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-[var(--color-negative)]">{error}</p>}
    </div>
  );
}
