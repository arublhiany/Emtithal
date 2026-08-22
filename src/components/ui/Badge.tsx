import type { ReactNode } from "react";
import type {
  ActionStatus,
  ComplianceStatus,
  ConfidenceLevel,
  RiskLevel,
} from "@/lib/types";
import {
  ACTION_STATUS_LABEL,
  ACTION_STATUS_TONE,
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  RISK_LABEL,
  RISK_TONE,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/labels";

function BaseBadge({
  children,
  fg,
  bg,
  dot,
  size = "md",
}: {
  children: ReactNode;
  fg: string;
  bg: string;
  dot?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      }`}
      style={{ color: fg, background: bg }}
    >
      {dot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: dot }}
        />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  size,
}: {
  status: ComplianceStatus;
  size?: "sm" | "md";
}) {
  const tone = STATUS_TONE[status];
  return (
    <BaseBadge fg={tone.fg} bg={tone.bg} dot={tone.dot} size={size}>
      {STATUS_LABEL[status]}
    </BaseBadge>
  );
}

export function RiskBadge({ level, size }: { level: RiskLevel; size?: "sm" | "md" }) {
  if (level === "none") return null;
  const tone = RISK_TONE[level];
  return (
    <BaseBadge fg={tone.fg} bg={tone.bg} size={size}>
      خطر {RISK_LABEL[level]}
    </BaseBadge>
  );
}

export function ConfidenceBadge({
  level,
  size,
}: {
  level: ConfidenceLevel;
  size?: "sm" | "md";
}) {
  const tone = CONFIDENCE_TONE[level];
  return (
    <BaseBadge fg={tone.fg} bg={tone.bg} size={size}>
      ثقة الذكاء الاصطناعي: {CONFIDENCE_LABEL[level]}
    </BaseBadge>
  );
}

export function ActionStatusBadge({
  status,
  size,
}: {
  status: ActionStatus;
  size?: "sm" | "md";
}) {
  const tone = ACTION_STATUS_TONE[status];
  return (
    <BaseBadge fg={tone.fg} bg={tone.bg} size={size}>
      {ACTION_STATUS_LABEL[status]}
    </BaseBadge>
  );
}

export function NeedsHumanReviewBadge({ size }: { size?: "sm" | "md" }) {
  return (
    <BaseBadge
      fg="var(--color-status-review)"
      bg="var(--color-status-review-bg)"
      size={size}
    >
      ⟡ يحتاج مراجعة بشرية
    </BaseBadge>
  );
}

export function DemoConfigBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <BaseBadge fg="var(--color-accent-dark)" bg="var(--color-accent-tint)" size={size}>
      تكوين تجريبي — غير معتمد رسميًا
    </BaseBadge>
  );
}

export function SimulatedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <BaseBadge fg="var(--color-accent-dark)" bg="var(--color-accent-tint)" size={size}>
      محاكاة استرشادية — ليست قرارًا رقابيًا رسميًا
    </BaseBadge>
  );
}
