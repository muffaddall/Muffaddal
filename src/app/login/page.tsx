"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-6xl tracking-wide text-center mb-1">
          Content Pipeline
        </h1>
        <p className="text-center text-sm text-white/50 mb-8">
          Private planning space. Enter the password to continue.
        </p>

        <form action={formAction} className="flex flex-col gap-3">
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-base text-white placeholder-white/30 outline-none focus:border-[var(--color-post)] transition-colors"
          />

          {state?.error && (
            <p className="text-sm text-[var(--color-shoot)]">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-xl bg-[var(--color-post)] text-black font-semibold py-3.5 text-base disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            {pending ? "Checking..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
