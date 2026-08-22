// =============================================================================
// Ministry Control Center — portfolio of companies.
// The demo company (شركة النور) is computed live from the compliance engine;
// the remaining companies are static illustrative summaries so the Ministry
// screens can demonstrate portfolio-level monitoring. All are fictional.
// =============================================================================

import type { MinistryCompanySummary } from "@/lib/types";
import { getCompanyProfile } from "@/lib/data/company";
import { getRequirements } from "@/lib/data/requirements";
import { computeOverallScore, computeComplianceStatus } from "@/lib/engine/scoringEngine";
import { getGaps } from "@/lib/data/gaps";
import { getSeedActions } from "@/lib/data/actions";

function getDemoCompanySummary(): MinistryCompanySummary {
  const profile = getCompanyProfile();
  const requirements = getRequirements();
  const { overallScore } = computeOverallScore(
    requirements.map((r) => ({ id: r.id, weight: r.weight, score: r.score }))
  );
  const dims = requirements.flatMap((r) => r.evidenceDimensions);
  const status = computeComplianceStatus(overallScore, dims.length ? dims : []);
  const criticalGaps = getGaps().filter((g) => g.severity === "critical").length;
  const pendingVerification = requirements.filter(
    (r) => r.evidenceStatus === "pending_verification" || r.evidenceStatus === "needs_review"
  ).length;
  const correctiveActionsOpen = getSeedActions().filter((a) => a.status !== "completed").length;
  const worstRisk = requirements.some((r) => r.riskLevel === "critical")
    ? "critical"
    : requirements.some((r) => r.riskLevel === "high")
      ? "high"
      : "medium";

  return {
    id: profile.id,
    nameAr: profile.nameAr,
    overallScore,
    status,
    riskLevel: worstRisk,
    criticalGaps,
    pendingVerification,
    correctiveActionsOpen,
    lastAssessmentLabel: "اليوم",
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
