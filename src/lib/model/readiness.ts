// =============================================================================
// Emtithal Readiness Index — canonical shapes + LOCKED V1 formula spec.
// Finalist (Phase 1, types + documented formula only).
//
// The engine that computes these values lands in Phase 3. The V1 formula is
// locked (Correction 3) and reproduced here so the implementation cannot drift:
//
//   Requirement-level readiness
//   ---------------------------
//   • Quantitative requirement with a VERIFIED target AND a VERIFIED actual:
//         min(actual / target, 1) * 100
//   • Qualitative requirement:
//         (verified-satisfied required sub-requirements
//            / total required sub-requirements) * 100
//   • If required data is insufficient: NO readiness score; the requirement
//     stays INSUFFICIENT_DATA.
//
//   Overall Emtithal Readiness Index
//   --------------------------------
//   • Simple UNWEIGHTED average of the readiness values of assessable,
//     APPLICABLE requirements.
//   • No official weights are used (published or not).
//   • NOT_APPLICABLE requirements are excluded.
//   • INSUFFICIENT_DATA requirements are excluded from the average — never
//     counted as 0 or 100.
//   • If no applicable requirement is assessable: value = null (NOT 0).
//
//   Verification Coverage (separate metric)
//   ---------------------------------------
//         (assessable applicable requirements / all applicable requirements) * 100
//
//   Critical Blockers
//   -----------------
//   • Requirements assigned CRITICAL internal criticality that are
//     NON_COMPLIANT. Remain visible regardless of the Readiness Index value.
//   • Empty until the internalCriticality mapping is approved.
// =============================================================================

export type ReadinessBasis = "quantitative" | "qualitative" | "insufficient_data";

export interface RequirementReadiness {
  /** Canonical matrix ID. */
  requirementId: string;
  /** 0–100, or `null` when `basis` is `"insufficient_data"`. */
  value: number | null;
  basis: ReadinessBasis;
}

export interface ReadinessIndex {
  /** 0–100, or `null` when no applicable requirement is assessable. */
  value: number | null;
  /** How many requirement readiness values fed the average. */
  assessableCount: number;
  applicableCount: number;
}

export interface VerificationCoverage {
  /** 0–100. */
  value: number;
  assessableCount: number;
  applicableCount: number;
}

export interface CriticalBlocker {
  requirementId: string;
  titleAr: string;
  authorityId: string;
  reasonAr: string;
}
