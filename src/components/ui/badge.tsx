import { cn } from "@/lib/cn";

const variants = {
  default: "bg-tertiary/20 text-primary-container",
  accent: "bg-secondary-bright/15 text-secondary",
  muted: "bg-surface-high text-on-surface-muted",
  live: "bg-secondary-bright/20 text-secondary",
} as const;

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
