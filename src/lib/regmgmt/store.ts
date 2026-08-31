// =============================================================================
// Government regulatory-management — versioned state + pure reducers (Phase 10).
//
// A SEPARATE localStorage store from the demo store (own key, own schema
// version, own guard) so it never touches the demo store's persisted shape or
// its tests. Canonical Phase-1 requirements seed an ACTIVE v1 baseline
// (origin CANONICAL_BASELINE) — that baseline is never mutated; government
// actions append DRAFT / new-version / deactivation records and audit entries.
//
// Pure module (no React, no DOM) — unit-testable directly.
// =============================================================================

import { getRegulatoryRequirements } from "@/lib/data/regulatory";
import type {
  AuditEntry,
  ManagedRequirement,
  RegChangeNotification,
  RequirementVersionInput,
  RequirementVersionRecord,
} from "./types";
import {
  activateVersion,
  createNewRequirementDraft,
  deactivateRequirement,
  issueNewVersionDraft,
  updateDraft,
  type LifecycleResult,
} from "./lifecycle";
import { auditForRequirement } from "./audit";

export const REGMGMT_STORAGE_KEY = "emtithal-regmgmt-v1";
export const REGMGMT_SCHEMA_VERSION = 1;
export const REGMGMT_LEGACY_KEYS: readonly string[] = [];

export interface RegMgmtState {
  managed: ManagedRequirement[];
  audit: AuditEntry[];
  notifications: RegChangeNotification[];
}

// -- derive the convenience fields on a ManagedRequirement -----------

function recompute(m: ManagedRequirement): ManagedRequirement {
  const versions = [...m.versions].sort((a, b) => a.version - b.version);
  const active = versions.find((v) => v.status === "ACTIVE") ?? null;
  const draft = versions.find((v) => v.status === "DRAFT") ?? null;
  return {
    ...m,
    versions,
    activeVersion: active ? active.version : null,
    draftVersion: draft ? draft.version : null,
  };
}

// -- seed from the canonical baseline --------------------------------

const BASELINE_SEASON_LABEL = "بداية موسم 1447هـ";

function baselineVersion(reqId: string, r: ReturnType<typeof getRegulatoryRequirements>[number]): RequirementVersionRecord {
  return {
    requirementId: reqId,
    version: 1,
    status: "ACTIVE",
    season: r.season,
    titleAr: r.titleAr,
    authorityId: r.authorityId,
    domainAr: r.domainAr,
    trackAr: r.trackAr,
    effectiveFrom: BASELINE_SEASON_LABEL,
    effectiveUntil: null,
    officialSourceReferenceAr: r.officialSource ? r.officialSource.reference : null,
    officialSourceUrls: r.officialSource ? [...r.officialSource.urls] : [],
    officialSourceLocatorNoteAr: r.officialSource ? r.officialSource.locatorNote : null,
    verificationAreasAr: [...r.verificationAreasAr],
    changeSummaryAr: "النسخة الأساسية المعتمدة من المصفوفة التنظيمية (Phase 1).",
    origin: "CANONICAL_BASELINE",
    createdAtIso: "2026-01-01T00:00:00.000Z",
    createdByAr: "المصفوفة التنظيمية المعتمدة",
    updatedAtIso: "2026-01-01T00:00:00.000Z",
    supersededByVersion: null,
  };
}

export function seedRegMgmtState(): RegMgmtState {
  const managed: ManagedRequirement[] = getRegulatoryRequirements().map((r) =>
    recompute({
      requirementId: r.id,
      identityTitleAr: r.titleAr,
      origin: "CANONICAL_BASELINE",
      versions: [baselineVersion(r.id, r)],
      activeVersion: 1,
      draftVersion: null,
    }),
  );
  return { managed, audit: [], notifications: [] };
}

// -- persistence: envelope + guard (same pattern as the demo store) ----

interface Envelope {
  schemaVersion: number;
  state: RegMgmtState;
}

export function serializeRegMgmt(state: RegMgmtState): string {
  const env: Envelope = { schemaVersion: REGMGMT_SCHEMA_VERSION, state };
  return JSON.stringify(env);
}

export type RegMgmtDeserializeReason =
  | "empty"
  | "unparseable"
  | "not_an_envelope"
  | "version_mismatch"
  | "bad_shape";

export interface RegMgmtDeserializeResult {
  state: RegMgmtState;
  rejected: boolean;
  reason?: RegMgmtDeserializeReason;
}

function isRegMgmtShape(v: unknown): v is RegMgmtState {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  if (!Array.isArray(s.managed) || !Array.isArray(s.audit) || !Array.isArray(s.notifications))
    return false;
  return s.managed.every((m) => {
    if (typeof m !== "object" || m === null) return false;
    const mm = m as Record<string, unknown>;
    return typeof mm.requirementId === "string" && Array.isArray(mm.versions);
  });
}

export function deserializeRegMgmt(
  raw: string | null | undefined,
  seed: RegMgmtState,
): RegMgmtDeserializeResult {
  if (raw == null || raw === "") return { state: seed, rejected: true, reason: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: seed, rejected: true, reason: "unparseable" };
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("schemaVersion" in parsed) ||
    !("state" in parsed)
  ) {
    return { state: seed, rejected: true, reason: "not_an_envelope" };
  }
  const env = parsed as Record<string, unknown>;
  if (env.schemaVersion !== REGMGMT_SCHEMA_VERSION)
    return { state: seed, rejected: true, reason: "version_mismatch" };
  if (!isRegMgmtShape(env.state)) return { state: seed, rejected: true, reason: "bad_shape" };
  return { state: env.state as RegMgmtState, rejected: false };
}

// -- pure reducers (append audit, never mutate) ---------------------

function replaceManaged(state: RegMgmtState, m: ManagedRequirement): RegMgmtState {
  const exists = state.managed.some((x) => x.requirementId === m.requirementId);
  return {
    ...state,
    managed: exists
      ? state.managed.map((x) => (x.requirementId === m.requirementId ? m : x))
      : [...state.managed, m],
  };
}

function mergeVersions(
  m: ManagedRequirement,
  changed: RequirementVersionRecord[],
): ManagedRequirement {
  const byV = new Map(m.versions.map((v) => [v.version, v]));
  for (const c of changed) byV.set(c.version, c);
  return recompute({ ...m, versions: [...byV.values()] });
}

export type ReducerResult =
  | { ok: true; state: RegMgmtState }
  | { ok: false; errorAr: string };

function applyLifecycle(
  state: RegMgmtState,
  m: ManagedRequirement | null,
  requirementId: string,
  res: LifecycleResult,
  identityTitleAr?: string,
): ReducerResult {
  if (!res.ok) return { ok: false, errorAr: res.errorAr };
  const base: ManagedRequirement =
    m ??
    recompute({
      requirementId,
      identityTitleAr: identityTitleAr ?? res.versions[0]?.titleAr ?? requirementId,
      origin: "GOVERNMENT_MANAGED",
      versions: [],
      activeVersion: null,
      draftVersion: null,
    });
  const merged = mergeVersions(base, res.versions);
  return {
    ok: true,
    state: { ...replaceManaged(state, merged), audit: [...state.audit, ...res.audit] },
  };
}

export function reduceCreateRequirement(
  state: RegMgmtState,
  requirementId: string,
  input: RequirementVersionInput,
  actorAr: string,
  nowIso: string,
): ReducerResult {
  if (state.managed.some((m) => m.requirementId === requirementId))
    return { ok: false, errorAr: "معرّف المتطلب مستخدم بالفعل." };
  return applyLifecycle(
    state,
    null,
    requirementId,
    createNewRequirementDraft(requirementId, input, actorAr, nowIso),
    input.titleAr.trim(),
  );
}

function find(state: RegMgmtState, id: string): ManagedRequirement | null {
  return state.managed.find((m) => m.requirementId === id) ?? null;
}

export function reduceIssueVersion(
  state: RegMgmtState,
  requirementId: string,
  input: RequirementVersionInput,
  actorAr: string,
  nowIso: string,
): ReducerResult {
  const m = find(state, requirementId);
  if (!m) return { ok: false, errorAr: "المتطلب غير موجود." };
  return applyLifecycle(state, m, requirementId, issueNewVersionDraft(m, input, actorAr, nowIso));
}

export function reduceUpdateDraft(
  state: RegMgmtState,
  requirementId: string,
  version: number,
  input: RequirementVersionInput,
  actorAr: string,
  nowIso: string,
): ReducerResult {
  const m = find(state, requirementId);
  if (!m) return { ok: false, errorAr: "المتطلب غير موجود." };
  return applyLifecycle(state, m, requirementId, updateDraft(m, version, input, actorAr, nowIso));
}

export function reduceActivateVersion(
  state: RegMgmtState,
  requirementId: string,
  version: number,
  actorAr: string,
  nowIso: string,
): ReducerResult {
  const m = find(state, requirementId);
  if (!m) return { ok: false, errorAr: "المتطلب غير موجود." };
  return applyLifecycle(state, m, requirementId, activateVersion(m, version, actorAr, nowIso));
}

export function reduceDeactivate(
  state: RegMgmtState,
  requirementId: string,
  actorAr: string,
  nowIso: string,
  effectiveUntil: string,
  reasonAr: string,
): ReducerResult {
  const m = find(state, requirementId);
  if (!m) return { ok: false, errorAr: "المتطلب غير موجود." };
  return applyLifecycle(
    state,
    m,
    requirementId,
    deactivateRequirement(m, actorAr, nowIso, effectiveUntil, reasonAr),
  );
}

export function reduceRecordNotifications(
  state: RegMgmtState,
  notifications: RegChangeNotification[],
): RegMgmtState {
  return { ...state, notifications: [...state.notifications, ...notifications] };
}

// -- selectors -----------------------------------------------------

export function activeVersionOf(m: ManagedRequirement): RequirementVersionRecord | null {
  return m.versions.find((v) => v.version === m.activeVersion) ?? null;
}

export function draftVersionOf(m: ManagedRequirement): RequirementVersionRecord | null {
  return m.versions.find((v) => v.version === m.draftVersion) ?? null;
}

export { auditForRequirement };
