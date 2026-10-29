// =============================================================================
// Approved Finalist Arabic glossary (Phase 1).
//
// APPROVED by the product owner. Recorded here as data so later phases wire it
// from a single source. NOT rendered anywhere yet — UI wiring is Phase 10/11
// and is Figma-gated. Do not import this into `@/lib/labels` or any component
// until the relevant screen is approved.
// =============================================================================

/** Canonical concept key → approved Arabic label. */
export const GLOSSARY_AR = {
  EMTITHAL_READINESS_INDEX: "مؤشر جاهزية سبّاق",
  VERIFICATION_COVERAGE: "نسبة التحقق",

  // Compliance statuses (matrix §3).
  COMPLIANT: "ملتزم",
  PARTIALLY_COMPLIANT: "ملتزم جزئيًا",
  NON_COMPLIANT: "غير ملتزم",
  PENDING_VERIFICATION: "بانتظار التحقق",
  INSUFFICIENT_DATA: "بيانات غير كافية",
  NOT_APPLICABLE: "لا ينطبق",

  UNRESOLVED_REQUIREMENT: "متطلب قيد الاستكمال",
  SUB_REQUIREMENT: "متطلب فرعي",
  CRITICAL_BLOCKER: "عائق حرج",

  // Data source states.
  DATA_SOURCE_CONNECTED: "متصل",
  DATA_SOURCE_NOT_CONNECTED: "غير متصل",
  DATA_SOURCE_IMPORTED: "بيانات مستوردة",
  DATA_SOURCE_PENDING_LINK: "بانتظار الربط",
} as const;

export type GlossaryKey = keyof typeof GLOSSARY_AR;
