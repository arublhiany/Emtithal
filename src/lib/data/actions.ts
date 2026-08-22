// =============================================================================
// Improvement plan — corrective actions linked to gaps.
// Seed statuses are intentionally mixed (not started / in progress /
// completed) to make the Improvement Plan screen demonstrable.
// =============================================================================

import type { ImprovementAction } from "@/lib/types";
import { DEMO_COMPANY_ID } from "@/lib/data/company";

export function getSeedActions(): ImprovementAction[] {
  return [
    {
      id: "ACT-001",
      companyId: DEMO_COMPANY_ID,
      gapId: "GAP-002",
      requirementId: "CR-002",
      titleAr: "تجميع ملف اكتمال موحد لبرامج الترسيخ المعرفي",
      problemAr: "غياب مؤشرات القياس وملف الاكتمال الموسمي لبرامج تبني المفاهيم الحديثة.",
      recommendedActionAr:
        "تجميع مخرجات برامج الترسيخ المعرفي في ملف اكتمال موحد وإضافة مؤشرات قياس كمية للمستفيدين.",
      priority: "medium",
      responsibleRoleAr: "مسؤول الامتثال",
      targetDateLabel: "خلال 10 أيام",
      status: "in_progress",
      expectedImprovement: 4,
    },
    {
      id: "ACT-002",
      companyId: DEMO_COMPANY_ID,
      gapId: "GAP-003",
      requirementId: "CR-003",
      titleAr: "استكمال سجل فعاليات التوعية بحقوق ضيف الرحمن",
      problemAr: "سجل جزئي لفعاليات التوعية بالحقوق يغطي فترة واحدة فقط من الموسم — معيار حرج.",
      recommendedActionAr:
        "رفع سجلات تنفيذ كاملة لأنشطة التوعية بالحقوق مع مؤشر قياس لعدد المستفيدين، وطلب مراجعة بشرية عاجلة.",
      priority: "critical",
      responsibleRoleAr: "مدير العمليات",
      targetDateLabel: "خلال 3 أيام",
      status: "not_started",
      expectedImprovement: 9,
    },
    {
      id: "ACT-003",
      companyId: DEMO_COMPANY_ID,
      gapId: "GAP-004",
      requirementId: "CR-004",
      titleAr: "توسيع تغطية رصد تجربة الضيف الميدانية",
      problemAr: "تغطية رصد الرحلة تقتصر على 6 من أصل 9 نقاط خدمة.",
      recommendedActionAr:
        "توسيع تغطية رصد التجربة لتشمل جميع نقاط الخدمة وربط الملاحظات الميدانية بإجراءات تحسين محددة.",
      priority: "high",
      responsibleRoleAr: "مدير العمليات",
      targetDateLabel: "خلال 7 أيام",
      status: "not_started",
      expectedImprovement: 6,
    },
    {
      id: "ACT-004",
      companyId: DEMO_COMPANY_ID,
      gapId: "GAP-004",
      requirementId: "CR-004",
      titleAr: "اعتماد تقرير الملاحظات الميدانية الأسبوعي",
      problemAr: "تقرير الملاحظات الميدانية بانتظار اعتماد مشرف العمليات منذ يوم واحد.",
      recommendedActionAr: "مراجعة التقرير واعتماده وربط كل ملاحظة بإجراء تحسين محدد.",
      priority: "medium",
      responsibleRoleAr: "مشرف العمليات",
      targetDateLabel: "خلال يومين",
      status: "in_progress",
      expectedImprovement: 2,
    },
    {
      id: "ACT-005",
      companyId: DEMO_COMPANY_ID,
      gapId: "GAP-002",
      requirementId: "CR-002",
      titleAr: "إضافة مؤشرات قياس كمية لبرنامج التوعية بالمفاهيم الحديثة",
      problemAr: "لا تتوفر بيانات كمية لعدد المستفيدين من برنامج \"ورشة تحديث معايير الضيافة\".",
      recommendedActionAr: "توثيق عدد المستفيدين ومؤشرات الأثر لكل جلسة توعوية فور انتهائها.",
      priority: "low",
      responsibleRoleAr: "مسؤول الامتثال",
      targetDateLabel: "تم الإنجاز",
      status: "completed",
      expectedImprovement: 2,
    },
  ];
}
