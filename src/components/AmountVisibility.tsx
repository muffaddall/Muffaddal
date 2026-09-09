"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type VisibilityState = {
  masterVisible: boolean;
  overrides: Record<string, boolean>;
};

type VisibilityContextValue = {
  isVisible: (id: string) => boolean;
  toggle: (id: string) => void;
  toggleAll: () => void;
  masterVisible: boolean;
};

const VisibilityContext = createContext<VisibilityContextValue | null>(null);

/** Wraps a page (or section) so every MaskedAmount/VisibilityMasterToggle inside shares one hide/show state. */
export function AmountVisibilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VisibilityState>({ masterVisible: true, overrides: {} });

  const isVisible = useCallback(
    (id: string) => state.overrides[id] ?? state.masterVisible,
    [state]
  );

  const toggle = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      overrides: { ...prev.overrides, [id]: !(prev.overrides[id] ?? prev.masterVisible) },
    }));
  }, []);

  // Hiding/showing everything clears individual overrides, so every number
  // follows the new master state until you override one again.
  const toggleAll = useCallback(() => {
    setState((prev) => ({ masterVisible: !prev.masterVisible, overrides: {} }));
  }, []);

  const value = useMemo(
    () => ({ isVisible, toggle, toggleAll, masterVisible: state.masterVisible }),
    [isVisible, toggle, toggleAll, state.masterVisible]
  );

  return <VisibilityContext.Provider value={value}>{children}</VisibilityContext.Provider>;
}

function useVisibilityContext(): VisibilityContextValue {
  const ctx = useContext(VisibilityContext);
  if (!ctx) throw new Error("MaskedAmount/VisibilityMasterToggle must be used inside an AmountVisibilityProvider");
  return ctx;
}

/** Wrap any displayed number in this — it renders dots instead when hidden, with its own eye to override the page-wide setting. */
export function MaskedAmount({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const { isVisible, toggle } = useVisibilityContext();
  const visible = isVisible(id);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <span>{visible ? children : "••••"}</span>
      <button
        type="button"
        onClick={() => toggle(id)}
        aria-label={visible ? "Hide this amount" : "Show this amount"}
        className="shrink-0 text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] transition-colors"
      >
        <EyeIcon open={visible} />
      </button>
    </span>
  );
}

/** The one eye at the top of the page that hides/shows every amount at once. */
export function VisibilityMasterToggle() {
  const { toggleAll, masterVisible } = useVisibilityContext();

  return (
    <button
      type="button"
      onClick={toggleAll}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
    >
      <EyeIcon open={masterVisible} />
      {masterVisible ? "Hide all amounts" : "Show all amounts"}
    </button>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.8 21.8 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
