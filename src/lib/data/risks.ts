// =============================================================================
// Risk register — one risk per open gap. Methodology follows
// EMTITHAL_MASTER_SPEC.md §35 (severity, gap magnitude, criticality,
// evidence quality, time sensitivity) as implemented deterministically in
// lib/engine/scoringEngine.ts (computeRiskLevel).
// =============================================================================

import type { Risk } from "@/lib/types";
import { DEMO_COMPANY_ID } from "@/lib/data/company";
import { getRequirements } from "@/lib/data/requirements";

export function getRisks(): Risk[] {
  const req = (id: string) => getRequirements().find((r) => r.id === id)!;

  return [
    {
      id: "RISK-002",
      companyId: DEMO_COMPANY_ID,
      requirementId: "CR-002",
      gapId: "GAP-002",
      titleAr: "ضعف إثبات الأثر لبرامج تبني المفاهيم الحديثة",
      impact: "medium",
      probability: "medium",
      level: req("CR-002").riskLevel,
      descriptionAr:
        "غياب مؤشرات القياس يجعل من الصعب إثبات فعالية برامج الترسيخ المعرفي أمام المراجعين.",
      methodologyNoteAr:
        "المستوى محسوب آليًا من النتيجة الرقمية (70) وعدد أبعاد الأدلة غير المكتملة (2).",
    },
    {
      id: "RISK-003",
      companyId: DEMO_COMPANY_ID,
      requirementId: "CR-003",
      gapId: "GAP-003",
      titleAr: "خطر حرج على حفظ حقوق ضيف الرحمن",
      impact: "critical",
      probability: "high",
      level: req("CR-003").riskLevel,
      descriptionAr:
        "معيار حرج (Critical Gate) بنتيجة منخفضة (40) وثلاثة أبعاد أدلة غير مكتملة — يستدعي إجراءً فوريًا ومراجعة بشرية.",
      methodologyNoteAr:
        "المستوى \"حرج\" لأن المعيار مصنّف Critical Gate والنتيجة أقل من الحد الأدنى (50).",
    },
    {
      id: "RISK-004",
      companyId: DEMO_COMPANY_ID,
      requirementId: "CR-004",
      gapId: "GAP-004",
      titleAr: "خطر مرتفع على التعايش مع رحلة الضيف ورصد التجربة",
      impact: "high",
      probability: "medium",
      level: req("CR-004").riskLevel,
      descriptionAr:
        "التغطية الجزئية لنقاط الخدمة (6 من 9) مع تقرير تحليل معلّق يزيدان من احتمالية تفويت مؤشرات تدهور مبكرة.",
      methodologyNoteAr:
        "المستوى \"مرتفع\" لأن النتيجة (65) ضمن نطاق الالتزام الجزئي مع 3 أبعاد أدلة غير مكتملة.",
    },
  ];
}
