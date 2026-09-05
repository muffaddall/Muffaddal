"use client";

import { useState } from "react";
import type { EduCourseGradeScale } from "@/lib/types";

export default function WhatGradeCalculator({ scale }: { scale: EduCourseGradeScale[] }) {
  const sorted = [...scale].sort((a, b) => b.minPercent - a.minPercent);
  const [currentStr, setCurrentStr] = useState("");
  const [remainingStr, setRemainingStr] = useState("");
  const [targetLetter, setTargetLetter] = useState<string>(sorted[0]?.letterGrade ?? "");

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-[var(--color-fg-dim)]">
        Set this course&apos;s grade scale above first — the calculator needs to know what % each
        letter requires.
      </p>
    );
  }

  const current = Number(currentStr);
  const remaining = Number(remainingStr);
  const target = sorted.find((s) => s.letterGrade === targetLetter);

  let resultText: string | null = null;
  let resultColor: string | undefined;
  if (target && Number.isFinite(current) && Number.isFinite(remaining) && remaining > 0) {
    const needed = (target.minPercent - current) / (remaining / 100);
    if (needed <= 0) {
      resultText = `Already secured — you're at or above ${target.letterGrade} regardless of what's left.`;
      resultColor = "var(--color-positive)";
    } else if (needed > 100) {
      resultText = `Not reachable — even 100% on the remaining ${remaining}% won't get you to ${target.letterGrade}.`;
      resultColor = "var(--color-negative)";
    } else {
      resultText = `You need ${needed.toFixed(1)}% on the remaining ${remaining}% of the course to get ${target.letterGrade}.`;
      resultColor = "var(--color-education)";
    }
  } else if (target && Number.isFinite(current) && remaining === 0) {
    resultText = "No weight remains — the grade is already locked in.";
    resultColor = "var(--color-fg-dim)";
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-white/40">
            Current weighted %
          </span>
          <input
            type="number"
            step="any"
            value={currentStr}
            onChange={(e) => setCurrentStr(e.target.value)}
            placeholder="e.g. 55"
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-white/40">
            Weight remaining %
          </span>
          <input
            type="number"
            step="any"
            value={remainingStr}
            onChange={(e) => setRemainingStr(e.target.value)}
            placeholder="e.g. 30"
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
          />
        </label>
      </div>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-white/40">Target grade</span>
        <select
          value={targetLetter}
          onChange={(e) => setTargetLetter(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
        >
          {sorted.map((s) => (
            <option key={s.letterGrade} value={s.letterGrade}>
              {s.letterGrade} ({s.minPercent}%+)
            </option>
          ))}
        </select>
      </label>
      {resultText && (
        <p className="text-sm font-medium" style={{ color: resultColor }}>
          {resultText}
        </p>
      )}
    </div>
  );
}
