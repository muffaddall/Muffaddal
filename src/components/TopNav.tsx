"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/expenses", label: "Expenses" },
  { href: "/investments", label: "Investments" },
  { href: "/savings", label: "Savings" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="font-display text-lg tracking-wide shrink-0">
          Expense Tracker
        </span>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-[var(--color-fg)]"
                    : "text-[var(--color-fg-dim)] hover:text-[var(--color-fg)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <form action={logout}>
          <button
            type="submit"
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] transition-colors"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
