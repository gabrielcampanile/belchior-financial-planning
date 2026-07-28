import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataKind = "REAL" | "PLANEJADO" | "PROJETADO";

export function DataBadge({ kind, className }: { kind: DataKind; className?: string }) {
  const tone =
    kind === "REAL"
      ? "border-positive/30 text-positive"
      : kind === "PLANEJADO"
        ? "border-primary/30 text-primary"
        : "border-border-strong text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest",
        tone,
        className,
      )}
    >
      {kind}
    </span>
  );
}

export function MetricValue({
  label,
  value,
  hint,
  tone = "neutral",
  badge,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative" | "accent";
  badge?: DataKind;
  className?: string;
}) {
  const valueTone =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : tone === "accent"
          ? "text-primary"
          : "text-foreground";
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <p className="min-w-0 truncate text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {badge ? <DataBadge kind={badge} /> : null}
      </div>
      <p className={cn("mt-3 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl", valueTone)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function AssumptionNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-border bg-surface/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5", className)}>{children}</section>
  );
}
