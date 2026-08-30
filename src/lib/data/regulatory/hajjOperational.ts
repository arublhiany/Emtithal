// =============================================================================
// Ministry of Hajj and Umrah — Operational Compliance
// Transcribed from REGULATORY_MATRIX_v1.md §5 + §3A (HAJ-NUSUK / HAJ-CATERING /
// HAJ-CAMP / HAJ-PROVIDERS).
//
// Official weights are `null` for every record (matrix §5).
//
// HAJ-PROVIDERS-01 stays UNRESOLVED_REQUIREMENT — NOT for a missing Target
// Source (matrix §3A now defines it), but for the unresolved company-vs-provider
// responsibility mapping the matrix verification rule requires.
// =============================================================================

import type { RegulatoryRequirement } from "@/lib/model";
import {
  EFFECTIVE_DATE_UNRESOLVED,
  OFFICIAL_SOURCE_LOCATOR_UNRESOLVED,
  VERSION_UNRESOLVED,
} from "./notes";
import { SRC_NUSUK_CARD_FAQ, SRC_SERVICE_COMPANIES_GUIDE_1447 } from "./officialSources";

const VERSION_DATE_UNRESOLVED = [VERSION_UNRESOLVED, EFFECTIVE_DATE_UNRESOLVED];

export const HAJJ_OPERATIONAL_REQUIREMENTS: RegulatoryRequirement[] = [
  {
    id: "HAJ-NUSUK-01",
    legacyIds: [],
    sourceAliasesAr: [],
    authorityId: "MOHU",
    domainAr: "الجاهزية التشغيلية",
    trackAr: null,
    titleAr: "إدارة واستيفاء متطلبات بطاقة نُسك",
    applicabilityRule: {
      kind: "NARRATIVE",
      textEn:
        "Applicable to the relevant pilgrims, workers, or operators according to official Nusuk rules.",
      matrixRef: "REGULATORY_MATRIX_v1.md §5 HAJ-NUSUK-01",
    },
    targetSource: "Approved or official roster of people to whom the requirement applies.",
    verificationTarget: null,
    actualSource: [
      "official Nusuk data if available",
      "official imported report",
      "verified company operational data",
    ],
    verificationRule:
      "The system must never invent the required population. Each number must include: source, last updated date, verification status.",
    verificationAreasAr: [],
    acceptedEvidenceAr: [],
    responsiblePartyModel: null,
    officialWeight: null,
    internalCriticality: "REQUIRED",
    season: "1447H",
    matrixSourceRef: "REGULATORY_MATRIX_v1.md §5 HAJ-NUSUK-01",
    officialSource: SRC_NUSUK_CARD_FAQ,
    matrixNotes: [
      "Measurement example (matrix): required = applicable persons; actual = issued / received / distributed according to the stage being measured; gap = required - actual.",
      "Official Weight: null (matrix §5).",
    ],
    unresolved: [
      "applicabilityRule not machine-evaluable — matrix states it in prose only",
      "acceptedEvidence — not enumerated by the matrix",
      ...VERSION_DATE_UNRESOLVED,
    ],
    resolution: "SPECIFIED",
  },
  {
    id: "HAJ-CATERING-01",
    legacyIds: [],
    sourceAliasesAr: [],
    authorityId: "MOHU",
    domainAr: "الجاهزية التشغيلية",
    trackAr: null,
    titleAr: "جاهزية وتغطية خدمات الإعاشة",
    applicabilityRule: {
      kind: "NARRATIVE",
      textEn:
        "Applicable when the company is responsible for providing or ensuring the required catering service.",
      matrixRef: "REGULATORY_MATRIX_v1.md §5 HAJ-CATERING-01",
    },
    targetSource:
      "Number of pilgrims/services covered by the official obligation and company operational profile.",
    verificationTarget: null,
    actualSource: [
      "valid provider contract",
      "provider data",
      "operational evidence",
      "field follow-up evidence",
      "official inspection result where available",
    ],
    verificationRule:
      "Contract existence alone does not prove operational compliance. Coverage and actual readiness must be evaluated separately.",
    verificationAreasAr: [],
    acceptedEvidenceAr: [],
    responsiblePartyModel: null,
    officialWeight: null,
    internalCriticality: "REQUIRED",
    season: "1447H",
    matrixSourceRef: "REGULATORY_MATRIX_v1.md §5 HAJ-CATERING-01",
    officialSource: SRC_SERVICE_COMPANIES_GUIDE_1447,
    matrixNotes: ["Official Weight: null (matrix §5)."],
    unresolved: [
      "applicabilityRule not machine-evaluable — matrix states it in prose only",
      "acceptedEvidence — not enumerated by the matrix",
      OFFICIAL_SOURCE_LOCATOR_UNRESOLVED,
      ...VERSION_DATE_UNRESOLVED,
    ],
    resolution: "SPECIFIED",
  },
  {
    id: "HAJ-CAMP-01",
    legacyIds: [],
    sourceAliasesAr: [],
    authorityId: "MOHU",
    domainAr: "الجاهزية التشغيلية",
    trackAr: null,
    titleAr: "جاهزية المخيمات والمواقع",
    applicabilityRule: {
      kind: "EXPRESSION",
      expression: "company_responsible_for_camp == true",
      matrixRef: "REGULATORY_MATRIX_v1.md §5 HAJ-CAMP-01",
    },
    targetSource: "All camps/sites under the company's responsibility.",
    verificationTarget: null,
    actualSource: [
      "field inspection",
      "verified checklist",
      "operational evidence",
      "official inspection result where available",
    ],
    verificationRule: "Each site is verified independently.",
    verificationAreasAr: [],
    acceptedEvidenceAr: [],
    responsiblePartyModel: null,
    officialWeight: null,
    internalCriticality: "CRITICAL",
    season: "1447H",
    matrixSourceRef: "REGULATORY_MATRIX_v1.md §5 HAJ-CAMP-01",
    officialSource: SRC_SERVICE_COMPANIES_GUIDE_1447,
    matrixNotes: [
      "Matrix example: 7 required sites / 6 verified / 1 pending verification.",
      "Official Weight: null (matrix §5).",
      "internalCriticality CRITICAL is INTERNAL product prioritisation (direct safety/welfare relevance), not an official regulatory weight.",
    ],
    unresolved: [
      "acceptedEvidence — not enumerated by the matrix",
      OFFICIAL_SOURCE_LOCATOR_UNRESOLVED,
      ...VERSION_DATE_UNRESOLVED,
    ],
    resolution: "SPECIFIED",
  },
  {
    id: "HAJ-PROVIDERS-01",
    legacyIds: [],
    sourceAliasesAr: [],
    authorityId: "MOHU",
    domainAr: "إدارة مقدمي الخدمات",
    trackAr: null,
    titleAr: "متابعة مقدمي خدمات النقل والإعاشة",
    applicabilityRule: {
      kind: "NARRATIVE",
      textEn: "Applicable when the company contracts with external service providers.",
      matrixRef: "REGULATORY_MATRIX_v1.md §5 HAJ-PROVIDERS-01",
    },
    targetSource:
      "Company operational profile — all contracted service providers to whom the company's official supervision/verification responsibility applies.",
    verificationTarget:
      "For each provider under the company's official supervision/verification responsibility, that the company met its supervision/verification duty. Where the exact company responsibility for a provider is unclear, that provider-level assessment stays PENDING / INSUFFICIENT rather than assumed.",
    actualSource: [
      "provider contracts",
      "verification records",
      "operational follow-up",
      "official inspection evidence",
    ],
    verificationRule:
      "Emtithal must identify what responsibility belongs directly to the Hajj company. A provider violation must not automatically be recorded as a company violation unless an official source establishes company responsibility.",
    verificationAreasAr: [],
    acceptedEvidenceAr: [],
    responsiblePartyModel: ["COMPANY", "SERVICE_PROVIDER", "SHARED"],
    officialWeight: null,
    internalCriticality: null,
    season: "1447H",
    matrixSourceRef: "REGULATORY_MATRIX_v1.md §5 HAJ-PROVIDERS-01",
    officialSource: SRC_SERVICE_COMPANIES_GUIDE_1447,
    matrixNotes: [
      "Official Weight: null (matrix §5).",
      "Target Source defined per matrix §3A (company operational profile → contracted providers).",
    ],
    unresolved: [
      "company-vs-provider responsibility mapping — the matrix verification rule requires identifying which provider obligations fall directly on the company, and no official source establishes this per-obligation; provider-level assessment stays PENDING/INSUFFICIENT until resolved (matrix §5 / §19)",
      "applicabilityRule not machine-evaluable — matrix states it in prose only",
      "acceptedEvidence — not enumerated by the matrix",
      OFFICIAL_SOURCE_LOCATOR_UNRESOLVED,
      ...VERSION_DATE_UNRESOLVED,
    ],
    resolution: "UNRESOLVED_REQUIREMENT",
  },
];
