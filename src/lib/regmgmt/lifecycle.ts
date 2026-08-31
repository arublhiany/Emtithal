// =============================================================================
// Government regulatory-management — lifecycle state machine (Phase 10). Pure.
//
// DRAFT ──activate──> ACTIVE ──(new version activated)──> SUPERSEDED
//   │                   │
//   └──deactivate──> DEACTIVATED <──deactivate──┘
//
// SUPERSEDED and DEACTIVATED are terminal. History is never removed. A DRAFT is
// never part of regulatory truth and never enters verification / readiness.
// =============================================================================

import type {
  AuditEntry,
  ManagedRequirement,
  ReqLifecycleStatus,
  RequirementVersionInput,
  RequirementVersionRecord,
} from "./types";
import { newAuditEntry } from "./audit";

export const LIFECYCLE_TRANSITIONS: Record<ReqLifecycleStatus, ReqLifecycleStatus[]> = {
  DRAFT: ["ACTIVE", "DEACTIVATED"],
  ACTIVE: ["SUPERSEDED", "DEACTIVATED"],
  SUPERSEDED: [],
  DEACTIVATED: [],
};

export const LIFECYCLE_LABEL_AR: Record<ReqLifecycleStatus, string> = {
  DRAFT: "مسودة",
  ACTIVE: "سارٍ",
  SUPERSEDED: "مُستبدَل",
  DEACTIVATED: "مُلغى",
};

export function canTransition(from: ReqLifecycleStatus, to: ReqLifecycleStatus): boolean {
  return LIFECYCLE_TRANSITIONS[from].includes(to);
}

/** Result shape — no throwing (matches the codebase's controlled-result style). */
export type LifecycleResult =
  | { ok: true; versions: RequirementVersionRecord[]; audit: AuditEntry[] }
  | { ok: false; errorAr: string };

// -- input validation ----------------------------------------------------

/** Returns Arabic error strings (empty = valid). Never invents defaults. */
export function validateVersionInput(input: RequirementVersionInput): string[] {
  const errs: string[] = [];
  if (!input.titleAr || input.titleAr.trim().length < 4) errs.push("عنوان المتطلب مطلوب.");
  if (!input.season || input.season.trim() === "") errs.push("الموسم مطلوب.");
  if (!input.domainAr || input.domainAr.trim() === "") errs.push("المجال مطلوب.");
  if (!input.changeSummaryAr || input.changeSummaryAr.trim().length < 4)
    errs.push("ملخّص التغيير مطلوب.");
  for (const u of input.officialSourceUrls) {
    if (u.trim() !== "" && !/^https?:\/\//i.test(u.trim()))
      errs.push(`رابط مصدر غير صالح: ${u}`);
  }
  return errs;
}

function nextVersionNumber(managed: ManagedRequirement): number {
  return managed.versions.reduce((m, v) => Math.max(m, v.version), 0) + 1;
}

function baseRecord(
  requirementId: string,
  version: number,
  input: RequirementVersionInput,
  actorAr: string,
  nowIso: string,
): RequirementVersionRecord {
  return {
    requirementId,
    version,
    status: "DRAFT",
    season: input.season.trim(),
    titleAr: input.titleAr.trim(),
    authorityId: input.authorityId,
    domainAr: input.domainAr.trim(),
    trackAr: input.trackAr,
    effectiveFrom: input.effectiveFrom,
    effectiveUntil: null,
    officialSourceReferenceAr: input.officialSourceReferenceAr,
    officialSourceUrls: input.officialSourceUrls.map((u) => u.trim()).filter(Boolean),
    officialSourceLocatorNoteAr: input.officialSourceLocatorNoteAr,
    verificationAreasAr: [...input.verificationAreasAr],
    changeSummaryAr: input.changeSummaryAr.trim(),
    origin: "GOVERNMENT_MANAGED",
    createdAtIso: nowIso,
    createdByAr: actorAr,
    updatedAtIso: nowIso,
    supersededByVersion: null,
  };
}

// -- create a brand-new requirement (its first DRAFT) ------------------

export function createNewRequirementDraft(
  requirementId: string,
  input: RequirementVersionInput,
  actorAr: string,
  nowIso: string,
): LifecycleResult {
  const errs = validateVersionInput(input);
  if (errs.length) return { ok: false, errorAr: errs.join(" ") };
  const rec = baseRecord(requirementId, 1, input, actorAr, nowIso);
  return {
    ok: true,
    versions: [rec],
    audit: [
      newAuditEntry(requirementId, 1, "REQUIREMENT_CREATED", actorAr, nowIso, {
        summaryAr: `أُنشئ متطلب جديد كمسودة: ${rec.titleAr}`,
      }),
    ],
  };
}

// -- issue a new DRAFT version of an existing requirement -------------

export function issueNewVersionDraft(
  managed: ManagedRequirement,
  input: RequirementVersionInput,
  actorAr: string,
  nowIso: string,
): LifecycleResult {
  const errs = validateVersionInput(input);
  if (errs.length) return { ok: false, errorAr: errs.join(" ") };
  if (managed.draftVersion != null)
    return { ok: false, errorAr: "توجد مسودة مفتوحة لهذا المتطلب — فعّلها أو ألغِها أولًا." };
  const anyActive = managed.versions.some((v) => v.status === "ACTIVE");
  const anyOpen = managed.versions.some((v) => v.status === "ACTIVE" || v.status === "DRAFT");
  if (!anyOpen && !anyActive)
    return { ok: false, errorAr: "المتطلب مُلغى ولا يمكن إصدار نسخة جديدة منه." };
  const version = nextVersionNumber(managed);
  const rec = baseRecord(managed.requirementId, version, input, actorAr, nowIso);
  return {
    ok: true,
    versions: [rec],
    audit: [
      newAuditEntry(managed.requirementId, version, "VERSION_ISSUED", actorAr, nowIso, {
        summaryAr: `صدرت مسودة النسخة ${version}: ${input.changeSummaryAr.trim()}`,
      }),
    ],
  };
}

// -- update an open DRAFT (no version change) ------------------------

export function updateDraft(
  managed: ManagedRequirement,
  version: number,
  input: RequirementVersionInput,
  actorAr: string,
  nowIso: string,
): LifecycleResult {
  const draft = managed.versions.find((v) => v.version === version);
  if (!draft) return { ok: false, errorAr: "النسخة غير موجودة." };
  if (draft.status !== "DRAFT")
    return { ok: false, errorAr: "لا يمكن تعديل نسخة غير المسودة." };
  const errs = validateVersionInput(input);
  if (errs.length) return { ok: false, errorAr: errs.join(" ") };
  const sourceChanged =
    (draft.officialSourceReferenceAr ?? "") !== (input.officialSourceReferenceAr ?? "") ||
    draft.officialSourceUrls.join("|") !== input.officialSourceUrls.map((u) => u.trim()).filter(Boolean).join("|");
  const dateChanged = (draft.effectiveFrom ?? "") !== (input.effectiveFrom ?? "");
  const updated: RequirementVersionRecord = {
    ...draft,
    season: input.season.trim(),
    titleAr: input.titleAr.trim(),
    authorityId: input.authorityId,
    domainAr: input.domainAr.trim(),
    trackAr: input.trackAr,
    effectiveFrom: input.effectiveFrom,
    officialSourceReferenceAr: input.officialSourceReferenceAr,
    officialSourceUrls: input.officialSourceUrls.map((u) => u.trim()).filter(Boolean),
    officialSourceLocatorNoteAr: input.officialSourceLocatorNoteAr,
    verificationAreasAr: [...input.verificationAreasAr],
    changeSummaryAr: input.changeSummaryAr.trim(),
    updatedAtIso: nowIso,
  };
  const audit: AuditEntry[] = [
    newAuditEntry(managed.requirementId, version, "DRAFT_UPDATED", actorAr, nowIso, {
      summaryAr: `عُدِّلت مسودة النسخة ${version}`,
    }),
  ];
  if (sourceChanged)
    audit.push(
      newAuditEntry(managed.requirementId, version, "SOURCE_CHANGED", actorAr, nowIso, {
        summaryAr: "تغيّر المصدر الرسمي في المسودة",
        fromValueAr: draft.officialSourceReferenceAr,
        toValueAr: updated.officialSourceReferenceAr,
      }),
    );
  if (dateChanged)
    audit.push(
      newAuditEntry(managed.requirementId, version, "EFFECTIVE_DATE_CHANGED", actorAr, nowIso, {
        summaryAr: "تغيّر تاريخ السريان في المسودة",
        fromValueAr: draft.effectiveFrom,
        toValueAr: updated.effectiveFrom,
      }),
    );
  return { ok: true, versions: [updated], audit };
}

// -- activate a DRAFT (supersedes the prior ACTIVE) ------------------

export function activateVersion(
  managed: ManagedRequirement,
  version: number,
  actorAr: string,
  nowIso: string,
): LifecycleResult {
  const target = managed.versions.find((v) => v.version === version);
  if (!target) return { ok: false, errorAr: "النسخة غير موجودة." };
  if (target.status !== "DRAFT")
    return { ok: false, errorAr: "لا يمكن تفعيل نسخة غير المسودة." };
  if (!canTransition("DRAFT", "ACTIVE"))
    return { ok: false, errorAr: "انتقال غير مسموح." };
  if (!target.effectiveFrom || target.effectiveFrom.trim() === "")
    return { ok: false, errorAr: "حدّد تاريخ السريان قبل التفعيل." };

  const out: RequirementVersionRecord[] = [];
  const audit: AuditEntry[] = [];
  const prior = managed.versions.find((v) => v.status === "ACTIVE");
  if (prior) {
    out.push({
      ...prior,
      status: "SUPERSEDED",
      effectiveUntil: target.effectiveFrom,
      supersededByVersion: version,
      updatedAtIso: nowIso,
    });
    audit.push(
      newAuditEntry(managed.requirementId, prior.version, "VERSION_SUPERSEDED", actorAr, nowIso, {
        summaryAr: `استُبدلت النسخة ${prior.version} بالنسخة ${version}`,
        fromValueAr: `النسخة ${prior.version} (سارية)`,
        toValueAr: `النسخة ${version} (سارية من ${target.effectiveFrom})`,
      }),
    );
  }
  out.push({ ...target, status: "ACTIVE", updatedAtIso: nowIso });
  audit.push(
    newAuditEntry(managed.requirementId, version, "VERSION_ACTIVATED", actorAr, nowIso, {
      summaryAr: `فُعِّلت النسخة ${version} — سارية من ${target.effectiveFrom}`,
    }),
  );
  return { ok: true, versions: out, audit };
}

// -- deactivate the requirement (its ACTIVE version) ---------------

export function deactivateRequirement(
  managed: ManagedRequirement,
  actorAr: string,
  nowIso: string,
  effectiveUntil: string,
  reasonAr: string,
): LifecycleResult {
  const target =
    managed.versions.find((v) => v.status === "ACTIVE") ??
    managed.versions.find((v) => v.status === "DRAFT");
  if (!target) return { ok: false, errorAr: "لا توجد نسخة سارية أو مسودة لإلغائها." };
  if (!canTransition(target.status, "DEACTIVATED"))
    return { ok: false, errorAr: "انتقال غير مسموح." };
  if (!effectiveUntil || effectiveUntil.trim() === "")
    return { ok: false, errorAr: "حدّد تاريخ نهاية السريان." };
  const rec: RequirementVersionRecord = {
    ...target,
    status: "DEACTIVATED",
    effectiveUntil,
    updatedAtIso: nowIso,
  };
  return {
    ok: true,
    versions: [rec],
    audit: [
      newAuditEntry(managed.requirementId, target.version, "REQUIREMENT_DEACTIVATED", actorAr, nowIso, {
        summaryAr: `أُلغي المتطلب من تاريخ ${effectiveUntil} — ${reasonAr.trim() || "بدون سبب مُدوَّن"}`,
        fromValueAr: "سارٍ",
        toValueAr: `مُلغى من ${effectiveUntil}`,
      }),
    ],
  };
}
