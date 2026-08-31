// =============================================================================
// DEMO government portfolio (Phase 10) — a small set of canonical company
// profiles for the government impact-analysis / notification preview.
//
// EXPLICITLY demo data — derived from the single approved demo company draft
// with declared-fact variations. Not real companies, not production counts.
// The government UI must label anything computed from this as demo-bound.
// =============================================================================

import { buildCompanyProfile } from "@/lib/onboarding/companyProfile";
import { DEMO_COMPANY_PROFILE_DRAFT } from "@/lib/data/demo/companyProfile";
import type { PortfolioCompany } from "@/lib/regmgmt";

interface Variant {
  companyId: string;
  nameAr: string;
  experienceTrackScopeDeclared: boolean | null;
  companyResponsibleForCamp?: boolean | null;
}

const VARIANTS: Variant[] = [
  {
    companyId: "demo-gov-co-01",
    nameAr: "(تجريبي) شركة النور لخدمات الحج",
    experienceTrackScopeDeclared: true,
  },
  {
    companyId: "demo-gov-co-02",
    nameAr: "(تجريبي) مؤسسة الصفا لضيافة الحجاج",
    experienceTrackScopeDeclared: true,
    companyResponsibleForCamp: true,
  },
  {
    companyId: "demo-gov-co-03",
    nameAr: "(تجريبي) شركة المروة للخدمات المتكاملة",
    experienceTrackScopeDeclared: false, // out of the experience track → NOT_APPLICABLE
  },
  {
    companyId: "demo-gov-co-04",
    nameAr: "(تجريبي) مجموعة البركة لخدمات الحجيج",
    experienceTrackScopeDeclared: null, // undeclared → INSUFFICIENT_DATA
  },
];

export function getDemoGovernmentPortfolio(): PortfolioCompany[] {
  return VARIANTS.map((v) => ({
    nameAr: v.nameAr,
    profile: buildCompanyProfile({
      ...DEMO_COMPANY_PROFILE_DRAFT,
      companyId: v.companyId,
      legalNameAr: v.nameAr,
      declaredFacts: {
        ...DEMO_COMPANY_PROFILE_DRAFT.declaredFacts,
        experienceTrackScopeDeclared: v.experienceTrackScopeDeclared,
        ...(v.companyResponsibleForCamp !== undefined
          ? { companyResponsibleForCamp: v.companyResponsibleForCamp }
          : {}),
      },
    }),
  }));
}
