import type { DecisionAlternative } from "@/lib/types";
import { RiskBadge } from "@/components/ui/Badge";

const IMPACT_LABEL: Record<DecisionAlternative["complianceImpact"], string> = {
  positive: "أثر إيجابي على الجاهزية",
  neutral: "أثر محايد على الجاهزية",
  low_negative: "أثر سلبي محدود",
  high_negative: "أثر سلبي مرتفع",
};

const IMPACT_TONE: Record<DecisionAlternative["complianceImpact"], string> = {
  positive: "var(--color-status-compliant)",
  neutral: "var(--color-ink-muted)",
  low_negative: "var(--color-status-partial)",
  high_negative: "var(--color-status-noncompliant)",
};

export function ScenarioCompareCard({ alt }: { alt: DecisionAlternative }) {
  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        alt.isRecommended
          ? "border-[var(--color-primary)] bg-[var(--color-primary-tint)] shadow-[var(--shadow-card)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--color-ink)]">{alt.labelAr}</p>
        {alt.isRecommended && (
          <span className="shrink-0 rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[10px] font-bold text-white whitespace-nowrap">
            الخيار الموصى به
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">{alt.descriptionAr}</p>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="font-medium" style={{ color: IMPACT_TONE[alt.complianceImpact] }}>
          {IMPACT_LABEL[alt.complianceImpact]}
        </span>
        <RiskBadge level={alt.operationalRisk} size="sm" />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
        <span className="text-[11px] text-[var(--color-ink-muted)]">الجاهزية المتوقعة</span>
        <span className="text-lg font-bold tabular-nums text-[var(--color-ink)]">
          {alt.predictedOverallScore}
        </span>
      </div>
      <p className="text-[11px] text-[var(--color-ink-faint)] leading-relaxed">
        {alt.feasibilityAr}
      </p>
    </div>
  );
}
