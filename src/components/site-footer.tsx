import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/help", label: "Help Center" },
  { href: "/contact", label: "Contact Us" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[color-mix(in_srgb,var(--color-on-surface)_8%,transparent)] bg-[var(--color-surface)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-sm text-[var(--color-on-surface-muted)] sm:flex-row sm:px-6">
        <Link
          href="/"
          className="text-base font-extrabold tracking-tight text-[var(--color-primary)]"
        >
          Barc
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-[var(--color-secondary)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-center sm:text-right">
          © {new Date().getFullYear()} Barc Pet Telehealth. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
