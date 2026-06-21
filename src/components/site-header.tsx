"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Bell, Menu, Settings, UserRound, X } from "lucide-react";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/consult", label: "AI Consultant" },
  { href: "/vet-directory", label: "Vet Directory" },
  { href: "/pricing", label: "Pricing" },
] as const;

function NavLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-semibold tracking-tight transition-all duration-200",
        active
          ? "bg-secondary-bright/12 text-secondary"
          : "text-on-surface hover:bg-surface-high/80 hover:text-primary",
      )}
    >
      {children}
    </Link>
  );
}

export function SiteHeader({
  user,
  showDevFeedback = false,
}: {
  user: User | null;
  showDevFeedback?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-primary/[0.06] bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 text-xl font-extrabold tracking-tight text-primary"
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary-container text-sm text-on-primary shadow-soft transition group-hover:shadow-glow"
            aria-hidden
          >
            B
          </span>
          Barc
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
          {showDevFeedback ? (
            <NavLink href="/dev/feedback">Feedback</NavLink>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ButtonLink
            href="/consult"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Book a Vet
          </ButtonLink>

          {user ? (
            <>
              <button
                type="button"
                className="rounded-xl p-2 text-on-surface transition hover:bg-surface-high/80"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <Link
                href="/settings"
                className="hidden rounded-xl p-2 text-on-surface transition hover:bg-surface-high/80 sm:inline-flex"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" strokeWidth={1.75} />
              </Link>
              <Link
                href="/dashboard"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-surface-high shadow-soft ring-2 ring-secondary/25 transition hover:ring-secondary-bright/40"
                aria-label="Dashboard"
              >
                <UserRound className="h-5 w-5 text-primary-container" />
              </Link>
            </>
          ) : (
            <ButtonLink href="/login" variant="outline" size="sm">
              Log in
            </ButtonLink>
          )}

          <button
            type="button"
            className="rounded-xl p-2 text-primary md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-primary/[0.06] bg-surface/95 px-4 py-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                onNavigate={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {showDevFeedback ? (
              <NavLink
                href="/dev/feedback"
                onNavigate={() => setMobileOpen(false)}
              >
                Feedback
              </NavLink>
            ) : null}
            <ButtonLink
              href="/consult"
              className="mt-3 w-full"
              onClick={() => setMobileOpen(false)}
            >
              Book a Vet
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
