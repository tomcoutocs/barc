"use client";

import { useActionState } from "react";
import {
  updatePassword,
  type ActionState,
} from "@/app/settings/actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    {} as ActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          className="w-full rounded-2xl border-0 border-b-2 border-[color-mix(in_srgb,var(--color-on-surface)_20%,transparent)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] outline-none transition focus:border-[var(--color-secondary-bright)]"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="confirm"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
        >
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          className="w-full rounded-2xl border-0 border-b-2 border-[color-mix(in_srgb,var(--color-on-surface)_20%,transparent)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-on-surface)] outline-none transition focus:border-[var(--color-secondary-bright)]"
        />
      </div>
      {state?.error ? (
        <p className="text-sm font-medium text-[var(--color-secondary)]" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-[var(--color-on-surface-muted)]" role="status">
          Password updated.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-[var(--color-primary-container)] px-5 py-2.5 text-sm font-bold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
