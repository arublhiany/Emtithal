// =============================================================================
// Landing page — locked content constants (Phase 10). Pure, testable.
//
// The approved landing is intentionally minimal. Self-registration is NOT
// approved and must not appear or be implied. The AI-disclaimer pill IS
// approved — kept concise and visually subtle.
// =============================================================================

import type { CompanyRole } from "@/lib/types";

/** Exact government CTA label (locked). */
export const GOVERNMENT_CTA_AR = "دخول الجهات الحكومية";

/** Exact company CTA label. */
export const COMPANY_CTA_AR = "دخول الشركات";

/** The single canonical company-facing role — no role picker on landing. */
export const COMPANY_ENTRY_ROLE: CompanyRole = "company_representative";
export const COMPANY_ENTRY_ROLE_LABEL_AR = "ممثل الشركة";

/** Approved concise AI trust-boundary line. */
export const AI_DISCLAIMER_AR =
  "تحليلات الذكاء الاصطناعي مساندة للقرار وقابلة للمراجعة البشرية — لا تحل محل السلطة التنظيمية.";

export const LANDING_HEADLINE_AR =
  "يكشف مخاطر عدم الامتثال مبكرًا ويحاكي أثر القرارات قبل تنفيذها";

export const LANDING_SUPPORTING_AR =
  "منصة تربط اشتراطات الجهات الحكومية بأدلة وبيانات كل شركة، لقياس الجاهزية وكشف الفجوات قبل التفتيش.";

export const LANDING_FOOTER_AR = "امتثال © 1447هـ";

/** Canonical logo asset (product-owner supplied), served from /public. */
export const LOGO_ASSET_PATH = "/emtithal-logo.png";
/** Natural pixel size of the supplied asset — used to lock the aspect ratio. */
export const LOGO_INTRINSIC = { width: 1882, height: 836 } as const;

export const LANGUAGE_CONTROL = { arLabel: "العربية", enLabel: "English" } as const;
