import type { AlertItem, AlertType } from "@/lib/types";
import { RiskBadge } from "@/components/ui/Badge";

const TYPE_ICON: Record<AlertType, string> = {
  critical_gap: "🚨",
  missing_evidence: "📎",
  evidence_expiring: "⏳",
  requirement_deterioration: "📉",
  action_overdue: "⏰",
  high_risk_decision: "🧭",
};

export function AlertCard({
  alert,
  onMarkRead,
  compact = false,
}: {
  alert: AlertItem;
  onMarkRead?: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
        alert.isRead
          ? "border-[var(--color-border)] bg-[var(--color-surface)]"
          : "border-[var(--color-border-strong)] bg-[var(--color-bg)]"
      }`}
    >
      <span className="text-lg shrink-0" aria-hidden>
        {TYPE_ICON[alert.type]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-semibold text-[var(--color-ink)]">{alert.titleAr}</p>
          <RiskBadge level={alert.severity} size="sm" />
          {!alert.isRead && (
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" aria-hidden />
          )}
        </div>
        {!compact && (
          <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
            {alert.descriptionAr}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[11px] text-[var(--color-ink-faint)]">{alert.createdAtLabel}</span>
          {alert.requirementId && (
            <span className="text-[11px] text-[var(--color-ink-faint)]">
              معيار {alert.requirementId}
            </span>
          )}
          {onMarkRead && !alert.isRead && (
            <button
              onClick={() => onMarkRead(alert.id)}
              className="text-[11px] font-medium text-[var(--color-primary)] hover:underline"
            >
              وضع كمقروء
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
