"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    setMessage("Check your email to confirm your account, then sign in.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="displayName"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
        >
          Name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border-0 border-b-2 border-[color-mix(in_srgb,var(--color-on-surface)_20%,transparent)] bg-transparent py-2 text-[var(--color-on-surface)] outline-none transition focus:border-[var(--color-secondary-bright)]"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-0 border-b-2 border-[color-mix(in_srgb,var(--color-on-surface)_20%,transparent)] bg-transparent py-2 text-[var(--color-on-surface)] outline-none transition focus:border-[var(--color-secondary-bright)]"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-0 border-b-2 border-[color-mix(in_srgb,var(--color-on-surface)_20%,transparent)] bg-transparent py-2 text-[var(--color-on-surface)] outline-none transition focus:border-[var(--color-secondary-bright)]"
        />
      </div>
      {error ? (
        <p className="text-sm font-medium text-[var(--color-secondary)]" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--color-on-surface-muted)]" role="status">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-[var(--color-primary-container)] py-3.5 text-sm font-bold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary)] disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
