import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-primary/[0.06] bg-surface-low/50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs space-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-primary"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-container text-xs text-on-primary">
                B
              </span>
              Barc
            </Link>
            <p className="text-sm leading-relaxed text-on-surface-muted">
              AI-guided pet health for dogs and cats—grounded in veterinary
              knowledge, built for real conversations.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-on-surface-muted transition hover:text-secondary"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-primary/[0.06] pt-8 text-xs text-on-surface-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Barc Pet Telehealth. All rights reserved.</p>
          <p>Educational guidance only — not a substitute for in-person veterinary care.</p>
        </div>
      </div>
    </footer>
  );
}
