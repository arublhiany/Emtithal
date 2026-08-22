// =============================================================================
// Demo evidence records for the Evidence Center.
//
// AI analysis text below is written to be consistent with the deterministic
// evidence-dimension states set in lib/data/requirements.ts — it never
// contradicts the Compliance Engine's findings (MASTER_SPEC §28: AI cannot
// override deterministic results).
// =============================================================================

import type { Evidence } from "@/lib/types";
import { DEMO_COMPANY_ID } from "@/lib/data/company";

export function getEvidenceRecords(): Evidence[] {
  return [
    {
      id: "EV-101",
      companyId: DEMO_COMPANY_ID,
      requirementIds: ["CR-001"],
      fileName: "مبادرة-استراحة-الطريق-تقرير-تنفيذ.pdf",
      fileType: "pdf",
      uploadedAtLabel: "قبل 6 أيام",
      uploadedAt: "2026-08-16",
      sizeLabel: "2.4 MB",
      status: "found",
      validationStatus: "verified",
      analysis: {
        summaryAr:
          "تقرير تنفيذ يوثق مبادرة \"استراحة الطريق\" مع صور ميدانية وبيانات المستفيدين.",
        extractedFields: [
          { labelAr: "اسم المبادرة", value: "استراحة الطريق", locationAr: "صفحة 1" },
          { labelAr: "عدد نقاط التنفيذ", value: "5 نقاط خدمة", locationAr: "صفحة 2" },
          { labelAr: "عدد المستفيدين", value: "1,850 ضيفًا", locationAr: "صفحة 3" },
        ],
        matchedRequirementIds: ["CR-001"],
        missingAr: ["مؤشر القياس الختامي للأثر على رضا الضيوف"],
        confidence: "medium",
        confidenceReasonAr: "التنفيذ موثق بوضوح لكن مؤشر القياس الختامي غير مرفق بعد.",
      },
    },
    {
      id: "EV-102",
      companyId: DEMO_COMPANY_ID,
      requirementIds: ["CR-001"],
      fileName: "صور-ميدانية-مبادرات-الضيافة.zip",
      fileType: "image",
      uploadedAtLabel: "قبل 6 أيام",
      uploadedAt: "2026-08-16",
      sizeLabel: "18.1 MB",
      status: "found",
      validationStatus: "verified",
      analysis: {
        summaryAr: "أرشيف صور يدعم تنفيذ مبادرات صناعة تجربة ضيف الرحمن ميدانيًا.",
        extractedFields: [{ labelAr: "عدد الصور", value: "42 صورة موثقة زمنيًا" }],
        matchedRequirementIds: ["CR-001"],
        missingAr: [],
        confidence: "high",
        confidenceReasonAr: "الصور مطابقة زمنيًا ومكانيًا لتقرير التنفيذ.",
      },
    },
    {
      id: "EV-201",
      companyId: DEMO_COMPANY_ID,
      requirementIds: ["CR-002"],
      fileName: "برنامج-التوعية-المفاهيم-الحديثة.pdf",
      fileType: "pdf",
      uploadedAtLabel: "قبل 11 يومًا",
      uploadedAt: "2026-08-11",
      sizeLabel: "1.1 MB",
      status: "needs_review",
      validationStatus: "needs_review",
      analysis: {
        summaryAr: "يوثق الملف تنفيذ برنامج توعوي واحد حول المفاهيم الحديثة في تجربة الضيافة.",
        extractedFields: [
          { labelAr: "اسم البرنامج", value: "ورشة تحديث معايير الضيافة", locationAr: "صفحة 1" },
        ],
        matchedRequirementIds: ["CR-002"],
        missingAr: [
          "عدد المستفيدين من البرنامج",
          "ملف الاكتمال الموسمي لبرامج الترسيخ المعرفي",
        ],
        confidence: "low",
        confidenceReasonAr: "لا تتوفر بيانات كمية للمستفيدين ولا ملف اكتمال ختامي.",
      },
    },
    {
      id: "EV-301",
      companyId: DEMO_COMPANY_ID,
      requirementIds: ["CR-003"],
      fileName: "سجل-فعاليات-التوعية-بالحقوق-Q2.xlsx",
      fileType: "excel",
      uploadedAtLabel: "قبل 18 يومًا",
      uploadedAt: "2026-08-04",
      sizeLabel: "480 KB",
      status: "outdated",
      validationStatus: "needs_review",
      analysis: {
        summaryAr: "سجل جزئي لفعاليات التوعية بالحقوق يغطي فترة واحدة فقط من الموسم.",
        extractedFields: [
          { labelAr: "عدد الفعاليات المسجلة", value: "4 فعاليات", locationAr: "ورقة العمل: سجل" },
        ],
        matchedRequirementIds: ["CR-003"],
        missingAr: [
          "سجلات الفترتين المتبقيتين من الموسم",
          "مؤشر قياس عدد المستفيدين",
          "الأدلة الداعمة المرتبطة بكل فعالية",
        ],
        confidence: "low",
        confidenceReasonAr: "الملف يغطي جزءًا محدودًا فقط من الموسم ولا يحتوي مؤشرات قياس.",
      },
      isDemoUpload: false,
    },
    {
      id: "EV-401",
      companyId: DEMO_COMPANY_ID,
      requirementIds: ["CR-004"],
      fileName: "خطة-رصد-تجربة-الضيف-الميدانية.pdf",
      fileType: "pdf",
      uploadedAtLabel: "قبل 3 أيام",
      uploadedAt: "2026-08-19",
      sizeLabel: "3.2 MB",
      status: "found",
      validationStatus: "verified",
      analysis: {
        summaryAr: "خطة رصد ميدانية توثق آلية متابعة رحلة الضيف في نقاط الخدمة الرئيسية.",
        extractedFields: [
          { labelAr: "نقاط الرصد المغطاة", value: "6 من أصل 9 نقاط خدمة", locationAr: "صفحة 2" },
        ],
        matchedRequirementIds: ["CR-004"],
        missingAr: ["تغطية 3 نقاط خدمة متبقية"],
        confidence: "medium",
        confidenceReasonAr: "التغطية جزئية ولا تشمل جميع نقاط الخدمة.",
      },
    },
    {
      id: "EV-402",
      companyId: DEMO_COMPANY_ID,
      requirementIds: ["CR-004"],
      fileName: "تقرير-ملاحظات-ميدانية-أسبوعي.pdf",
      fileType: "pdf",
      uploadedAtLabel: "قبل يوم واحد",
      uploadedAt: "2026-08-21",
      sizeLabel: "900 KB",
      status: "needs_review",
      validationStatus: "pending_verification",
      analysis: {
        summaryAr: "تقرير أسبوعي يرصد ملاحظات ميدانية عن تجربة الضيوف بانتظار اعتماد مشرف العمليات.",
        extractedFields: [
          { labelAr: "عدد الملاحظات المسجلة", value: "17 ملاحظة", locationAr: "صفحة 1" },
        ],
        matchedRequirementIds: ["CR-004"],
        missingAr: ["ربط الملاحظات بإجراءات تحسين محددة", "اعتماد مشرف العمليات"],
        confidence: "medium",
        confidenceReasonAr: "المحتوى مكتمل نسبيًا لكنه بانتظار الاعتماد النهائي.",
      },
    },
    {
      id: "EV-501",
      companyId: DEMO_COMPANY_ID,
      requirementIds: ["CR-005"],
      fileName: "سجل-جولات-فريق-السعادة.xlsx",
      fileType: "excel",
      uploadedAtLabel: "اليوم",
      uploadedAt: "2026-08-22",
      sizeLabel: "610 KB",
      status: "found",
      validationStatus: "verified",
      analysis: {
        summaryAr: "سجل تفصيلي لجولات فريق السعادة الميدانية لهذا الموسم.",
        extractedFields: [
          { labelAr: "عدد الجولات", value: "270 جولة", locationAr: "ورقة العمل: الجولات" },
          { labelAr: "عدد المستفيدين", value: "4,500 مستفيد", locationAr: "ورقة العمل: الجولات" },
        ],
        matchedRequirementIds: ["CR-005"],
        missingAr: [],
        confidence: "high",
        confidenceReasonAr: "البيانات مكتملة ومتسقة عبر جميع الأعمدة المطلوبة.",
      },
    },
    {
      id: "EV-502",
      companyId: DEMO_COMPANY_ID,
      requirementIds: ["CR-005"],
      fileName: "سجل-الحالات-والتدخلات.xlsx",
      fileType: "excel",
      uploadedAtLabel: "اليوم",
      uploadedAt: "2026-08-22",
      sizeLabel: "310 KB",
      status: "found",
      validationStatus: "verified",
      analysis: {
        summaryAr: "سجل الحالات والتدخلات الميدانية لفريق السعادة مع حالة المعالجة.",
        extractedFields: [{ labelAr: "عدد الحالات المرصودة", value: "120 حالة" }],
        matchedRequirementIds: ["CR-005"],
        missingAr: [],
        confidence: "high",
        confidenceReasonAr: "جميع الحالات مرفقة بحالة معالجة واضحة.",
      },
    },
    {
      id: "EV-503",
      companyId: DEMO_COMPANY_ID,
      requirementIds: ["CR-005"],
      fileName: "مبادرات-فريق-السعادة-موسم-1447.pdf",
      fileType: "pdf",
      uploadedAtLabel: "قبل يومين",
      uploadedAt: "2026-08-20",
      sizeLabel: "2.0 MB",
      status: "needs_review",
      validationStatus: "pending_verification",
      analysis: {
        summaryAr: "مسودة التقرير الموسمي الشامل لفريق السعادة، لا تزال قيد التجميع النهائي.",
        extractedFields: [{ labelAr: "حالة التقرير", value: "مسودة — غير مكتمل" }],
        matchedRequirementIds: ["CR-005"],
        missingAr: ["القسم الختامي لمؤشرات الرضا"],
        confidence: "medium",
        confidenceReasonAr: "التقرير في مراحله الأخيرة ولم يكتمل القسم الختامي بعد.",
      },
    },
  ];
}

export function getEvidenceForRequirement(requirementId: string): Evidence[] {
  return getEvidenceRecords().filter((e) => e.requirementIds.includes(requirementId));
}
