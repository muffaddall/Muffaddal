"use client";

import { useMemo, useRef, useState } from "react";
import type { TourneyPlayer } from "@/lib/types";

const inputCls =
  "min-w-0 w-full rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-community)]";

/**
 * A name field that doubles as a search box into the existing player
 * database: typing filters a dropdown of matching profiles so you can pick
 * one instead of retyping a name that might not match exactly (and silently
 * create a duplicate profile). Selecting a suggestion fills the input with
 * that player's exact stored name; the field otherwise submits whatever
 * text is typed, so a name with no match just creates a new player the
 * same way it always has (see findOrCreatePlayer in lib/tourneys.ts).
 */
export default function PlayerCombobox({
  name,
  players,
  placeholder,
  defaultValue = "",
}: {
  name: string;
  players: TourneyPlayer[];
  placeholder: string;
  defaultValue?: string;
}) {
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return players.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, players]);

  const exactMatch = players.some((p) => p.name.trim().toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="relative">
      <input
        name={name}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => setOpen(false), 120);
        }}
        placeholder={placeholder}
        autoComplete="off"
        required
        className={inputCls}
      />
      {open && query.trim().length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg overflow-hidden">
          {matches.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                if (blurTimeout.current) clearTimeout(blurTimeout.current);
                setQuery(p.name);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-sm hover:bg-white/10 text-left"
            >
              <span className="truncate">{p.name}</span>
              {p.country && <span className="shrink-0 text-xs text-white/40">{p.country}</span>}
            </button>
          ))}
          {matches.length === 0 && (
            <p className="px-2.5 py-1.5 text-xs text-white/40">No matches — this will add a new player.</p>
          )}
          {matches.length > 0 && !exactMatch && (
            <p className="px-2.5 py-1.5 text-xs text-white/40 border-t border-[var(--color-border)]">
              No exact match — keep typing to add &ldquo;{query.trim()}&rdquo; as a new player.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
