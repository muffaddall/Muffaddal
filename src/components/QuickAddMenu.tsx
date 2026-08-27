"use client";

import Link from "next/link";
import { useState } from "react";

const GROUPS: {
  title: string;
  color: string;
  items: { href: string; label: string }[];
}[] = [
  {
    title: "Content",
    color: "var(--color-shoot)",
    items: [{ href: "/new-idea?from=/", label: "New Idea" }],
  },
  {
    title: "Fitness",
    color: "var(--color-fitness)",
    items: [
      { href: "/workouts", label: "Log Workout" },
      { href: "/calories", label: "Log Calories" },
      { href: "/weight", label: "Log Weight" },
    ],
  },
];

export function QuickAddMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Quick add"
        className="flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
      >
        <span className="text-base leading-none">+</span> Add
      </button>

      {open && (
        <>
          <button
            aria-label="Close quick add menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
          />
          <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[var(--color-surface)] border border-white/10 p-2 z-50 shadow-xl flex flex-col">
            {GROUPS.map((group, i) => (
              <div key={group.title} className={i > 0 ? "mt-2 pt-2 border-t border-white/8" : ""}>
                <p
                  className="px-3 pb-1 text-xs uppercase tracking-wide"
                  style={{ color: group.color }}
                >
                  {group.title}
                </p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/5 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
