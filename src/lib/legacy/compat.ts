// =============================================================================
// Temporary legacy ↔ canonical adapters (Phase 1).
//
// The running app still uses the legacy lowercase compliance vocabulary and the
// legacy CR-00x requirement IDs. These adapters bridge to the canonical model
// so Phase 3 can migrate consumers one at a time. Delete when no legacy
// consumer remains.
// =============================================================================

import type { LegacyComplianceStatus } from "@/lib/types";
import type { ComplianceStatus } from "@/lib/model";
import { resolveRequirementId, toLegacyRequirementId } from "@/lib/data/regulatory";

/** Plan §B8 mapping. */
export const LEGACY_TO_CANONICAL_STATUS: Record<LegacyComplianceStatus, ComplianceStatus> = {
  compliant: "COMPLIANT",
  partially_compliant: "PARTIALLY_COMPLIANT",
  non_compliant: "NON_COMPLIANT",
  needs_review: "PENDING_VERIFICATION",
  not_assessed: "INSUFFICIENT_DATA",
};

/**
 * Canonical → legacy. The legacy union has no `NOT_APPLICABLE`; it maps to
 * `not_assessed` so pre-migration screens keep rendering. Real applicability
 * handling arrives with the Phase 2/3 engine.
 */
export const CANONICAL_TO_LEGACY_STATUS: Record<ComplianceStatus, LegacyComplianceStatus> = {
  COMPLIANT: "compliant",
  PARTIALLY_COMPLIANT: "partially_compliant",
  NON_COMPLIANT: "non_compliant",
  PENDING_VERIFICATION: "needs_review",
  INSUFFICIENT_DATA: "not_assessed",
  NOT_APPLICABLE: "not_assessed",
};

export function toCanonicalStatus(status: LegacyComplianceStatus): ComplianceStatus {
  return LEGACY_TO_CANONICAL_STATUS[status];
}

export function toLegacyStatus(status: ComplianceStatus): LegacyComplianceStatus {
  return CANONICAL_TO_LEGACY_STATUS[status];
}

export { resolveRequirementId, toLegacyRequirementId };
