// =============================================================================
// Compliance view — the single place the existing app reads the canonical
// Verification Engine result for the demo company (Phase 3 migration).
//
// Replaces the legacy weighted 20%-per-criterion `computeOverallScore` path as
// the compliance engine. Pure; recomputed on call (cheap).
// =============================================================================

import { getRegulatoryRequirements } from "@/lib/data/regulatory";
import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
import { DEMO_VERIFICATION_INPUTS } from "@/lib/data/demo/verificationInputs";
import { verifyAll, type VerificationRun } from "@/lib/engine/verificationEngine";

/** Full canonical verification run for the demo company. */
export function getDemoVerificationRun(): VerificationRun {
  return verifyAll(getRegulatoryRequirements(), DEMO_COMPANY_PROFILE, DEMO_VERIFICATION_INPUTS);
}

/** Emtithal Readiness Index V1 for the demo company — `null` when nothing is assessable. */
export function getDemoReadinessValue(): number | null {
  return getDemoVerificationRun().readiness.value;
}
