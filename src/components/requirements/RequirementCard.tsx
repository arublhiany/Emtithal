import Link from "next/link";
import type { Requirement } from "@/lib/types";
import { StatusBadge, RiskBadge, DemoConfigBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ScoreRing";

export function RequirementCard({
  requirement,
  compact = false,
}: {
  requirement: Requirement;
  compact?: boolean;
}) {
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
          {requirement.score}
        </span>
      </div>

      <ProgressBar value={requirement.score} />

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
          الوزن: {requirement.weight}%
        </span>
        <DemoConfigBadge />
      </div>
    </Link>
  );
}
