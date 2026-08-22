// =============================================================================
// Gap analysis — derived from requirements scoring below the compliant
// threshold. Text is authored to stay consistent with each requirement's
// evidence-dimension findings.
// =============================================================================

import type { Gap } from "@/lib/types";
import { DEMO_COMPANY_ID } from "@/lib/data/company";
import { getRequirements } from "@/lib/data/requirements";

export function getGaps(): Gap[] {
  const req = (id: string) => getRequirements().find((r) => r.id === id)!;

  const gaps: Gap[] = [
    {
      id: "GAP-002",
      companyId: DEMO_COMPANY_ID,
      requirementId: "CR-002",
      titleAr: "نقص في مؤشرات القياس وملف الاكتمال لبرامج الترسيخ المعرفي",
      currentStateAr: "برنامج توعوي واحد منفذ وموثق جزئيًا دون بيانات مستفيدين.",
      requiredStateAr: "توثيق شامل لبرامج الترسيخ المعرفي مع مؤشرات قياس وملف اكتمال موسمي.",
      gapDescriptionAr: req("CR-002").gapExplanationAr,
      severity: req("CR-002").riskLevel,
      evidenceDeficiencyAr: "لا تتوفر بيانات كمية للمستفيدين ولا ملف اكتمال ختامي.",
      operationalImpactAr: "صعوبة إثبات الأثر الفعلي لبرامج التوعية أمام المراجعين.",
      regulatoryRiskAr: "تراجع محتمل في تقييم معيار CR-002 عند التفتيش الرسمي.",
      reasonAr: "غياب آلية دورية لجمع بيانات القياس وتوثيقها فور انتهاء كل برنامج.",
      priority: "medium",
      suggestedActionAr: req("CR-002").recommendedActionAr,
      detectedAtLabel: "قبل 5 أيام",
    },
    {
      id: "GAP-003",
      companyId: DEMO_COMPANY_ID,
      requirementId: "CR-003",
      titleAr: "فجوة حرجة في توثيق وقياس أنشطة حفظ حقوق ضيف الرحمن",
      currentStateAr: "سجل جزئي يغطي فترة واحدة فقط من الموسم دون مؤشرات قياس.",
      requiredStateAr: "سجل تنفيذ كامل لكل فترات الموسم مع مؤشر قياس للمستفيدين وأدلة داعمة مكتملة.",
      gapDescriptionAr: req("CR-003").gapExplanationAr,
      severity: req("CR-003").riskLevel,
      evidenceDeficiencyAr: "غياب سجلات فترتين من أصل ثلاث، وعدم وجود مؤشر قياس أو ملف تقييم نهائي.",
      operationalImpactAr: "عدم القدرة على إثبات التزام الشركة بحماية حقوق ضيف الرحمن خلال معظم الموسم.",
      regulatoryRiskAr: "هذا معيار حرج (Critical Gate) — استمرار الفجوة قد يعرّض جاهزية الشركة الإجمالية للتفتيش لخطر مرتفع.",
      reasonAr: "عدم وجود مسؤول مخصص لمتابعة توثيق فعاليات التوعية بالحقوق بشكل دوري.",
      priority: "critical",
      suggestedActionAr: req("CR-003").recommendedActionAr,
      detectedAtLabel: "قبل 9 أيام",
    },
    {
      id: "GAP-004",
      companyId: DEMO_COMPANY_ID,
      requirementId: "CR-004",
      titleAr: "تغطية غير مكتملة لرصد رحلة الضيف وتقرير تحليل بانتظار الاعتماد",
      currentStateAr: "رصد ميداني يغطي 6 من أصل 9 نقاط خدمة، وتقرير التحليل النهائي غير معتمد.",
      requiredStateAr: "تغطية كاملة لجميع نقاط الخدمة مع ربط الملاحظات بإجراءات تحسين واعتماد التقرير.",
      gapDescriptionAr: req("CR-004").gapExplanationAr,
      severity: req("CR-004").riskLevel,
      evidenceDeficiencyAr: "3 نقاط خدمة دون رصد، وتقرير الملاحظات الأسبوعي بانتظار اعتماد مشرف العمليات.",
      operationalImpactAr: "قد تفوت الشركة مؤشرات مبكرة على تدهور تجربة الضيف في النقاط غير المرصودة.",
      regulatoryRiskAr: "خطر مرتفع نتيجة الزمن الحساس لرصد التجربة والتحقق البشري المعلّق.",
      reasonAr: "محدودية عدد فرق الرصد الميداني مقارنة بعدد نقاط الخدمة.",
      priority: "high",
      suggestedActionAr: req("CR-004").recommendedActionAr,
      detectedAtLabel: "قبل يوم واحد",
    },
  ];

  return gaps;
}

export function getGapsForRequirement(requirementId: string): Gap[] {
  return getGaps().filter((g) => g.requirementId === requirementId);
}
