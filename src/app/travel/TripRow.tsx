"use client";

import Link from "next/link";
import { useTransition } from "react";
import { removeTrip } from "./actions";
import type { Trip, TripWallet } from "@/lib/types";

export default function TripRow({ trip, wallets }: { trip: Trip; wallets: TripWallet[] }) {
  const [isDeleting, startDelete] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <Link href={`/travel/${trip.id}`} className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{trip.name}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {wallets.map((w) => (
            <span
              key={w.id}
              className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/50"
            >
              {w.currency}
            </span>
          ))}
        </div>
      </Link>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDelete(() => removeTrip(trip.id))}
        className="shrink-0 text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isDeleting ? "…" : "Delete"}
      </button>
    </li>
  );
}
