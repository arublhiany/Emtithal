// =============================================================================
// Ministry Control Center — legacy portfolio fixture (compat-only; the live
// government screens now use `useGovernmentPortfolio`). The primary demo
// company row is computed live from the compliance engine and follows the
// canonical identity in `@/lib/data/company`; the remaining rows are static
// illustrative summaries. All are fictional.
// =============================================================================

import type { MinistryCompanySummary } from "@/lib/types";
import { getCompanyProfile } from "@/lib/data/company";
import { getSeedActions } from "@/lib/data/actions";
import { getDemoVerificationRun } from "@/lib/engine/complianceView";

/**
 * The demo company's portfolio row exposes the canonical Verification Engine
 * facts (Readiness Index V1, Verification Coverage, blocker / regulatory /
 * applicability-pending counts). It does NOT infer a company-wide regulatory
 * compliance status from Readiness — no approved rule exists for that, so
 * `status` stays a neutral `"not_assessed"` (compatibility-only), and no
 * Official Score is computed.
 */
function getDemoCompanySummary(): MinistryCompanySummary {
  const profile = getCompanyProfile();
  const run = getDemoVerificationRun();
  const readiness = run.readiness.value;

  return {
    id: profile.id,
    nameAr: profile.nameAr,
    // Legacy-compat display number only (see type doc). Prefer `readiness`.
    overallScore: readiness ?? 0,
    // No company-wide compliance judgment is derived from Readiness.
    status: "not_assessed",
    // Only reflects the presence of a canonical Critical Blocker — not an
    // invented risk tier.
    riskLevel: run.criticalBlockers.length > 0 ? "critical" : "none",
    criticalGaps: run.criticalBlockers.length,
    pendingVerification: run.pendingWarnings.length,
    correctiveActionsOpen: getSeedActions().filter((a) => a.status !== "completed").length,
    lastAssessmentLabel: "اليوم",

    readiness,
    verificationCoverage: run.coverage.value,
    criticalBlockerCount: run.criticalBlockers.length,
    regulatoryPendingCount: run.regulatoryPendingCount,
    applicabilityPendingCount: run.applicabilityPendingCount,
  };
}

export function getMinistryCompanies(): MinistryCompanySummary[] {
  return [
    getDemoCompanySummary(),
    {
      id: "company-safa",
      nameAr: "مؤسسة الصفا لضيافة الحجاج",
      overallScore: 88,
      status: "compliant",
      riskLevel: "low",
      criticalGaps: 0,
      pendingVerification: 1,
      correctiveActionsOpen: 1,
      lastAssessmentLabel: "قبل يومين",
    },
    {
      id: "company-marwa",
      nameAr: "شركة المروة للخدمات المتكاملة",
      overallScore: 64,
      status: "partially_compliant",
      riskLevel: "medium",
      criticalGaps: 0,
      pendingVerification: 3,
      correctiveActionsOpen: 4,
      lastAssessmentLabel: "قبل 4 أيام",
    },
    {
      id: "company-baraka",
      nameAr: "مجموعة البركة لخدمات الحجيج",
      overallScore: 42,
      status: "non_compliant",
      riskLevel: "critical",
      criticalGaps: 2,
      pendingVerification: 5,
      correctiveActionsOpen: 6,
      lastAssessmentLabel: "قبل 12 يومًا",
    },
    {
      id: "company-yusr",
      nameAr: "شركة يسر لتيسير الحج والعمرة",
      overallScore: 76,
      status: "partially_compliant",
      riskLevel: "medium",
      criticalGaps: 0,
      pendingVerification: 2,
      correctiveActionsOpen: 2,
      lastAssessmentLabel: "قبل يوم واحد",
    },
    {
      id: "company-manasik",
      nameAr: "شركة المناسك الذهبية",
      overallScore: 95,
      status: "compliant",
      riskLevel: "low",
      criticalGaps: 0,
      pendingVerification: 0,
      correctiveActionsOpen: 0,
      lastAssessmentLabel: "قبل 3 أيام",
    },
  ];
}
