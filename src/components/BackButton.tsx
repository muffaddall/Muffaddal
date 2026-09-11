"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A handful of route segments exist only to group dynamic child routes and
// have no page of their own (e.g. /day-to-day/edit/[id] has no
// /day-to-day/edit index to land on) — stripping the URL naively would
// 404, so those specific parents are overridden to where "back" should
// actually go instead.
const PARENT_OVERRIDES: Record<string, string> = {
  "/community": "/",
  "/day-to-day/edit": "/day-to-day",
  "/day-to-day/receivables": "/day-to-day",
  "/education/quick": "/education",
  "/vault/group": "/vault",
};

function parentPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const naiveParent = segments.length <= 1 ? "/" : `/${segments.slice(0, -1).join("/")}`;
  return PARENT_OVERRIDES[naiveParent] ?? naiveParent;
}

export function BackButton() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <Link
      href={parentPath(pathname)}
      aria-label="Back"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 shrink-0"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
