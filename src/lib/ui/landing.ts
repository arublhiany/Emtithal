// =============================================================================
// Landing page — locked content constants (Phase 10). Pure, testable.
//
// The approved landing is intentionally minimal. Self-registration is NOT
// approved and must not appear or be implied. All three copy strings below are
// OWNER-APPROVED EXACT text — do not paraphrase.
// =============================================================================

import type { CompanyRole } from "@/lib/types";

/** Exact government CTA label (locked). */
export const GOVERNMENT_CTA_AR = "دخول الجهات الحكومية";

/** Exact company CTA label. */
export const COMPANY_CTA_AR = "دخول الشركات";

/** The single canonical company-facing role — no role picker on landing. */
export const COMPANY_ENTRY_ROLE: CompanyRole = "company_representative";
export const COMPANY_ENTRY_ROLE_LABEL_AR = "ممثل الشركة";

/** Owner-approved exact small intelligence line (shown as the subtle chip). */
export const AI_INTELLIGENCE_LINE_AR =
  "عبر ذكاء اصطناعي يحلل المخاطر ويحاكي أثر القرارات قبل تنفيذها";

export const LANDING_HEADLINE_AR =
  "يكشف مخاطر عدم الامتثال مبكرًا ويحاكي أثر القرارات قبل تنفيذها.";

export const LANDING_SUPPORTING_AR =
  "منصة ذكاء تنظيمي تجمع اشتراطات الجهات الحكومية ذات العلاقة بالحج والعمرة، وتربطها بأدلة وبيانات الشركات، لتكشف فجوات الامتثال، وتتوقع أثر السيناريوهات التشغيلية، وتقترح البدائل الأقل خطورة قبل اتخاذ القرار.";

export const LANDING_FOOTER_AR = "سبّاق © 1447هـ";

export const LANGUAGE_CONTROL = { arLabel: "العربية", enLabel: "English" } as const;
