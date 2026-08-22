import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

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
          className={`text-xs font-medium ${
            trend.direction === "up"
              ? "text-[var(--color-status-compliant)]"
              : trend.direction === "down"
                ? "text-[var(--color-status-noncompliant)]"
                : "text-[var(--color-ink-muted)]"
          }`}
        >
          {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "—"} {trend.label}
        </span>
      )}
      {hint && <span className="text-xs text-[var(--color-ink-faint)]">{hint}</span>}
    </Card>
  );
}
