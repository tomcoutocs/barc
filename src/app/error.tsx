"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary-bright)]">
        Something went wrong
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-primary)]">
        We couldn&apos;t load this view
      </h1>
      <p className="mt-4 text-[var(--color-on-surface-muted)]">
        Try again, or go back to a stable page.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-2xl bg-[var(--color-primary-container)] px-6 py-3 text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-float)] transition hover:bg-[var(--color-primary)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-2xl border-2 border-[color-mix(in_srgb,var(--color-primary-container)_28%,transparent)] px-6 py-3 text-sm font-bold text-[var(--color-primary)]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
