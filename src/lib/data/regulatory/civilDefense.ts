// =============================================================================
// Civil Defense — transcribed from REGULATORY_MATRIX_v1.md §7 + §3A
// (CIV-01 … CIV-05).
//
// Matrix §7: applies only where `company_responsible_for_camp == true`.
//
// Per matrix §3A the Target Source is the company operational profile (all
// applicable camps/sites under company responsibility) and the verification
// target is that each applicable site satisfies the relevant official safety
// condition — so these are NOT UNRESOLVED_REQUIREMENT for lack of a numeric
// target. Official Weight: null for all.
//
// internalCriticality here is INTERNAL safety prioritisation only — never an
// official classification.
// =============================================================================

import type { InternalCriticality, RegulatoryRequirement } from "@/lib/model";
import { EFFECTIVE_DATE_UNRESOLVED, VERSION_UNRESOLVED } from "./notes";
import { SRC_CIVIL_DEFENSE_HAJJ_SAFETY } from "./officialSources";

interface CivSeed {
  id: string;
  titleAr: string;
  /** Matrix "Verification Method" bullets, verbatim. */
  method: string[];
  /** INTERNAL safety prioritisation only (approved) — not an official classification. */
  criticality: InternalCriticality;
}

const CIV_SEEDS: CivSeed[] = [
  {
    id: "CIV-01",
    titleAr: "جاهزية وسائل وأنظمة الإطفاء",
    method: ["field inspection", "checklist with evidence", "official inspection result"],
    criticality: "CRITICAL",
  },
  {
    id: "CIV-02",
    titleAr: "وجود عمالة مدربة على استخدام وسائل الإطفاء",
    method: ["verified workforce records", "training evidence", "inspection evidence"],
    criticality: "REQUIRED",
  },
  {
    id: "CIV-03",
    titleAr: "إبقاء مخارج الطوارئ مفتوحة وخالية من العوائق",
    method: ["field inspection", "official inspection", "checklist with evidence"],
    criticality: "CRITICAL",
  },
  {
    id: "CIV-04",
    titleAr: "عدم استخدام تمديدات أو توصيلات كهربائية غير معتمدة",
    method: ["field inspection", "approved technical evidence", "official inspection result"],
    criticality: "CRITICAL",
  },
  {
    id: "CIV-05",
    titleAr: "منع استخدام وسائل الطبخ داخل الخيام",
    method: ["field inspection", "checklist with evidence", "official inspection result"],
    criticality: "CRITICAL",
  },
];

export const CIVIL_DEFENSE_REQUIREMENTS: RegulatoryRequirement[] = CIV_SEEDS.map((seed) => ({
  id: seed.id,
  legacyIds: [],
  sourceAliasesAr: [],
  authorityId: "CIVIL_DEFENSE",
  domainAr: "السلامة",
  trackAr: null,
  titleAr: seed.titleAr,
  applicabilityRule: {
    kind: "EXPRESSION",
    expression: "company_responsible_for_camp == true",
    matrixRef: "REGULATORY_MATRIX_v1.md §7",
  },
  targetSource:
    "Company operational profile — all applicable camps/sites under the company's responsibility.",
  verificationTarget:
    "Each applicable camp/site satisfies the relevant official safety condition (per تعليمات السلامة في الحج).",
  actualSource: [...seed.method],
  verificationRule: `Verification by: ${seed.method.join("; ")}.`,
  verificationAreasAr: [],
  acceptedEvidenceAr: [],
  responsiblePartyModel: null,
  officialWeight: null,
  internalCriticality: seed.criticality,
  season: "1447H",
  matrixSourceRef: "REGULATORY_MATRIX_v1.md §7",
  officialSource: SRC_CIVIL_DEFENSE_HAJJ_SAFETY,
  matrixNotes: [
    "Matrix §7: applies only where company_responsible_for_camp == true.",
    `Matrix "Verification Method": ${seed.method.join("; ")}.`,
    "Official Weight: null (matrix §7).",
    `internalCriticality ${seed.criticality} is INTERNAL safety prioritisation only, never an official classification.`,
  ],
  unresolved: [
    "season — matrix §7 carries no per-entry Season line; 1447H per matrix §19 season focus + locked decision B3 (informational, not a blocking gap)",
    "acceptedEvidence — not enumerated by the matrix",
    VERSION_UNRESOLVED,
    EFFECTIVE_DATE_UNRESOLVED,
  ],
  resolution: "SPECIFIED",
}));
