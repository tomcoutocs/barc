import Link from "next/link";
import { ForgotPasswordForm } from "./ui";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="rounded-3xl bg-[var(--color-surface-low)] p-8 shadow-[var(--shadow-float)] sm:p-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-primary)]">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          We&apos;ll email you a link. After you confirm, sign in and update your
          password under Settings.
        </p>
        <ForgotPasswordForm />
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
