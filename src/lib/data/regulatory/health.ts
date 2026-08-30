// =============================================================================
// Ministry of Health — transcribed from REGULATORY_MATRIX_v1.md §6 + §3A.
//
// Official Weight: null. The verified official source (§3A-E) supports the
// meningococcal vaccination requirement for Hajj/Umrah workers whose work
// requires DIRECT CONTACT with pilgrims / Umrah performers — NOT all company
// workers.
//
// MOH-01 stays UNRESOLVED_REQUIREMENT: the source is not itself a 1447-specific
// company-worker notice, so current-season continuity is not verified.
// =============================================================================

import type { RegulatoryRequirement } from "@/lib/model";
import { SRC_MOH_HEALTH_REGULATIONS } from "./officialSources";

export const HEALTH_REQUIREMENTS: RegulatoryRequirement[] = [
  {
    id: "MOH-01",
    legacyIds: [],
    sourceAliasesAr: [],
    authorityId: "MOH",
    domainAr: "صحة العاملين",
    trackAr: null,
    titleAr: "استيفاء متطلبات التحصين للعاملين المشاركين في الحج",
    applicabilityRule: {
      kind: "NARRATIVE",
      textEn:
        "The meningococcal vaccination requirement applies to Hajj/Umrah workers whose work requires direct contact with pilgrims / Umrah performers — NOT all company workers (per the Ministry of Health Health Regulations, matrix §3A-E).",
      matrixRef: "REGULATORY_MATRIX_v1.md §6 MOH-01 / §3A-E",
    },
    targetSource:
      "Applicable worker roster — the subset of workers whose work requires direct contact with pilgrims / Umrah performers.",
    verificationTarget:
      "Each worker in the applicable roster holds a valid, verified meningococcal vaccination status.",
    actualSource: [
      "official vaccination record",
      "approved vaccination evidence",
      "official integration if available in the future",
    ],
    verificationRule: "Compare applicable workers against valid verified vaccination status.",
    verificationAreasAr: [],
    acceptedEvidenceAr: [],
    responsiblePartyModel: null,
    officialWeight: null,
    internalCriticality: null,
    season: "1447H",
    matrixSourceRef: "REGULATORY_MATRIX_v1.md §6 MOH-01",
    officialSource: SRC_MOH_HEALTH_REGULATIONS,
    matrixNotes: [
      'Matrix §6 phrasing: "Only the workers to whom the current official Hajj health requirement applies."',
      "Matrix example: 320 required / 306 verified / 9 non-compliant / 5 pending verification.",
      "Matrix: do not add vaccines as mandatory requirements unless supported by the current official source.",
      "Official Weight: null (matrix §6).",
      "internalCriticality is null until current-season applicability is resolved.",
    ],
    unresolved: [
      "seasonContinuity — the official source is not a 1447-specific company-worker notice; current-season continuity to 1447H is NOT verified. MOH-01 is not treated as fully season-verified regulatory truth until this is resolved (matrix §3A-E / §14 / §16)",
      "acceptedEvidence — not enumerated by the matrix",
      "verificationAreas — not enumerated by the matrix",
      "per-requirement version — not published by the matrix",
      "effectiveDate — not published by the matrix",
    ],
    resolution: "UNRESOLVED_REQUIREMENT",
  },
];
