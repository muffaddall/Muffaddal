"use client";

import { useTransition } from "react";
import { redeemLoyaltyRewardAction, undoLoyaltyRewardAction } from "./actions";
import type { TourneyLoyaltyReward, TourneyLoyaltyStatus } from "@/lib/types";
import { formatDateShort } from "@/lib/date";

export default function LoyaltyProgress({ playerId, loyalty }: { playerId: string; loyalty: TourneyLoyaltyStatus }) {
  const [isRedeeming, startRedeem] = useTransition();
  const pct = Math.min((loyalty.progressInCycle / loyalty.cycleLength) * 100, 100);

  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-white/8 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Loyalty Progress</p>
        {loyalty.eligibleNow && (
          <button
            type="button"
            disabled={isRedeeming}
            onClick={() => startRedeem(() => redeemLoyaltyRewardAction(playerId))}
            className="shrink-0 rounded-full bg-[var(--color-positive)] text-black text-xs font-medium px-3 py-1.5 disabled:opacity-60"
          >
            {isRedeeming ? "Marking…" : "🎁 Mark Reward Given"}
          </button>
        )}
      </div>

      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: loyalty.eligibleNow ? "var(--color-positive)" : "var(--color-community)",
          }}
        />
      </div>

      <p className="text-xs text-white/60">
        {loyalty.eligibleNow
          ? `Free entry earned — ${loyalty.progressInCycle} tournaments played since the last reward.`
          : `${loyalty.progressInCycle} / ${loyalty.cycleLength} tournaments — ${
              loyalty.cycleLength - loyalty.progressInCycle
            } more until a free entry.`}
      </p>

      {loyalty.history.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-white/8">
          <p className="text-xs uppercase tracking-wide text-white/40">Rewards given</p>
          {loyalty.history.map((r) => (
            <RewardRow key={r.id} reward={r} playerId={playerId} />
          ))}
        </div>
      )}
    </div>
  );
}

function RewardRow({ reward, playerId }: { reward: TourneyLoyaltyReward; playerId: string }) {
  const [isUndoing, startUndo] = useTransition();
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/60">{formatDateShort(reward.redeemedAt.slice(0, 10))}</span>
      <button
        type="button"
        disabled={isUndoing}
        onClick={() => startUndo(() => undoLoyaltyRewardAction(reward.id, playerId))}
        className="text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
      >
        {isUndoing ? "…" : "Undo"}
      </button>
    </div>
  );
}
