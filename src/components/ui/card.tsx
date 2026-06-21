import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-surface-low/90 p-6 shadow-soft ring-1 ring-primary/[0.04] backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardElevated({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-surface p-6 shadow-elevated ring-1 ring-primary/[0.05]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
