// =============================================================================
// Ministry of Hajj and Umrah — Quality of Service Performance
// Track: صناعة التجربة وتعزيز الثقة
//
// Transcribed verbatim from REGULATORY_MATRIX_v1.md §4.1 (HAJ-EXP-01 … 05).
// Official track weight: 3%. Each criterion: 20% within the track.
//
// Legacy MVP IDs CR-001 … CR-005 map here as `legacyIds` only.
// Per-requirement `version` and `effectiveDate` are not published by the
// matrix and are listed in `unresolved`; this does not by itself make a record
// UNRESOLVED_REQUIREMENT (matrix §16 does not list them as triggers).
// =============================================================================

import type { RegulatoryRequirement } from "@/lib/model";
import { EFFECTIVE_DATE_UNRESOLVED, VERSION_UNRESOLVED } from "./notes";
import { SRC_HAJJ_EXPERIENCE_PROGRAM } from "./officialSources";

const OFFICIAL_WEIGHT = {
  trackWeightPercent: 3,
  withinTrackWeightPercent: 20,
  matrixRef: "REGULATORY_MATRIX_v1.md §4.1",
} as const;

const COMMON_UNRESOLVED = [
  "applicability basis — company must DECLARE it is within the Ministry of Hajj and Umrah Quality of Service Performance / Experience Track scope; evaluated against the company profile in Phase 2, not assumed for every COMPANY",
  VERSION_UNRESOLVED,
  EFFECTIVE_DATE_UNRESOLVED,
];

function base(
  id: string,
  legacyId: string,
  titleAr: string,
): Pick<
  RegulatoryRequirement,
  | "id"
  | "legacyIds"
  | "authorityId"
  | "domainAr"
  | "trackAr"
  | "titleAr"
  | "applicabilityRule"
  | "targetSource"
  | "verificationTarget"
  | "responsiblePartyModel"
  | "officialWeight"
  | "internalCriticality"
  | "season"
  | "matrixSourceRef"
  | "officialSource"
  | "resolution"
> {
  return {
    id,
    legacyIds: [legacyId],
    authorityId: "MOHU",
    domainAr: "جودة أداء الخدمات",
    trackAr: "صناعة التجربة وتعزيز الثقة",
    titleAr,
    applicabilityRule: {
      kind: "DECLARED_SCOPE",
      scopeKey: "MOHU_EXPERIENCE_TRACK",
      textEn:
        "Applies to companies within the Ministry of Hajj and Umrah Quality of Service Performance / Experience Track scope. Scope membership is declared by the company and evaluated against its profile in Phase 2 — not assumed for every COMPANY.",
      matrixRef: "REGULATORY_MATRIX_v1.md §4.1",
    },
    targetSource: "Official criterion structure",
    verificationTarget: null,
    responsiblePartyModel: null,
    officialWeight: { ...OFFICIAL_WEIGHT },
    internalCriticality: "REQUIRED",
    season: "1447H",
    matrixSourceRef: "REGULATORY_MATRIX_v1.md §4.1",
    officialSource: SRC_HAJJ_EXPERIENCE_PROGRAM,
    resolution: "SPECIFIED",
  };
}

export const HAJJ_EXPERIENCE_REQUIREMENTS: RegulatoryRequirement[] = [
  {
    ...base("HAJ-EXP-01", "CR-001", "صناعة تجربة ضيف الرحمن"),
    sourceAliasesAr: [],
    actualSource: [
      "company evidence",
      "verified documents",
      "operational records where applicable",
    ],
    verificationRule:
      "Evaluate required official components individually. Do not infer completion from the existence of one general document.",
    verificationAreasAr: [
      "تعيين قائد لمسار صناعة التجربة",
      "إعداد رحلة موحدة لضيف الرحمن",
      "مشاركة خريطة رحلة بحسب الخدمات والباقات",
      "وجود الهيكل التنظيمي للشركة",
      "وجود استراتيجية تجربة المستفيد",
      "المستندات والمخرجات الداعمة المطلوبة رسميًا",
    ],
    acceptedEvidenceAr: [
      "الهيكل التنظيمي",
      "استراتيجية تجربة المستفيد",
      "ملف رحلة ضيف الرحمن",
      "supporting official evidence",
    ],
    matrixNotes: [],
    unresolved: [...COMMON_UNRESOLVED],
  },
  {
    ...base("HAJ-EXP-02", "CR-002", "تبني المفاهيم الحديثة والترسيخ المعرفي"),
    sourceAliasesAr: [],
    actualSource: ["workshop records", "reports", "questionnaires", "verified supporting documents"],
    verificationRule: "Verify each required component separately.",
    verificationAreasAr: [
      "المشاركة في الورش المطلوبة",
      "نشر المفاهيم والثقافة المعرفية",
      "الاستبانات",
      "دراسة أو تقرير عن السلوكيات والثقافات",
      "التقارير الداعمة المطلوبة",
    ],
    acceptedEvidenceAr: [],
    matrixNotes: [],
    unresolved: [
      "acceptedEvidence — matrix does not enumerate accepted evidence for HAJ-EXP-02",
      ...COMMON_UNRESOLVED,
    ],
  },
  {
    ...base("HAJ-EXP-03", "CR-003", "ضمان حفظ حقوق ضيف الرحمن"),
    sourceAliasesAr: [],
    actualSource: ["company structure", "rights guide", "awareness evidence", "verified documents"],
    verificationRule: "All required official components must be verified independently.",
    verificationAreasAr: [
      "وجود وحدة أو إدارة معنية بحقوق ضيوف الرحمن",
      "دليل الحقوق والواجبات",
      "التوعية بالحقوق والواجبات",
      "توثيق أعمال التوعية",
    ],
    acceptedEvidenceAr: [],
    matrixNotes: [
      "Legacy MVP marked CR-003 as a critical gate. That flag is NOT carried over — internalCriticality stays null pending an approved mapping.",
    ],
    unresolved: [
      "acceptedEvidence — matrix does not enumerate accepted evidence for HAJ-EXP-03",
      ...COMMON_UNRESOLVED,
    ],
  },
  {
    ...base("HAJ-EXP-04", "CR-004", "التعايش مع رحلة ضيف الرحمن ورصد التجربة"),
    sourceAliasesAr: [],
    actualSource: [
      "questionnaires",
      "challenge logs",
      "improvement plans",
      "impact reports",
      "verified evidence",
    ],
    verificationRule: "Verify required elements separately and identify missing components.",
    verificationAreasAr: [
      "قنوات التواصل والاستجابة",
      "الاستبانات المرتبطة بالرحلة",
      "التحديات المرصودة",
      "التحديات التي تمت معالجتها",
      "خطة التحسين",
      "أدوات ومنهجيات التحسين",
      "قياس الأثر",
      "التقارير الإحصائية الداعمة",
    ],
    acceptedEvidenceAr: [],
    matrixNotes: [],
    unresolved: [
      "acceptedEvidence — matrix does not enumerate accepted evidence for HAJ-EXP-04",
      ...COMMON_UNRESOLVED,
    ],
  },
  {
    ...base("HAJ-EXP-05", "CR-005", "توثيق فعاليات ومبادرات فريق السعادة"),
    sourceAliasesAr: ["برنامج قياس التجربة وإدارة العواطف"],
    actualSource: [
      "initiative reports",
      "questionnaires",
      "final report",
      "visual documentation",
      "verified evidence",
    ],
    verificationRule: "Verify official required components individually.",
    verificationAreasAr: [
      "فعاليات ومبادرات فريق السعادة",
      "توثيق المبادرات",
      "التفاعل والأثر",
      "الالتزام بالهوية أو المحددات المطلوبة",
      "الاستبانات",
      "التقرير النهائي",
      "الصور أو التوثيق الإعلامي عند طلبه رسميًا",
    ],
    acceptedEvidenceAr: [],
    matrixNotes: [
      'Matrix §4.1: canonical name is "توثيق فعاليات ومبادرات فريق السعادة". Do NOT rename to "برنامج قياس التجربة وإدارة العواطف"; that phrase is stored only as a source alias for traceability.',
    ],
    unresolved: [
      "acceptedEvidence — matrix does not enumerate accepted evidence for HAJ-EXP-05",
      ...COMMON_UNRESOLVED,
    ],
  },
];
