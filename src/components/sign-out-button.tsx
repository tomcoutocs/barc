"use client";

export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="text-sm font-semibold text-[var(--color-on-surface-muted)] underline-offset-4 hover:text-[var(--color-secondary)] hover:underline"
      >
        Sign out
      </button>
    </form>
  );
}
