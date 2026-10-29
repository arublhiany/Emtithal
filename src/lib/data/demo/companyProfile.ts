// =============================================================================
// Canonical DEMO_DATA company profile (Phase 2) — approved fixture (DRAFT C).
//
// Explicitly fictional. `DATA_SOURCE = DEMO_DATA`. Never to be shown as live
// government data. Contains NO assessment / verification outcome — Phase 3 owns
// those. Introduces no regulatory fact absent from REGULATORY_MATRIX_v1.md.
//
// Separate from the legacy demo company in `@/lib/data/company` (which still
// drives the current screens until the Phase 3 migration).
// =============================================================================

import { DATA_SOURCE } from "@/lib/mode";
import type { CanonicalCompanyProfile } from "@/lib/model";
import { buildCompanyProfile, type CompanyProfileDraft } from "@/lib/onboarding/companyProfile";

export const CANONICAL_DEMO_COMPANY_ID = "demo-company-01";

/** Raw declared draft — the shape an onboarding flow would submit. */
export const DEMO_COMPANY_PROFILE_DRAFT: CompanyProfileDraft = {
  companyId: CANONICAL_DEMO_COMPANY_ID,
  legalNameAr: "شركة نموذج سبّاق للحج والعمرة",
  season: "1447H",

  pilgrims: {
    count: 4200,
    sourceAr: "ملف تشغيلي — بيانات عرض",
    lastUpdatedAr: "قبل يومين",
    verification: "UNVERIFIED",
  },
  workforce: {
    count: 180,
    sourceAr: "تقرير موارد بشرية مستورد — بيانات عرض",
    lastUpdatedAr: "قبل ٥ أيام",
    verification: "PENDING_VERIFICATION",
  },
  // Not declared in the demo — MOH-01 applicability is INSUFFICIENT_DATA.
  directContactWorkers: null,
  // Not declared in the demo — HAJ-NUSUK-01 applicability is INSUFFICIENT_DATA.
  nusukApplicablePersons: null,

  servicesAr: ["النقل", "الإعاشة", "التخييم", "الإرشاد"],
  locationsAr: ["مكة المكرمة", "مشعر منى", "مشعر عرفات"],

  camps: [
    { id: "demo-camp-mina", nameAr: "(عرض) مخيم تجريبي — منى", companyResponsible: true },
    { id: "demo-camp-arafat", nameAr: "(عرض) مخيم تجريبي — عرفات", companyResponsible: true },
  ],

  serviceProviders: [
    {
      id: "demo-provider-transport-01",
      nameAr: "(عرض) مزوّد نقل تجريبي ١",
      scopeAr: "النقل بين المشاعر",
      responsibleParty: "SERVICE_PROVIDER",
    },
    {
      id: "demo-provider-catering-01",
      nameAr: "(عرض) مزوّد إعاشة تجريبي ١",
      scopeAr: "الإعاشة في منى",
      responsibleParty: "SHARED",
    },
  ],

  dataSources: [
    {
      kind: "NUSUK",
      labelAr: "نُسك",
      state: "NOT_CONNECTED",
      sourceAr: "لا يوجد ربط مفعّل في النسخة الحالية",
      lastUpdatedAr: null,
      verification: null,
      origin: DATA_SOURCE.DEMO_DATA,
    },
    {
      kind: "WORKERS",
      labelAr: "بيانات العاملين",
      state: "IMPORTED",
      sourceAr: "تقرير موارد بشرية مستورد — بيانات عرض",
      lastUpdatedAr: "قبل ٥ أيام",
      verification: "PENDING_VERIFICATION",
      origin: DATA_SOURCE.DEMO_DATA,
    },
    {
      kind: "OPERATIONAL",
      labelAr: "البيانات التشغيلية",
      state: "IMPORTED",
      sourceAr: "ملف تشغيلي داخلي — بيانات عرض",
      lastUpdatedAr: "قبل يومين",
      verification: "UNVERIFIED",
      origin: DATA_SOURCE.DEMO_DATA,
    },
    {
      kind: "EVIDENCE",
      labelAr: "الأدلة",
      state: "IMPORTED",
      sourceAr: "ملفات مرفوعة داخل سبّاق — بيانات عرض",
      lastUpdatedAr: "قبل يوم",
      verification: "PENDING_VERIFICATION",
      origin: DATA_SOURCE.DEMO_DATA,
    },
  ],

  declaredFacts: {
    experienceTrackScopeDeclared: true,
    companyResponsibleForCamp: true,
    contractsExternalServiceProviders: true,
    providesOrEnsuresCatering: true,
  },
};

export const DEMO_COMPANY_PROFILE: CanonicalCompanyProfile = buildCompanyProfile(
  DEMO_COMPANY_PROFILE_DRAFT,
);
