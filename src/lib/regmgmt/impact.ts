// =============================================================================
// Government regulatory-management — deterministic impact analysis (Phase 10).
//
// When a requirement is added / updated / newly versioned / deactivated, use
// the APPROVED deterministic applicability engine to find POTENTIALLY affected
// companies. It NEVER broadcasts to everyone, and NEVER marks a company
// NON_COMPLIANT — a regulatory change only produces a follow-up state
// (re-evaluate applicability / provide new evidence / pending verification /
// action required). Missing new evidence is not non-compliance.
// =============================================================================

import type { CanonicalCompanyProfile, RegulatoryRequirement } from "@/lib/model";
import { evaluateApplicability } from "@/lib/engine/applicabilityEngine";
import { getRequirementByCanonicalId } from "@/lib/data/regulatory";
import type {
  CompanyImpact,
  CompanyImpactState,
  ImpactAnalysis,
  RegChangeType,
  RequirementVersionRecord,
} from "./types";

export interface PortfolioCompany {
  profile: CanonicalCompanyProfile;
  nameAr: string;
}

function stateFor(
  applicability: CompanyImpact["applicability"],
  changeType: RegChangeType,
): { state: CompanyImpactState; reasonAr: string } {
  if (applicability === "NOT_APPLICABLE") {
    return { state: "NO_IMPACT", reasonAr: "المتطلب غير منطبق على ملف الشركة وفق القاعدة الحتمية." };
  }
  if (applicability === "INSUFFICIENT_DATA") {
    return {
      state: "APPLICABILITY_REEVALUATION_REQUIRED",
      reasonAr: "بيانات الملف غير كافية لتحديد الانطباق حتميًا — تلزم إعادة تقييم الانطباق.",
    };
  }
  // APPLICABLE
  switch (changeType) {
    case "DEACTIVATED_REQUIREMENT":
      return {
        state: "APPLICABILITY_REEVALUATION_REQUIRED",
        reasonAr: "أُلغي المتطلب — تُعاد مواءمة تقييم الشركة دون أي أثر سلبي تلقائي.",
      };
    case "UPCOMING_EFFECTIVE_DATE":
      return {
        state: "PENDING_VERIFICATION",
        reasonAr: "المتطلب منطبق وسيصبح ساريًا قريبًا — استعدّ للتحقق قبل تاريخ السريان.",
      };
    case "NEW_REQUIREMENT":
    case "NEW_VERSION":
    case "UPDATED_REQUIREMENT":
    case "ACTION_REQUIRED":
    default:
      return {
        state: "NEW_EVIDENCE_REQUIRED",
        reasonAr: "المتطلب منطبق — قد يلزم تحديث البيانات أو تقديم أدلة جديدة وخطوة تحقق.",
      };
  }
}

/**
 * `canonicalReq` is the canonical Regulatory Matrix record for `version`'s
 * `requirementId` (resolved by the caller, or looked up here). For a brand-new
 * government requirement with no canonical rule, applicability is
 * INSUFFICIENT_DATA for every company → all potentially affected, re-evaluation
 * required, no action forced.
 */
export function analyzeImpact(
  version: RequirementVersionRecord,
  changeType: RegChangeType,
  portfolio: PortfolioCompany[],
  canonicalReq?: RegulatoryRequirement | null,
): ImpactAnalysis {
  const req = canonicalReq ?? getRequirementByCanonicalId(version.requirementId) ?? null;

  const impacts: CompanyImpact[] = portfolio.map(({ profile, nameAr }) => {
    let applicability: CompanyImpact["applicability"] = "INSUFFICIENT_DATA";
    if (req) {
      applicability = evaluateApplicability(req, profile).outcome;
    }
    const { state, reasonAr } = stateFor(applicability, changeType);
    return {
      companyId: profile.companyId,
      companyNameAr: nameAr,
      applicability,
      state,
      makesNonCompliant: false,
      reasonAr,
    };
  });

  const potentiallyAffectedCompanyIds = impacts
    .filter((i) => i.state !== "NO_IMPACT")
    .map((i) => i.companyId);
  const companiesRequiringActionIds = impacts
    .filter((i) => i.state === "NEW_EVIDENCE_REQUIRED" || i.state === "COMPANY_ACTION_REQUIRED")
    .map((i) => i.companyId);
  const pendingVerificationCompanyIds = impacts
    .filter((i) => i.state === "PENDING_VERIFICATION")
    .map((i) => i.companyId);

  return {
    requirementId: version.requirementId,
    version: version.version,
    changeType,
    potentiallyAffectedCompanyIds,
    companiesRequiringActionIds,
    pendingVerificationCompanyIds,
    impacts,
    autoNonComplianceApplied: false,
  };
}

export const IMPACT_STATE_LABEL_AR: Record<CompanyImpactState, string> = {
  APPLICABILITY_REEVALUATION_REQUIRED: "إعادة تقييم الانطباق",
  NEW_EVIDENCE_REQUIRED: "أدلة جديدة مطلوبة",
  PENDING_VERIFICATION: "بانتظار التحقق",
  COMPANY_ACTION_REQUIRED: "إجراء مطلوب من الشركة",
  NO_IMPACT: "لا أثر",
};
