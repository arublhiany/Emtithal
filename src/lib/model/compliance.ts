// =============================================================================
// Canonical compliance vocabulary — Finalist model (Phase 1).
//
// These are the ONLY compliance statuses the Finalist data model recognises,
// transcribed from REGULATORY_MATRIX_v1.md §3. The legacy lowercase union
// (`LegacyComplianceStatus` in `@/lib/types`) is kept alive only through the
// adapters in `@/lib/legacy/compat` until the Phase 3 verification migration.
//
// Nothing in the running app consumes these yet — this file is additive.
// =============================================================================

export const COMPLIANCE_STATUSES = [
  "COMPLIANT",
  "PARTIALLY_COMPLIANT",
  "NON_COMPLIANT",
  "PENDING_VERIFICATION",
  "INSUFFICIENT_DATA",
  "NOT_APPLICABLE",
] as const;

export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

/**
 * Outcome of the (Phase 2) Applicability Engine for one requirement against one
 * company profile. `INSUFFICIENT_DATA` when the applicability rule cannot be
 * evaluated from explicitly declared company facts — never assumed applicable.
 */
export const APPLICABILITY_OUTCOMES = [
  "APPLICABLE",
  "NOT_APPLICABLE",
  "INSUFFICIENT_DATA",
] as const;

export type ApplicabilityOutcome = (typeof APPLICABILITY_OUTCOMES)[number];
