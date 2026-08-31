// =============================================================================
// DEMO_DATA verification inputs (Phase 3) — the minimum fictional inputs needed
// to exercise the Verification Engine across every status, including one
// Critical Blocker.
//
// Explicitly DEMO_DATA. NOT from a government integration. Qualitative
// sub-requirement labels are taken verbatim from each requirement's matrix
// "Verification Areas" (no invented sub-requirements). Quantitative targets /
// actuals are fictional demo figures — the engine never derives a target.
// =============================================================================

import { DATA_SOURCE } from "@/lib/mode";
import { getRequirementByCanonicalId } from "@/lib/data/regulatory";
import type {
  RequirementVerificationInput,
  SubRequirementState,
} from "@/lib/engine/verificationEngine";

function qualitative(id: string, states: SubRequirementState[]): RequirementVerificationInput {
  const areas = getRequirementByCanonicalId(id)?.verificationAreasAr ?? [];
  if (areas.length !== states.length) {
    throw new Error(
      `DEMO verification input for ${id}: expected ${areas.length} sub-requirement states, got ${states.length}`,
    );
  }
  return {
    requirementId: id,
    mode: "QUALITATIVE",
    subRequirements: areas.map((labelAr, i) => ({
      key: `${id}-sub-${i + 1}`,
      labelAr,
      state: states[i],
    })),
    origin: DATA_SOURCE.DEMO_DATA,
  };
}

function quantitative(
  id: string,
  target: { value: number; verification: "VERIFIED" | "PENDING_VERIFICATION" | "UNVERIFIED" },
  actual: { value: number; verification: "VERIFIED" | "PENDING_VERIFICATION" | "UNVERIFIED" },
): RequirementVerificationInput {
  return {
    requirementId: id,
    mode: "QUANTITATIVE",
    target: { value: target.value, verification: target.verification, sourceAr: "نتيجة تفتيش رسمية — بيانات عرض" },
    actual: { value: actual.value, verification: actual.verification, sourceAr: "نتيجة تفتيش ميدانية — بيانات عرض" },
    origin: DATA_SOURCE.DEMO_DATA,
  };
}

const V = "VERIFIED" as const;
const P = "PENDING_VERIFICATION" as const;

export const DEMO_VERIFICATION_INPUTS: RequirementVerificationInput[] = [
  // --- Experience track (qualitative, areas verbatim from the matrix) --------
  // HAJ-EXP-01: all 6 verified satisfied → COMPLIANT / 100
  qualitative("HAJ-EXP-01", ["SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "SATISFIED_VERIFIED"]),
  // HAJ-EXP-02: one item has no data → INSUFFICIENT_DATA
  qualitative("HAJ-EXP-02", ["SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "UNSATISFIED_VERIFIED", "NO_DATA", "SATISFIED_VERIFIED"]),
  // HAJ-EXP-03: all 4 verified unsatisfied → NON_COMPLIANT / 0 (REQUIRED, not a blocker)
  qualitative("HAJ-EXP-03", ["UNSATISFIED_VERIFIED", "UNSATISFIED_VERIFIED", "UNSATISFIED_VERIFIED", "UNSATISFIED_VERIFIED"]),
  // HAJ-EXP-04: 5 satisfied / 3 unsatisfied (all verified) → PARTIALLY_COMPLIANT / 63
  qualitative("HAJ-EXP-04", ["SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "UNSATISFIED_VERIFIED", "UNSATISFIED_VERIFIED", "UNSATISFIED_VERIFIED"]),
  // HAJ-EXP-05: one item awaits verification → PENDING_VERIFICATION
  qualitative("HAJ-EXP-05", ["SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "SATISFIED_VERIFIED", "PENDING_VERIFICATION"]),

  // --- Hajj operational -----------------------------------------------------
  // HAJ-CAMP-01 (CRITICAL): 2/2 sites verified compliant → COMPLIANT / 100 (not a blocker)
  quantitative("HAJ-CAMP-01", { value: 2, verification: V }, { value: 2, verification: V }),
  // HAJ-CATERING-01: no verification data yet → INSUFFICIENT_DATA
  { requirementId: "HAJ-CATERING-01", mode: "NONE", origin: DATA_SOURCE.DEMO_DATA },

  // --- Civil Defense (each applicable site must satisfy the safety condition) -
  // CIV-01 (CRITICAL): 1/2 sites verified compliant → PARTIALLY_COMPLIANT / 50
  quantitative("CIV-01", { value: 2, verification: V }, { value: 1, verification: V }),
  // CIV-02 (REQUIRED): 2/2 → COMPLIANT / 100
  quantitative("CIV-02", { value: 2, verification: V }, { value: 2, verification: V }),
  // CIV-03 (CRITICAL): 0/2 sites verified compliant → NON_COMPLIANT / 0 → CRITICAL BLOCKER
  quantitative("CIV-03", { value: 2, verification: V }, { value: 0, verification: V }),
  // CIV-04 (CRITICAL): actual still awaiting verification → PENDING_VERIFICATION (NOT a blocker)
  quantitative("CIV-04", { value: 2, verification: V }, { value: 1, verification: P }),
  // CIV-05 (CRITICAL): 2/2 → COMPLIANT / 100
  quantitative("CIV-05", { value: 2, verification: V }, { value: 2, verification: V }),
];
