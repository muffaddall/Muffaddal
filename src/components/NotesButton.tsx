import Link from "next/link";

export function NotesButton() {
  return (
    <Link
      href="/notes"
      aria-label="Notes"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 shrink-0"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.5 13h7M8.5 16.5h5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
