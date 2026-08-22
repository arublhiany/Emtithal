// =============================================================================
// The five MVP regulatory criteria — verbatim from MVP_REQUIREMENTS.md.
//
// Weights are a DEMO CONFIGURATION (20 points × 5 criteria = 100), NOT an
// official Ministry of Hajj and Umrah weighting model. The architecture
// allows an authorized Ministry user to replace these with official weights
// (see app/ministry/standards).
// =============================================================================

import type { EvidenceDimensionAssessment, Requirement } from "@/lib/types";
import {
  computeComplianceStatus,
  computeConfidence,
  computeEvidenceStatus,
  computeRequirementScore,
  computeRiskLevel,
} from "@/lib/engine/scoringEngine";

export const DEMO_WEIGHT_DISCLAIMER =
  "تكوين توضيحي للعرض — ليس وزنًا رسميًا معتمدًا من وزارة الحج والعمرة.";

interface RequirementSeed {
  id: string;
  nameAr: string;
  descriptionAr: string;
  weight: number;
  criticalGate: boolean;
  effectiveDate: string;
  lastUpdated: string;
  lastEvaluation: string;
  version: number;
  evidenceIds: string[];
  evidenceDimensions: EvidenceDimensionAssessment[];
  gapExplanationAr: string;
  recommendedActionAr: string;
  versionHistory: Requirement["versionHistory"];
}

const dims = (
  execution: EvidenceDimensionAssessment["state"],
  documentation: EvidenceDimensionAssessment["state"],
  measurement: EvidenceDimensionAssessment["state"],
  supporting_evidence: EvidenceDimensionAssessment["state"],
  completeness: EvidenceDimensionAssessment["state"],
  notes: Partial<Record<EvidenceDimensionAssessment["key"], string>> = {}
): EvidenceDimensionAssessment[] => [
  { key: "execution", labelAr: "التنفيذ", state: execution, note: notes.execution },
  { key: "documentation", labelAr: "التوثيق", state: documentation, note: notes.documentation },
  { key: "measurement", labelAr: "القياس", state: measurement, note: notes.measurement },
  {
    key: "supporting_evidence",
    labelAr: "الأدلة الداعمة",
    state: supporting_evidence,
    note: notes.supporting_evidence,
  },
  { key: "completeness", labelAr: "الاكتمال", state: completeness, note: notes.completeness },
];

const REQUIREMENT_SEEDS: RequirementSeed[] = [
  {
    id: "CR-001",
    nameAr: "صناعة تجربة ضيف الرحمن",
    descriptionAr:
      "تقييم مدى تنفيذ الشركة وتوثيقها لأنشطة أو مبادرات مصممة لتحسين تجربة ضيف الرحمن.",
    weight: 20,
    criticalGate: false,
    effectiveDate: "01-01-1447هـ",
    lastUpdated: "10-01-1447هـ",
    lastEvaluation: "قبل يومين",
    version: 1,
    evidenceIds: ["EV-101", "EV-102"],
    evidenceDimensions: dims("found", "found", "found", "found", "unclear", {
      completeness: "مؤشر القياس النهائي لمبادرة \"استراحة الطريق\" لم يُستكمل بعد لهذا الموسم.",
    }),
    gapExplanationAr:
      "المبادرات موثقة وتنفيذها مكتمل، لكن مؤشر القياس الختامي لإحدى المبادرات لا يزال قيد الإعداد.",
    recommendedActionAr: "استكمال مؤشر القياس النهائي لمبادرة \"استراحة الطريق\" ورفعه كدليل محدث.",
    versionHistory: [
      {
        version: 1,
        effectiveFrom: "01-01-1447هـ",
        weight: 20,
        status: "active",
        changeNote: "الإصدار الأول من المعيار ضمن نطاق النموذج التجريبي.",
      },
    ],
  },
  {
    id: "CR-002",
    nameAr: "تبني المفاهيم الحديثة والترسيخ المعرفي",
    descriptionAr:
      "تقييم الأدلة التي تُظهر تبني الشركة وتنفيذها وتوثيقها للمفاهيم الحديثة وترسيخ المعرفة داخل عملياتها.",
    weight: 20,
    criticalGate: false,
    effectiveDate: "01-01-1447هـ",
    lastUpdated: "05-01-1447هـ",
    lastEvaluation: "قبل 5 أيام",
    version: 1,
    evidenceIds: ["EV-201"],
    evidenceDimensions: dims("found", "found", "unclear", "found", "missing", {
      measurement: "لا تتوفر بيانات كمية لعدد المستفيدين من برنامج التوعية.",
      completeness: "لا يوجد ملف ختامي يجمع مخرجات برامج الترسيخ المعرفي لهذا الموسم.",
    }),
    gapExplanationAr:
      "توجد برامج توعوية منفذة وموثقة جزئيًا، لكن مؤشرات القياس غير مكتملة ولا يوجد ملف اكتمال نهائي.",
    recommendedActionAr:
      "تجميع مخرجات برامج الترسيخ المعرفي في ملف اكتمال موحد وإضافة مؤشرات قياس كمية للمستفيدين.",
    versionHistory: [
      {
        version: 1,
        effectiveFrom: "01-01-1447هـ",
        weight: 20,
        status: "active",
        changeNote: "الإصدار الأول من المعيار ضمن نطاق النموذج التجريبي.",
      },
    ],
  },
  {
    id: "CR-003",
    nameAr: "ضمان حفظ حقوق ضيف الرحمن",
    descriptionAr:
      "تقييم مدى تنفيذ الشركة وتوثيقها لآليات وأنشطة تدعم حماية حقوق ضيف الرحمن والتوعية بها.",
    weight: 20,
    criticalGate: true,
    effectiveDate: "01-01-1447هـ",
    lastUpdated: "01-01-1447هـ",
    lastEvaluation: "قبل 9 أيام",
    version: 1,
    evidenceIds: ["EV-301"],
    evidenceDimensions: dims("found", "unclear", "missing", "unclear", "missing", {
      documentation: "سجلات التنفيذ متوفرة جزئيًا فقط لثلث المواسم الميدانية.",
      measurement: "لا يوجد مؤشر قياس موثّق لعدد المستفيدين من أنشطة التوعية بالحقوق.",
      supporting_evidence: "الأدلة الداعمة المرفوعة غير مكتملة العلاقة بالمعيار.",
      completeness: "لا يوجد ملف تقييم نهائي جاهز للمراجعة.",
    }),
    gapExplanationAr:
      "هذا معيار حرج (Critical Gate). الأدلة الحالية لا تغطي متطلبات القياس والتوثيق الكافية لإثبات حفظ حقوق ضيف الرحمن، وهو ما يستدعي إجراءً فوريًا.",
    recommendedActionAr:
      "رفع سجلات تنفيذ كاملة لأنشطة التوعية بالحقوق مع مؤشر قياس لعدد المستفيدين، وطلب مراجعة بشرية عاجلة.",
    versionHistory: [
      {
        version: 1,
        effectiveFrom: "01-01-1447هـ",
        weight: 20,
        status: "active",
        changeNote: "الإصدار الأول من المعيار ضمن نطاق النموذج التجريبي — معيار حرج.",
      },
    ],
  },
  {
    id: "CR-004",
    nameAr: "التعايش مع رحلة ضيف الرحمن ورصد التجربة",
    descriptionAr:
      "تقييم مدى قيام الشركة برصد وتوثيق وتحليل رحلة ضيف الرحمن وتجربته بشكل ميداني ومستمر.",
    weight: 20,
    criticalGate: false,
    effectiveDate: "01-01-1447هـ",
    lastUpdated: "08-01-1447هـ",
    lastEvaluation: "قبل يوم واحد",
    version: 1,
    evidenceIds: ["EV-401", "EV-402"],
    evidenceDimensions: dims("found", "found", "unclear", "unclear", "pending_verification", {
      measurement: "بيانات رصد التجربة متوفرة لجزء من نقاط الخدمة فقط.",
      supporting_evidence: "تقارير الملاحظات الميدانية غير مرتبطة بوضوح بإجراءات التحسين.",
      completeness: "تقرير التحليل النهائي بانتظار اعتماد مشرف العمليات.",
    }),
    gapExplanationAr:
      "الرصد الميداني قائم وموثق، لكن تحليل نقاط الرصد غير مكتمل التغطية والتقرير النهائي بانتظار المراجعة البشرية.",
    recommendedActionAr:
      "توسيع تغطية رصد التجربة لتشمل جميع نقاط الخدمة وربط الملاحظات الميدانية بإجراءات تحسين محددة، مع استكمال الاعتماد.",
    versionHistory: [
      {
        version: 1,
        effectiveFrom: "01-01-1447هـ",
        weight: 20,
        status: "active",
        changeNote: "الإصدار الأول من المعيار ضمن نطاق النموذج التجريبي.",
      },
    ],
  },
  {
    id: "CR-005",
    nameAr: "توثيق فعاليات ومبادرات فريق السعادة",
    descriptionAr:
      "تقييم تنفيذ وقياس وتوثيق أنشطة ومبادرات فريق السعادة.",
    weight: 20,
    criticalGate: false,
    effectiveDate: "01-01-1447هـ",
    lastUpdated: "12-01-1447هـ",
    lastEvaluation: "اليوم",
    version: 1,
    evidenceIds: ["EV-501", "EV-502", "EV-503"],
    evidenceDimensions: dims("found", "found", "found", "found", "unclear", {
      completeness: "التقرير الموسمي الشامل لفريق السعادة قيد التجميع النهائي.",
    }),
    gapExplanationAr:
      "بيانات الجولات والمستفيدين والحالات موثقة بوضوح (270 جولة، 4,500 مستفيد، 120 حالة)، ولا ينقص سوى التقرير الموسمي الشامل.",
    recommendedActionAr: "استكمال التقرير الموسمي الشامل لفريق السعادة ورفعه كدليل نهائي.",
    versionHistory: [
      {
        version: 1,
        effectiveFrom: "01-01-1447هـ",
        weight: 20,
        status: "active",
        changeNote: "الإصدار الأول من المعيار ضمن نطاق النموذج التجريبي.",
      },
    ],
  },
];

function assemble(seed: RequirementSeed): Requirement {
  const score = computeRequirementScore(seed.evidenceDimensions);
  const complianceStatus = computeComplianceStatus(score, seed.evidenceDimensions);
  const riskLevel = computeRiskLevel(score, seed.criticalGate, seed.evidenceDimensions);
  const evidenceStatus = computeEvidenceStatus(seed.evidenceDimensions);
  const { confidence, reasonAr } = computeConfidence(seed.evidenceDimensions);

  return {
    id: seed.id,
    nameAr: seed.nameAr,
    descriptionAr: seed.descriptionAr,
    category: "happiness_team_experience_compliance",
    source: "وثيقة متطلبات النموذج التجريبي — MVP_REQUIREMENTS.md",
    sourceReference: seed.id,
    weight: seed.weight,
    weightIsOfficial: false,
    severity: seed.criticalGate ? "critical" : "standard",
    assessmentMethod: "hybrid",
    criticalGate: seed.criticalGate,
    version: seed.version,
    versionHistory: seed.versionHistory,
    status: "active",
    effectiveDate: seed.effectiveDate,
    lastUpdated: seed.lastUpdated,

    score,
    complianceStatus,
    riskLevel,
    evidenceStatus,
    lastEvaluation: seed.lastEvaluation,
    gapExplanationAr: seed.gapExplanationAr,
    recommendedActionAr: seed.recommendedActionAr,
    evidenceDimensions: seed.evidenceDimensions,
    evidenceIds: seed.evidenceIds,
    confidence,
    confidenceReasonAr: reasonAr,
  };
}

export function getRequirements(): Requirement[] {
  return REQUIREMENT_SEEDS.map(assemble);
}

export function getRequirementById(id: string): Requirement | undefined {
  return getRequirements().find((r) => r.id === id);
}
