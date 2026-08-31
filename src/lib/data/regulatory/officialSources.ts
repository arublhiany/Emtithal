// =============================================================================
// Verified issuing-authority sources — transcribed from REGULATORY_MATRIX_v1.md
// §3A (Official Sources and Verified Locators). Exact strings / URLs only; no
// invented page numbers.
// =============================================================================

import type { OfficialSource } from "@/lib/model";

/** A) HAJ-EXP-01 … HAJ-EXP-05 — precise pages established (§3A-A). */
export const SRC_HAJJ_EXPERIENCE_PROGRAM: OfficialSource = {
  authorityId: "MOHU",
  reference:
    'وزارة الحج والعمرة — "محددات البرنامج وأعمال مسار صناعة التجربة وتعزيز الثقة لموسم الحج 1447 هـ"',
  urls: [],
  locatorStatus: "VERIFIED_COMPLETE",
  locatorNote:
    "صفحات 7–8 (وزن المسار 3%، وزن كل معيار 20%، المعايير وتفاصيل القياس والمستندات الداعمة)",
};

/** B) HAJ-NUSUK-01 — the whole official FAQ page is the established locator (§3A-B). */
export const SRC_NUSUK_CARD_FAQ: OfficialSource = {
  authorityId: "MOHU",
  reference: "Official Nusuk Card FAQ",
  urls: ["https://nusukcard.haj.gov.sa/ar-SA/faq"],
  locatorStatus: "VERIFIED_COMPLETE",
  locatorNote: "صفحة الأسئلة الشائعة الرسمية لبطاقة نُسك (الصفحة كاملة)",
};

/**
 * C) HAJ-CATERING-01, HAJ-CAMP-01, HAJ-PROVIDERS-01 — verified document, but no
 * precise page/section established (§3A-C; matches `OFFICIAL_SOURCE_LOCATOR_UNRESOLVED`).
 */
export const SRC_SERVICE_COMPANIES_GUIDE_1447: OfficialSource = {
  authorityId: "MOHU",
  reference:
    'وزارة الحج والعمرة — "دليل التعليمات والإجراءات المنظمة لأداء شركات تقديم الخدمة لحجاج الخارج لموسم حج عام 1447هـ"',
  urls: [
    "https://haj.gov.sa/sitecore/content/HAJJ/Main/Home/Media-Center/Document-Library/Guide-to-Instructions-and-Procedures-Regulating-Performance-of-Service-Companies-Season-1447-AH/",
    "https://haj.gov.sa/s-core/-/media/Project/HAJJ/PDF-and-FILES/Document-Library/Guide-to-Instructions-and-Procedures-Regulating-Performance-of-Service-Companies-Season-1447-AH/AR-Guide-to-Instructions-and-Procedures-Regulating-Performance-of-Service-Companies-Season-1447-AH.pdf",
  ],
  locatorStatus: "INCOMPLETE",
  locatorNote: null,
};

/** D) CIV-01 … CIV-05 — official safety instructions with an established coverage locator (§3A-D). */
export const SRC_CIVIL_DEFENSE_HAJJ_SAFETY: OfficialSource = {
  authorityId: "CIVIL_DEFENSE",
  reference: 'الدفاع المدني — "تعليمات السلامة في الحج"',
  urls: [
    "https://998.gov.sa/Ar/Page/SafetyInstInHajj/web/Safety/HajjSafetyInstruction/",
    "https://998.gov.sa/ar/Page/News/2741/",
  ],
  locatorStatus: "VERIFIED_COMPLETE",
  locatorNote:
    "تعليمات السلامة الرسمية تغطي معدات وأنظمة الإطفاء، والعمالة المدربة، ومخارج الطوارئ، والتوصيلات الكهربائية غير المعتمدة، وقيود الطبخ داخل الخيام",
};

/** E) MOH-01 — the supported rule is precisely located in the Health Regulations (§3A-E). */
export const SRC_MOH_HEALTH_REGULATIONS: OfficialSource = {
  authorityId: "MOH",
  reference: "وزارة الصحة — Health Regulations (HealthRegulations1.pdf)",
  urls: ["https://www.moh.gov.sa/CCC/healthp/regulations/Documents/HealthRegulations1.pdf"],
  locatorStatus: "VERIFIED_COMPLETE",
  locatorNote:
    "القاعدة المدعومة: يسري اشتراط التطعيم ضد الحمى الشوكية على العاملين في الحج/العمرة الذين يتطلب عملهم اتصالًا مباشرًا بالحجاج/المعتمرين — وليس على جميع عاملي الشركة",
};
