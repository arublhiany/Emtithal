// =============================================================================
// Canonical verification result shapes — Finalist (Phase 1, types only).
//
// The deterministic Verification Engine that produces these lands in Phase 3.
// This file only fixes the shape so later phases and tests share one definition.
// =============================================================================

import type { ComplianceStatus } from "./compliance";

export type ValueVerification = "VERIFIED" | "PENDING_VERIFICATION" | "UNVERIFIED";

/** A number that must always carry its own provenance (matrix §8, §13). */
export interface SourcedValue {
  value: number | null;
  sourceAr: string | null;
  lastUpdatedAr: string | null;
  verification: ValueVerification;
}

export interface RequirementVerification {
  /** Canonical matrix ID. */
  requirementId: string;
  status: ComplianceStatus;
  /** Target never AI-derived (matrix §8). `null` for qualitative requirements. */
  target: SourcedValue | null;
  actual: SourcedValue | null;
  /** `target - actual` where both exist; otherwise `null`. */
  gap: number | null;
  /** Sub-requirement checklist outcome for qualitative requirements. */
  subRequirements: SubRequirementResult[];
  evidenceRefs: string[];
  verificationRuleApplied: string | null;
  lastVerifiedAtAr: string | null;
}

export interface SubRequirementResult {
  id: string;
  labelAr: string;
  satisfied: boolean;
  evidenceRefs: string[];
}
