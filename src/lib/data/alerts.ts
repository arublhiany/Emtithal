// =============================================================================
// Prioritized alerts — derived from gaps, evidence, and actions.
// =============================================================================

import type { AlertItem } from "@/lib/types";
import { DEMO_COMPANY_ID } from "@/lib/data/company";

export function getSeedAlerts(): AlertItem[] {
  return [
    {
      id: "ALERT-001",
      companyId: DEMO_COMPANY_ID,
      type: "critical_gap",
      titleAr: "فجوة حرجة في معيار ضمان حفظ حقوق ضيف الرحمن",
      descriptionAr:
        "متطلب HAJ-EXP-03 حرج بحالة غير ملتزم — يتطلب إجراءً تصحيحيًا فوريًا ومراجعة بشرية.",
      severity: "critical",
      requirementId: "CR-003",
      createdAtLabel: "قبل 9 أيام",
      isRead: false,
    },
    {
      id: "ALERT-002",
      companyId: DEMO_COMPANY_ID,
      type: "missing_evidence",
      titleAr: "أدلة ناقصة لمعيار حفظ حقوق ضيف الرحمن",
      descriptionAr: "سجلات فترتين من أصل ثلاث لفعاليات التوعية بالحقوق غير مرفوعة بعد.",
      severity: "high",
      requirementId: "CR-003",
      createdAtLabel: "قبل 7 أيام",
      isRead: false,
    },
    {
      id: "ALERT-003",
      companyId: DEMO_COMPANY_ID,
      type: "evidence_expiring",
      titleAr: "دليل يقترب من انتهاء صلاحيته",
      descriptionAr:
        "سجل \"فعاليات التوعية بالحقوق - Q2\" أصبح غير محدّث (18 يومًا) ويحتاج تحديثًا قبل التفتيش القادم.",
      severity: "medium",
      requirementId: "CR-003",
      createdAtLabel: "قبل يومين",
      isRead: false,
    },
    {
      id: "ALERT-004",
      companyId: DEMO_COMPANY_ID,
      type: "requirement_deterioration",
      titleAr: "تراجع في تغطية رصد رحلة الضيف",
      descriptionAr: "تغطية رصد التجربة الميدانية توقفت عند 6 من أصل 9 نقاط خدمة هذا الأسبوع.",
      severity: "high",
      requirementId: "CR-004",
      createdAtLabel: "قبل يوم واحد",
      isRead: false,
    },
    {
      id: "ALERT-005",
      companyId: DEMO_COMPANY_ID,
      type: "action_overdue",
      titleAr: "إجراء تصحيحي متأخر عن موعده",
      descriptionAr: "لم يبدأ تنفيذ إجراء \"استكمال سجل فعاليات التوعية بالحقوق\" رغم اقتراب الموعد المستهدف.",
      severity: "high",
      requirementId: "CR-003",
      createdAtLabel: "اليوم",
      isRead: false,
    },
  ];
}
