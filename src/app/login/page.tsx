import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./ui";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="rounded-3xl bg-[var(--color-surface-low)] p-8 shadow-[var(--shadow-float)] sm:p-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-primary)]">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          Sign in to manage your dogs and consultations.
        </p>
        <Suspense fallback={<p className="mt-8 text-sm text-[var(--color-on-surface-muted)]">Loading…</p>}>
          <LoginForm />
        </Suspense>
        <p className="mt-8 text-center text-sm text-[var(--color-on-surface-muted)]">
          No account?{" "}
          <Link
            href="/signup"
            className="font-bold text-[var(--color-secondary)] underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
