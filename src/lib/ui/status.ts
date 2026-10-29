// =============================================================================
// UI label + tone maps for canonical enums (Phase 11). One source, wired from
// the approved glossary. Never expose a raw internal enum in the UI.
// =============================================================================

import type { ComplianceStatus } from "@/lib/model";
import { GLOSSARY_AR } from "@/lib/i18n/glossary";

export type ChipTone = "green" | "amber" | "red" | "indigo" | "neutral";

export const STATUS_LABEL_AR: Record<ComplianceStatus, string> = {
  COMPLIANT: GLOSSARY_AR.COMPLIANT,
  PARTIALLY_COMPLIANT: GLOSSARY_AR.PARTIALLY_COMPLIANT,
  NON_COMPLIANT: GLOSSARY_AR.NON_COMPLIANT,
  PENDING_VERIFICATION: GLOSSARY_AR.PENDING_VERIFICATION,
  INSUFFICIENT_DATA: GLOSSARY_AR.INSUFFICIENT_DATA,
  NOT_APPLICABLE: GLOSSARY_AR.NOT_APPLICABLE,
};

export const STATUS_TONE: Record<ComplianceStatus, ChipTone> = {
  COMPLIANT: "green",
  PARTIALLY_COMPLIANT: "amber",
  NON_COMPLIANT: "red",
  PENDING_VERIFICATION: "indigo",
  INSUFFICIENT_DATA: "neutral",
  NOT_APPLICABLE: "neutral",
};

export type Applicability = "APPLICABLE" | "NOT_APPLICABLE" | "INSUFFICIENT_DATA";

export const APPLICABILITY_LABEL_AR: Record<Applicability, string> = {
  APPLICABLE: "منطبق",
  NOT_APPLICABLE: GLOSSARY_AR.NOT_APPLICABLE,
  INSUFFICIENT_DATA: GLOSSARY_AR.INSUFFICIENT_DATA,
};

export const DATA_SOURCE_LABEL_AR = {
  CONNECTED: GLOSSARY_AR.DATA_SOURCE_CONNECTED,
  NOT_CONNECTED: GLOSSARY_AR.DATA_SOURCE_NOT_CONNECTED,
  IMPORTED: GLOSSARY_AR.DATA_SOURCE_IMPORTED,
  PENDING_LINK: GLOSSARY_AR.DATA_SOURCE_PENDING_LINK,
} as const;

export const READINESS_INDEX_AR = GLOSSARY_AR.EMTITHAL_READINESS_INDEX; // "مؤشر جاهزية سبّاق"
export const VERIFICATION_COVERAGE_AR = GLOSSARY_AR.VERIFICATION_COVERAGE; // "نسبة التحقق"
export const CRITICAL_BLOCKER_AR = GLOSSARY_AR.CRITICAL_BLOCKER;
export const UNRESOLVED_REQUIREMENT_AR = GLOSSARY_AR.UNRESOLVED_REQUIREMENT;

/**
 * Season code → Arabic display, e.g. `"1447H"` → `"1447هـ"`. Display only —
 * the internal season identifier is never changed. `null`/`undefined` → `"—"`.
 */
export function formatSeasonAr(season: string | null | undefined): string {
  return season == null || season === "" ? "—" : season.replace(/\s*H$/i, "هـ");
}

// -- official published weight (regulatory metadata, NOT a score input) --------

export const OFFICIAL_WEIGHT_LABEL_AR = "الوزن الرسمي المنشور";
export const OFFICIAL_WEIGHT_NOTE_AR =
  "بيانات تعريفية رسمية — لا تُستخدم في حساب مؤشر جاهزية سبّاق.";

/**
 * Official published within-track weight → display text. `"20%"` for the
 * experience criteria the matrix publishes, `"—"` where the matrix publishes
 * none. NEVER substitutes an internal/demo weight and never invents a number.
 */
export function officialWeightText(withinTrackPercent: number | null | undefined): string {
  return withinTrackPercent == null ? "—" : `${withinTrackPercent}%`;
}

/** null / undefined → "—" (never "0"). */
export function show(n: number | null | undefined): string {
  return n == null ? "—" : String(n);
}
