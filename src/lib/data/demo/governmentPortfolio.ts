// =============================================================================
// DEMO government portfolio (Phase 10 / Phase 11) — the company profiles the
// government impact-analysis / notification preview runs against.
//
// The FIRST entry is the SAME canonical demo company the company portal uses
// (`DEMO_COMPANY_PROFILE`, id `CANONICAL_DEMO_COMPANY_ID`) — not a copy — so a
// regulatory change that is applicable to it produces a notification that the
// company can see at /company/alerts under the SAME identity.
//
// The remaining entries are EXPLICITLY synthetic demo variations of the same
// approved draft with different declared facts, used only to show the
// government portfolio / scoping behaviour. Not real companies, not production
// counts. The government UI labels anything computed from this as demo-bound.
// =============================================================================

import { buildCompanyProfile } from "@/lib/onboarding/companyProfile";
import {
  DEMO_COMPANY_PROFILE,
  DEMO_COMPANY_PROFILE_DRAFT,
} from "@/lib/data/demo/companyProfile";
import type { PortfolioCompany } from "@/lib/regmgmt";

// The primary demo company identity is owned by `@/lib/data/demo/companyProfile`
// (`CANONICAL_DEMO_COMPANY_ID`). This module only consumes it — company-facing
// code must not depend on this module to obtain the id.

interface Variant {
  companyId: string;
  nameAr: string;
  experienceTrackScopeDeclared: boolean | null;
  companyResponsibleForCamp?: boolean | null;
}

// Synthetic variations ONLY — the primary company is added separately below
// from the unmodified canonical profile.
const VARIANTS: Variant[] = [
  {
    companyId: "demo-gov-var-02",
    nameAr: "(تجريبي) مؤسسة الصفا لضيافة الحجاج",
    experienceTrackScopeDeclared: true,
    companyResponsibleForCamp: true,
  },
  {
    companyId: "demo-gov-var-03",
    nameAr: "(تجريبي) شركة المروة للخدمات المتكاملة",
    experienceTrackScopeDeclared: false, // out of the experience track → NOT_APPLICABLE
  },
  {
    companyId: "demo-gov-var-04",
    nameAr: "(تجريبي) مجموعة البركة لخدمات الحجيج",
    experienceTrackScopeDeclared: null, // undeclared → INSUFFICIENT_DATA
  },
];

export function getDemoGovernmentPortfolio(): PortfolioCompany[] {
  const primary: PortfolioCompany = {
    nameAr: DEMO_COMPANY_PROFILE_DRAFT.legalNameAr,
    profile: DEMO_COMPANY_PROFILE,
  };

  const variants: PortfolioCompany[] = VARIANTS.map((v) => ({
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

  return [primary, ...variants];
}
