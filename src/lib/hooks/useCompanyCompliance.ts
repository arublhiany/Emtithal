"use client";

import { useMemo } from "react";
import { getRequirements } from "@/lib/data/requirements";
import { getGaps } from "@/lib/data/gaps";
import { getRisks } from "@/lib/data/risks";
import { getCompanyProfile } from "@/lib/data/company";
import { computeReadinessLabel } from "@/lib/engine/scoringEngine";
import { getDemoVerificationRun } from "@/lib/engine/complianceView";
import { resolveRequirementId } from "@/lib/data/regulatory";
import { toLegacyStatus } from "@/lib/legacy/compat";
import type { ComplianceStatus } from "@/lib/model";
import type { RiskLevel } from "@/lib/types";

/**
 * Legacy risk-chart projection of a canonical verification status. This is a
 * DISPLAY projection for the pre-Phase-11 risk-distribution chart, NOT an
 * assessed risk severity — the Verification Engine invents no HIGH/MEDIUM tier.
 */
const LEGACY_RISK_FOR_STATUS: Record<ComplianceStatus, RiskLevel> = {
  COMPLIANT: "none",
  PARTIALLY_COMPLIANT: "medium",
  NON_COMPLIANT: "high",
  PENDING_VERIFICATION: "low",
  INSUFFICIENT_DATA: "low",
  NOT_APPLICABLE: "none",
};

/**
 * Canonical compliance view for the demo company. Compliance status, requirement
 * readiness, the Emtithal Readiness Index, Verification Coverage, Critical
 * Blockers, and verification gaps all come from the deterministic Verification
 * Engine (Phase 3). The legacy weighted 20%-per-criterion model and the
 * `getGaps()` / `getRisks()` demo narrative NEVER drive any canonical value.
 * No Official Score and no company-wide compliance status are computed.
 */
export function useCompanyCompliance() {
  return useMemo(() => {
    const run = getDemoVerificationRun();
    const resultByCanonicalId = new Map(run.results.map((r) => [r.requirementId, r]));

    // The five legacy experience-requirement cards keep their existing shape,
    // but status / readiness now come from the canonical engine (via legacy-ID
    // alias). `canonicalReadiness` is null for PENDING / INSUFFICIENT — the card
    // renders "—", never 0.
    const requirements = getRequirements().map((r) => {
      const canonicalId = resolveRequirementId(r.id);
      const res = canonicalId ? resultByCanonicalId.get(canonicalId) : undefined;
      if (!res) return r;
      return {
        ...r,
        score: res.readiness ?? 0, // legacy field only
        canonicalReadiness: res.readiness, // number | null — authoritative for display
        complianceStatus: toLegacyStatus(res.status),
        riskLevel: LEGACY_RISK_FOR_STATUS[res.status],
      };
    });

    const profile = getCompanyProfile();

    // LEGACY_DEMO_ONLY — for the legacy /company/gaps and /ministry/risks pages
    // only. Not used in any canonical KPI below.
    const legacyDemoGaps = getGaps();
    const legacyDemoRisks = getRisks();

    const readinessValue = run.readiness.value; // rounded display, or null
    const readinessRaw = run.readiness.rawValue; // exact, or null
    const verificationCoverage = run.coverage.value; // rounded display, or null
    const readinessAvailable = readinessValue != null;

    const criticalBlockers = run.criticalBlockers;
    const hasUnresolvedCriticalGate = criticalBlockers.length > 0;

    const readiness = !readinessAvailable
      ? { labelAr: "بيانات غير كافية لحساب مؤشر الجاهزية", tone: "warning" as const }
      : computeReadinessLabel(readinessValue as number, hasUnresolvedCriticalGate);

    return {
      requirements,
      profile,

      // Canonical Emtithal Readiness Index V1 (unweighted mean of assessable
      // eligible requirements). `null` when nothing is assessable — surfaces
      // must render "—" / "بيانات غير كافية", NEVER 0.
      readinessValue,
      readinessRaw,
      readinessAvailable,
      verificationCoverage,
      readiness,

      criticalBlockers,
      criticalBlockerCount: criticalBlockers.length,
      hasUnresolvedCriticalGate,
      verificationGaps: run.verificationGaps,

      statusCounts: run.statusCounts,
      regulatoryPendingCount: run.regulatoryPendingCount,
      regulatoryPendingIds: run.regulatoryPendingIds,
      applicabilityPendingCount: run.applicabilityPendingCount,
      applicabilityPendingIds: run.applicabilityPendingIds,
      pendingWarnings: run.pendingWarnings,
      insufficientDataWarnings: run.insufficientDataWarnings,
      officialWeightsDisplayOnly: run.officialWeightsDisplayOnly,
      run,

      // LEGACY_DEMO_ONLY — old dedicated pages only.
      gaps: legacyDemoGaps,
      risks: legacyDemoRisks,
    };
  }, []);
}
