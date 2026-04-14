import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary-bright)]">
        404
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-primary)]">
        Page not found
      </h1>
      <p className="mt-4 text-[var(--color-on-surface-muted)]">
        That path doesn&apos;t exist. Head home or open your dashboard.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-2xl bg-[var(--color-primary-container)] px-6 py-3 text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-float)] transition hover:bg-[var(--color-primary)]"
        >
          Back to home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-2xl border-2 border-[color-mix(in_srgb,var(--color-primary-container)_28%,transparent)] px-6 py-3 text-sm font-bold text-[var(--color-primary)]"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
