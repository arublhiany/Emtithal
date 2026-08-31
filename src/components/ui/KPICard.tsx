import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

function TrendMark({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "flat") return <span aria-hidden>—</span>;
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: direction === "down" ? "rotate(180deg)" : undefined }}
    >
      <path d="M6 3v6M3 6l3-3 3 3" />
    </svg>
  );
}

export function KPICard({
  label,
  value,
  suffix,
  toneClass,
  icon,
  trend,
  hint,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  toneClass?: string;
  icon?: ReactNode;
  trend?: { direction: "up" | "down" | "flat"; label: string };
  hint?: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-ink-muted)]">{label}</span>
        {icon && (
          <span className="text-lg opacity-80" aria-hidden>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end gap-1.5">
        <span className={`text-3xl font-bold tabular-nums ${toneClass ?? "text-[var(--color-ink)]"}`}>
          {value}
        </span>
        {suffix && <span className="text-sm text-[var(--color-ink-muted)] mb-1">{suffix}</span>}
      </div>
      {trend && (
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            trend.direction === "up"
              ? "text-[var(--color-status-compliant)]"
              : trend.direction === "down"
                ? "text-[var(--color-status-noncompliant)]"
                : "text-[var(--color-ink-muted)]"
          }`}
        >
          <TrendMark direction={trend.direction} /> {trend.label}
        </span>
      )}
      {hint && <span className="text-xs text-[var(--color-ink-faint)]">{hint}</span>}
    </Card>
  );
}
