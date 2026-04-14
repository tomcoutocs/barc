import Link from "next/link";
import { Suspense } from "react";
import { SignupForm } from "./ui";

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="rounded-3xl bg-[var(--color-surface-low)] p-8 shadow-[var(--shadow-float)] sm:p-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-primary)]">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          Start tracking your dogs and access AI and vet support.
        </p>
        <Suspense fallback={<p className="mt-8 text-sm text-[var(--color-on-surface-muted)]">Loading…</p>}>
          <SignupForm />
        </Suspense>
        <p className="mt-8 text-center text-sm text-[var(--color-on-surface-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-[var(--color-secondary)] underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
