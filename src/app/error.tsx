"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-4xl tracking-wide mb-2">
        Something went sideways
      </h1>
      <p className="text-sm text-white/50 mb-6 max-w-xs">
        Couldn&apos;t reach the database. Check your connection and try
        again.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-[var(--color-post)] text-black font-semibold px-6 py-3 text-sm active:scale-[0.98] transition-transform"
      >
        Try again
      </button>
    </div>
  );
}
