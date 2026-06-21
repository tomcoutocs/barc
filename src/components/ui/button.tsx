import Link from "next/link";
import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-primary-container text-on-primary shadow-elevated hover:bg-primary hover:shadow-glow active:scale-[0.98]",
  secondary:
    "bg-surface-high/80 text-primary hover:bg-surface-high active:scale-[0.98]",
  outline:
    "bg-surface/60 text-primary-container ring-1 ring-primary/10 hover:bg-surface-low hover:ring-primary/20",
  ghost: "text-primary hover:bg-surface-high/70",
  accent:
    "bg-secondary-bright text-on-primary shadow-elevated hover:brightness-110 active:scale-[0.98]",
} as const;

const sizes = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-sm",
} as const;

type ButtonVariant = keyof typeof variants;
type ButtonSize = keyof typeof sizes;

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-bold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-bright/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: SharedProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: SharedProps & { href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
