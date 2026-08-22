// =============================================================================
// Centralized Arabic labels + visual tokens for status/risk/confidence enums.
// Keeping this in one place ensures every screen renders the same status
// vocabulary defined in EMTITHAL_MASTER_SPEC.md / MVP_REQUIREMENTS.md.
// =============================================================================

import type {
  ActionPriority,
  ActionStatus,
  ComplianceStatus,
  ConfidenceLevel,
  EvidenceDimensionState,
  EvidenceValidationStatus,
  RiskLevel,
  SupportTicketStatus,
} from "@/lib/types";

export const STATUS_LABEL: Record<ComplianceStatus, string> = {
  compliant: "ملتزم",
  partially_compliant: "ملتزم جزئيًا",
  non_compliant: "غير ملتزم",
  needs_review: "يحتاج مراجعة",
  not_assessed: "غير مقيّم",
};

export const STATUS_TONE: Record<
  ComplianceStatus,
  { fg: string; bg: string; dot: string }
> = {
  compliant: {
    fg: "var(--color-status-compliant)",
    bg: "var(--color-status-compliant-bg)",
    dot: "var(--color-status-compliant)",
  },
  partially_compliant: {
    fg: "var(--color-status-partial)",
    bg: "var(--color-status-partial-bg)",
    dot: "var(--color-status-partial)",
  },
  non_compliant: {
    fg: "var(--color-status-noncompliant)",
    bg: "var(--color-status-noncompliant-bg)",
    dot: "var(--color-status-noncompliant)",
  },
  needs_review: {
    fg: "var(--color-status-review)",
    bg: "var(--color-status-review-bg)",
    dot: "var(--color-status-review)",
  },
  not_assessed: {
    fg: "var(--color-status-notassessed)",
    bg: "var(--color-status-notassessed-bg)",
    dot: "var(--color-status-notassessed)",
  },
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  critical: "حرج",
  high: "مرتفع",
  medium: "متوسط",
  low: "منخفض",
  none: "لا يوجد",
};

export const RISK_TONE: Record<RiskLevel, { fg: string; bg: string }> = {
  critical: { fg: "var(--color-risk-critical)", bg: "var(--color-risk-critical-bg)" },
  high: { fg: "var(--color-risk-high)", bg: "var(--color-risk-high-bg)" },
  medium: { fg: "var(--color-risk-medium)", bg: "var(--color-risk-medium-bg)" },
  low: { fg: "var(--color-risk-low)", bg: "var(--color-risk-low-bg)" },
  none: { fg: "var(--color-ink-muted)", bg: "var(--color-border)" },
};

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
};

export const CONFIDENCE_TONE: Record<ConfidenceLevel, { fg: string; bg: string }> = {
  high: { fg: "var(--color-status-compliant)", bg: "var(--color-status-compliant-bg)" },
  medium: { fg: "var(--color-status-partial)", bg: "var(--color-status-partial-bg)" },
  low: { fg: "var(--color-status-noncompliant)", bg: "var(--color-status-noncompliant-bg)" },
};

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  not_started: "لم يبدأ",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
};

export const ACTION_STATUS_TONE: Record<ActionStatus, { fg: string; bg: string }> = {
  not_started: { fg: "var(--color-status-notassessed)", bg: "var(--color-status-notassessed-bg)" },
  in_progress: { fg: "var(--color-status-partial)", bg: "var(--color-status-partial-bg)" },
  completed: { fg: "var(--color-status-compliant)", bg: "var(--color-status-compliant-bg)" },
};

export const PRIORITY_LABEL: Record<ActionPriority, string> = {
  critical: "حرجة",
  high: "مرتفعة",
  medium: "متوسطة",
  low: "منخفضة",
};

export const EVIDENCE_DIMENSION_STATE_LABEL: Record<EvidenceDimensionState, string> = {
  found: "موجودة",
  missing: "مفقودة",
  unclear: "غير واضحة",
  pending_verification: "بانتظار التحقق",
};

export const EVIDENCE_VALIDATION_LABEL: Record<EvidenceValidationStatus | "missing", string> = {
  verified: "مُتحقق منه",
  pending_verification: "بانتظار التحقق",
  needs_review: "يحتاج مراجعة",
  rejected: "مرفوض",
  missing: "مفقود",
};

export const TICKET_STATUS_LABEL: Record<SupportTicketStatus, string> = {
  open: "مفتوحة",
  under_review: "قيد المراجعة",
  waiting_for_user: "بانتظار المستخدم",
  resolved: "تم الحل",
  closed: "مغلقة",
};

export const DECISION_CATEGORY_LABEL_FALLBACK = "قرار تشغيلي";

export const COMPANY_ROLE_LABEL: Record<string, string> = {
  compliance_officer: "مسؤول الامتثال",
  operations_manager: "مدير العمليات",
  decision_maker: "صانع القرار",
  ministry_user: "مستخدم الوزارة",
};
