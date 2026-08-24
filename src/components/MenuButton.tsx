"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "@/app/login/actions";

export function MenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 shrink-0"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="block h-[2px] w-4 bg-white/80 rounded-full" />
          <span className="block h-[2px] w-4 bg-white/80 rounded-full" />
          <span className="block h-[2px] w-4 bg-white/80 rounded-full" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="flex-1 bg-black/60"
          />
          <div className="w-64 max-w-[80%] h-full bg-[var(--color-surface)] border-l border-white/10 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-2xl tracking-wide">Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              <MenuLink href="/" onNavigate={() => setOpen(false)}>
                Home
              </MenuLink>
              <MenuLink href="/schedule/day" onNavigate={() => setOpen(false)}>
                Content Schedule
              </MenuLink>
            </nav>

            <form action={logout} className="mt-auto pt-4 border-t border-white/8">
              <button type="submit" className="text-sm text-white/40 py-2">
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function MenuLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="rounded-xl px-3 py-3 text-sm font-medium text-white/85 hover:bg-white/5 transition-colors"
    >
      {children}
    </Link>
  );
}
