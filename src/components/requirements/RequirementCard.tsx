import Link from "next/link";
import type { Requirement } from "@/lib/types";
import { StatusBadge, RiskBadge, DemoConfigBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/viz";
import {
  OFFICIAL_WEIGHT_LABEL_AR,
  officialWeightText,
  show,
} from "@/lib/ui/status";

export function RequirementCard({
  requirement,
  officialWeightPercent = null,
  compact = false,
}: {
  requirement: Requirement;
  /** Published within-track weight, or null where the matrix publishes none. */
  officialWeightPercent?: number | null;
  compact?: boolean;
}) {
  // Canonical readiness is authoritative when present. `null` = not assessable
  // (PENDING / INSUFFICIENT) → render "—", never 0.
  const canonical = requirement.canonicalReadiness;
  const hasCanonical = canonical !== undefined;
  const readinessAvailable = hasCanonical ? canonical !== null : true;
  const shownValue = hasCanonical ? canonical : requirement.score;

  return (
    <Link
      href={`/company/compliance/${requirement.id}`}
      className="card p-5 flex flex-col gap-3 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-border-strong)] transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-[var(--color-ink-faint)] mb-1">
            {requirement.id}
            {requirement.criticalGate && (
              <span className="text-[var(--color-status-noncompliant)]"> · معيار حرج</span>
            )}
          </p>
          <h3 className="text-sm font-semibold text-[var(--color-ink)] leading-snug">
            {requirement.nameAr}
          </h3>
        </div>
        <span className="text-2xl font-bold tabular-nums text-[var(--color-ink)] shrink-0">
          {readinessAvailable ? show(shownValue ?? null) : "—"}
        </span>
      </div>

      <ProgressBar
        value={readinessAvailable ? (shownValue ?? null) : null}
        tone={
          requirement.complianceStatus === "compliant"
            ? "green"
            : requirement.complianceStatus === "non_compliant"
              ? "red"
              : requirement.complianceStatus === "partially_compliant"
                ? "amber"
                : "neutral"
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={requirement.complianceStatus} size="sm" />
        <RiskBadge level={requirement.riskLevel} size="sm" />
      </div>

      {!compact && (
        <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed line-clamp-2">
          {requirement.gapExplanationAr}
        </p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]">
        <span className="text-[11px] text-[var(--color-ink-faint)]">
          {OFFICIAL_WEIGHT_LABEL_AR}: {officialWeightText(officialWeightPercent)}
        </span>
        <DemoConfigBadge />
      </div>
    </Link>
  );
}
