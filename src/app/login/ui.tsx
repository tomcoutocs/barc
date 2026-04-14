"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.refresh();
    router.push(next);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
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
          autoComplete="current-password"
          required
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
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-[var(--color-primary-container)] py-3.5 text-sm font-bold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary)] disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm">
        <Link
          href="/forgot-password"
          className="font-bold text-[var(--color-secondary)] underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
