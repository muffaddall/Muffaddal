"use client";

import { useMemo, useRef, useState } from "react";
import { searchCurrencies } from "@/lib/currencies";

/**
 * Search-as-you-type picker over every ISO 4217 currency — type a code or
 * name ("shilling"), pick a match, `onSelect` fires with the 3-letter
 * code. Callback-based rather than a plain form field since it's reused
 * both for building a list of chips (Travel's new-trip form) and for
 * adding one currency at a time (a trip's "add a currency" form).
 */
export default function CurrencyCombobox({
  onSelect,
  placeholder = "Search currency (e.g. USD, Shilling)",
  excludeCodes = [],
}: {
  onSelect: (code: string) => void;
  placeholder?: string;
  excludeCodes?: string[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(
    () => searchCurrencies(query).filter((c) => !excludeCodes.includes(c.code)),
    [query, excludeCodes]
  );

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="min-w-0 w-full rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      {open && query.trim().length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg">
          {matches.map((c) => (
            <button
              key={c.code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                if (blurTimeout.current) clearTimeout(blurTimeout.current);
                onSelect(c.code);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-sm hover:bg-white/10 text-left"
            >
              <span className="font-medium shrink-0">{c.code}</span>
              <span className="truncate text-white/50 text-xs">{c.name}</span>
            </button>
          ))}
          {matches.length === 0 && (
            <p className="px-2.5 py-1.5 text-xs text-white/40">No matches.</p>
          )}
        </div>
      )}
    </div>
  );
}
