// =============================================================================
// Government regulatory-management — regulatory-change notifications (Phase 10).
//
// Notifications are part of the requirement lifecycle. They are scoped ONLY to
// companies the deterministic impact analysis marked as affected — unrelated
// companies are never notified. Each carries concise Arabic copy and a direct
// in-app link to the affected requirement / required action.
// =============================================================================

import type {
  ImpactAnalysis,
  RegChangeNotification,
  RegChangeType,
  RequirementVersionRecord,
} from "./types";

export const REG_CHANGE_TYPE_LABEL_AR: Record<RegChangeType, string> = {
  NEW_REQUIREMENT: "اشتراط جديد",
  UPDATED_REQUIREMENT: "تحديث اشتراط",
  NEW_VERSION: "نسخة جديدة",
  DEACTIVATED_REQUIREMENT: "إلغاء اشتراط",
  UPCOMING_EFFECTIVE_DATE: "تاريخ سريان قادم",
  ACTION_REQUIRED: "إجراء مطلوب",
};

function copyFor(
  type: RegChangeType,
  v: RequirementVersionRecord,
): { titleAr: string; bodyAr: string } {
  const eff = v.effectiveFrom ? ` — يسري من ${v.effectiveFrom}` : "";
  switch (type) {
    case "NEW_REQUIREMENT":
      return {
        titleAr: "تم إصدار اشتراط جديد ينطبق على منشأتك",
        bodyAr: `«${v.titleAr}»${eff}. راجِع الاشتراط وحدّد ما يلزم من بيانات أو أدلة.`,
      };
    case "UPDATED_REQUIREMENT":
      return {
        titleAr: "تم تحديث اشتراط ينطبق على منشأتك",
        bodyAr: `«${v.titleAr}» — النسخة ${v.version}: ${v.changeSummaryAr}${eff}.`,
      };
    case "NEW_VERSION":
      return {
        titleAr: "صدرت نسخة جديدة من اشتراط ينطبق على منشأتك",
        bodyAr: `«${v.titleAr}» — النسخة ${v.version}${eff}. اطّلع على سجل النسخ والتغيير.`,
      };
    case "DEACTIVATED_REQUIREMENT":
      return {
        titleAr: "لم يعد هذا الاشتراط ساريًا",
        bodyAr: `«${v.titleAr}» أُلغي${v.effectiveUntil ? ` اعتبارًا من ${v.effectiveUntil}` : ""}. تُعاد مواءمة تقييم منشأتك دون أي أثر سلبي تلقائي.`,
      };
    case "UPCOMING_EFFECTIVE_DATE":
      return {
        titleAr: "تاريخ سريان قادم لاشتراط ينطبق على منشأتك",
        bodyAr: `«${v.titleAr}»${eff}. استعدّ للتحقق قبل هذا التاريخ.`,
      };
    case "ACTION_REQUIRED":
    default:
      return {
        titleAr: "إجراء مطلوب بشأن اشتراط ينطبق على منشأتك",
        bodyAr: `«${v.titleAr}» — قد يلزم تحديث بيانات أو تقديم أدلة جديدة أو خطوة تحقق.`,
      };
  }
}

let seq = 0;

/**
 * One notification per affected company (impact state ≠ NO_IMPACT). A company
 * whose impact requires action gets `actionRequired: true`. `targetHref` deep-
 * links to the requirement's compliance view for that company.
 */
export function buildRegChangeNotifications(
  version: RequirementVersionRecord,
  changeType: RegChangeType,
  impact: ImpactAnalysis,
  nowIso: string,
): RegChangeNotification[] {
  const base = copyFor(changeType, version);
  return impact.impacts
    .filter((i) => i.state !== "NO_IMPACT")
    .map((i) => {
      seq += 1;
      const actionRequired =
        i.state === "NEW_EVIDENCE_REQUIRED" || i.state === "COMPANY_ACTION_REQUIRED";
      return {
        id: `NRC-${nowIso.replace(/[^0-9]/g, "").slice(0, 14)}-${seq.toString(36)}`,
        companyId: i.companyId,
        requirementId: version.requirementId,
        version: version.version,
        type: changeType,
        titleAr: base.titleAr,
        bodyAr: `${base.bodyAr} ${i.reasonAr}`.trim(),
        effectiveFrom: version.effectiveFrom,
        actionRequired,
        targetHref: `/company/compliance/${encodeURIComponent(version.requirementId)}`,
        createdAtIso: nowIso,
      };
    });
}
