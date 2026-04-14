"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Bell, Settings, UserRound } from "lucide-react";

const NAV = [
  { href: "/consult", label: "AI Consultant" },
  { href: "/vet-directory", label: "Vet Directory" },
  { href: "/pricing", label: "Pricing" },
] as const;

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`text-sm font-semibold tracking-wide transition-colors ${
        active
          ? "text-[var(--color-secondary-bright)] underline decoration-[var(--color-secondary-bright)] decoration-2 underline-offset-8"
          : "text-[var(--color-on-surface)] hover:text-[var(--color-secondary)]"
      }`}
    >
      {children}
    </Link>
  );
}

export function SiteHeader({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[color-mix(in_srgb,var(--color-on-surface)_8%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-[var(--color-primary)]"
        >
          Barc
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/consult"
            className="hidden rounded-2xl bg-[var(--color-primary-container)] px-4 py-2 text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-float)] transition hover:bg-[var(--color-primary)] sm:inline-flex"
          >
            Book a Vet
          </Link>
          {user ? (
            <>
              <button
                type="button"
                className="rounded-full p-2 text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)]"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <Link
                href="/settings"
                className="rounded-full p-2 text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)]"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" strokeWidth={1.75} />
              </Link>
              <Link
                href="/dashboard"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-high)] ring-2 ring-[color-mix(in_srgb,var(--color-secondary)_35%,transparent)]"
                aria-label="Dashboard"
              >
                <UserRound className="h-5 w-5 text-[var(--color-primary-container)]" />
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-2xl border-2 border-[color-mix(in_srgb,var(--color-primary-container)_25%,transparent)] px-4 py-2 text-sm font-bold text-[var(--color-primary-container)] transition hover:bg-[var(--color-surface-low)]"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
