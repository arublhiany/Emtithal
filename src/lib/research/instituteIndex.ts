// =============================================================================
// Approved institute research index (browse-only).
//
// Official research-area pages and official study metadata published by
// معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة (جامعة أم القرى). These are
// SEARCHABLE REFERENCES ONLY — every entry keeps its official link and is
// clearly marked "detailed content not yet available". No summary, no findings,
// no fabricated passages. This index is browse-only and is NEVER used by the AI
// orchestrator's closed-world retrieval (that stays on ingested-passage sources).
// =============================================================================

export type InstituteReferenceKind = "AREA_PAGE" | "STUDY_METADATA";

export interface InstituteReference {
  refId: string;
  titleAr: string;
  /** The institute unit / research area, or the official listing it appears in. */
  unitAr: string;
  publisherAr: string;
  institutionAr: string;
  kind: InstituteReferenceKind;
  /** The official page / listing that establishes this reference. */
  officialUrl: string;
  officialSourceReference: string;
  seasonAr: string | null;
  topicTags: string[];
  /** What the official page/listing states this reference COVERS — never findings. */
  coverageAr: string;
}

const PUBLISHER_AR = "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة";
const INSTITUTION_AR = "جامعة أم القرى";

export const INSTITUTE_REFERENCES: InstituteReference[] = [
  {
    refId: "UQU-HAJJ-UNIT-ARCHITECTURE-HOUSING",
    titleAr: "وحدة بحوث العمارة والإسكان",
    unitAr: "وحدة بحوث العمارة والإسكان",
    publisherAr: PUBLISHER_AR,
    institutionAr: INSTITUTION_AR,
    kind: "AREA_PAGE",
    officialUrl: "https://uqu.edu.sa/hajj/2344",
    officialSourceReference:
      "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة، جامعة أم القرى — صفحة «وحدة بحوث العمارة والإسكان» (صفحة وحدة رسمية: https://uqu.edu.sa/hajj/2344).",
    seasonAr: null,
    topicTags: [
      "الإسكان",
      "الاسكان",
      "مساكن الحجاج",
      "إسكان الحجاج والمعتمرين والزوار",
      "العمارة",
      "الإيواء",
      "وحدة بحوث العمارة والإسكان",
    ],
    coverageAr:
      "صفحة رسمية لوحدة بحثية بالمعهد تُعنى ببحوث العمارة وإسكان الحجاج والمعتمرين والزوار.",
  },
  {
    refId: "UQU-HAJJ-1447-STUDY-HOUSING-QUALITY-CENTRAL-MAKKAH",
    titleAr: "قياس جودة مساكن الحجاج والمعتمرين في المنطقة المركزية بمكة المكرمة",
    unitAr:
      "التقارير المرحلية لدراسات المعهد خلال شهر رمضان للموسم البحثي 1447هـ",
    publisherAr: PUBLISHER_AR,
    institutionAr: INSTITUTION_AR,
    kind: "STUDY_METADATA",
    officialUrl: "https://uqu.edu.sa/hajj/App/FILES/174742",
    officialSourceReference:
      "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة، جامعة أم القرى — مُدرجة ضمن «التقارير المرحلية لدراسات المعهد خلال شهر رمضان للموسم البحثي 1447هـ» (قائمة رسمية: https://uqu.edu.sa/hajj/App/FILES/174742).",
    seasonAr: "1447H",
    topicTags: [
      "الإسكان",
      "الاسكان",
      "مساكن الحجاج",
      "جودة الإسكان",
      "المنطقة المركزية",
      "مكة المكرمة",
      "قياس الجودة",
    ],
    coverageAr:
      "دراسة مُدرجة ضمن قائمة التقارير المرحلية الرسمية للمعهد لموسم 1447هـ. المحتوى التفصيلي غير متاح بعد.",
  },
];
