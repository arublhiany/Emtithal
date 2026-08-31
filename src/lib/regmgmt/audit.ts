// =============================================================================
// Government regulatory-management — audit trail (Phase 10). Append-only.
//
// Audit entries record ONLY actions that actually happened. History is never
// removed or rewritten.
// =============================================================================

import type { AuditAction, AuditEntry } from "./types";

export const AUDIT_ACTION_LABEL_AR: Record<AuditAction, string> = {
  REQUIREMENT_CREATED: "إنشاء متطلب",
  DRAFT_UPDATED: "تعديل مسودة",
  VERSION_ISSUED: "إصدار نسخة",
  VERSION_ACTIVATED: "تفعيل نسخة",
  VERSION_SUPERSEDED: "استبدال نسخة",
  REQUIREMENT_DEACTIVATED: "إلغاء متطلب",
  SOURCE_CHANGED: "تغيير المصدر الرسمي",
  EFFECTIVE_DATE_CHANGED: "تغيير تاريخ السريان",
};

let counter = 0;

/** Deterministic-ish id: time + monotonic counter (unique within a session). */
function auditId(atIso: string): string {
  counter += 1;
  return `AUD-${atIso.replace(/[^0-9]/g, "").slice(0, 14)}-${counter.toString(36)}`;
}

export function newAuditEntry(
  requirementId: string,
  version: number | null,
  action: AuditAction,
  actorAr: string,
  atIso: string,
  extra: { summaryAr: string; fromValueAr?: string | null; toValueAr?: string | null },
): AuditEntry {
  return {
    id: auditId(atIso),
    requirementId,
    version,
    action,
    atIso,
    actorAr,
    summaryAr: extra.summaryAr,
    fromValueAr: extra.fromValueAr ?? null,
    toValueAr: extra.toValueAr ?? null,
  };
}

/** All audit entries for one requirement, newest first. */
export function auditForRequirement(all: AuditEntry[], requirementId: string): AuditEntry[] {
  return all
    .filter((a) => a.requirementId === requirementId)
    .slice()
    .sort((a, b) => (a.atIso < b.atIso ? 1 : a.atIso > b.atIso ? -1 : b.id.localeCompare(a.id)));
}
