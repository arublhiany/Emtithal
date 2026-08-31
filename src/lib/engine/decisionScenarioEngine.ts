// =============================================================================
// Decision Scenario Engine — deterministic, authoritative (Phase 7). NO LLM.
//
// Given a set of validated operational mutations, this clones the canonical
// company profile, applies them ONLY to the clone, and runs the existing
// Phase 2 applicability + Phase 3 verification/readiness engines. It also
// computes a deterministic scenario diff ("why did the result change?").
//
// It never computes an Official Score, never sets a compliance status itself
// (the Verification Engine does), and never invents a requirement, weight,
// penalty, target, or regulatory effect. Mutations are restricted to a closed
// allow-list of canonical company-profile field paths.
// =============================================================================

import type {
  ApplicabilityOutcome,
  CanonicalCompanyProfile,
  ComplianceStatus,
  LocatorStatus,
  RequirementResolution,
} from "@/lib/model";
import { getRegulatoryRequirements, getRequirementByCanonicalId } from "@/lib/data/regulatory";
import {
  verifyAll,
  type RequirementVerificationInput,
  type VerificationRun,
} from "@/lib/engine/verificationEngine";

// -- closed operational-variable catalog ---------------------------------
//
// EXACT canonical `CanonicalCompanyProfile` field paths only. Nothing outside
// this list may be simulated — a request for any other field is an
// UNSUPPORTED_DECISION_VARIABLE.

export const MUTABLE_DECISION_FIELDS = [
  "pilgrims.count",
  "workforce.count",
  "directContactWorkers.count",
  "nusukApplicablePersons.count",
  "declaredFacts.experienceTrackScopeDeclared",
  "declaredFacts.companyResponsibleForCamp",
  "declaredFacts.contractsExternalServiceProviders",
  "declaredFacts.providesOrEnsuresCatering",
] as const;

export type MutableDecisionField = (typeof MUTABLE_DECISION_FIELDS)[number];
export type MutableFieldKind = "COUNT" | "BOOLEAN";

export const DECISION_FIELD_KIND: Record<MutableDecisionField, MutableFieldKind> = {
  "pilgrims.count": "COUNT",
  "workforce.count": "COUNT",
  "directContactWorkers.count": "COUNT",
  "nusukApplicablePersons.count": "COUNT",
  "declaredFacts.experienceTrackScopeDeclared": "BOOLEAN",
  "declaredFacts.companyResponsibleForCamp": "BOOLEAN",
  "declaredFacts.contractsExternalServiceProviders": "BOOLEAN",
  "declaredFacts.providesOrEnsuresCatering": "BOOLEAN",
};

export const DECISION_FIELD_LABEL_AR: Record<MutableDecisionField, string> = {
  "pilgrims.count": "عدد الحجاج المخدومين",
  "workforce.count": "إجمالي القوى العاملة",
  "directContactWorkers.count": "العاملون ذوو الاتصال المباشر بالحجاج",
  "nusukApplicablePersons.count": "الأشخاص المشمولون ببطاقة نُسك",
  "declaredFacts.experienceTrackScopeDeclared": "الإعلان بأن الشركة ضمن نطاق مسار التجربة",
  "declaredFacts.companyResponsibleForCamp": "مسؤولية الشركة عن المخيمات/المواقع",
  "declaredFacts.contractsExternalServiceProviders": "التعاقد مع مقدمي خدمات خارجيين",
  "declaredFacts.providesOrEnsuresCatering": "مسؤولية الشركة عن الإعاشة",
};

export function isMutableDecisionField(path: string): path is MutableDecisionField {
  return (MUTABLE_DECISION_FIELDS as readonly string[]).includes(path);
}

// -- mutations ---------------------------------------------------------

export type DecisionMutationSource = "USER_STATED" | "CURRENT_PROFILE" | "SCENARIO_ASSUMPTION";

export interface ValidatedMutation {
  fieldPath: MutableDecisionField;
  kind: MutableFieldKind;
  currentValue: number | boolean | null;
  scenarioValue: number | boolean | null;
  source: DecisionMutationSource;
}

export type MutationRejectionCode = "UNSUPPORTED_DECISION_VARIABLE" | "INVALID_VALUE";

export interface MutationRejection {
  fieldPath: string;
  code: MutationRejectionCode;
  reason: string;
}

type ProfileScalar = number | boolean | null;

/** Reads a catalog field's current value from a profile. */
export function readProfileField(
  profile: CanonicalCompanyProfile,
  path: MutableDecisionField,
): ProfileScalar {
  switch (path) {
    case "pilgrims.count":
      return profile.pilgrims.count;
    case "workforce.count":
      return profile.workforce.count;
    case "directContactWorkers.count":
      return profile.directContactWorkers.count;
    case "nusukApplicablePersons.count":
      return profile.nusukApplicablePersons.count;
    case "declaredFacts.experienceTrackScopeDeclared":
      return profile.declaredFacts.experienceTrackScopeDeclared;
    case "declaredFacts.companyResponsibleForCamp":
      return profile.declaredFacts.companyResponsibleForCamp;
    case "declaredFacts.contractsExternalServiceProviders":
      return profile.declaredFacts.contractsExternalServiceProviders;
    case "declaredFacts.providesOrEnsuresCatering":
      return profile.declaredFacts.providesOrEnsuresCatering;
  }
}

function coerceValue(
  kind: MutableFieldKind,
  raw: unknown,
): { ok: true; value: ProfileScalar } | { ok: false; reason: string } {
  if (kind === "COUNT") {
    let n: number;
    if (typeof raw === "number") n = raw;
    else if (typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw.trim())))
      n = Number(raw.trim());
    else return { ok: false, reason: `not a number: ${JSON.stringify(raw)}` };
    if (!Number.isFinite(n) || n < 0) return { ok: false, reason: `count must be a non-negative number` };
    if (!Number.isInteger(n)) n = Math.round(n);
    if (n > 100_000_000) return { ok: false, reason: `count is implausibly large` };
    return { ok: true, value: n };
  }
  // BOOLEAN
  if (typeof raw === "boolean") return { ok: true, value: raw };
  if (typeof raw === "string") {
    const t = raw.trim().toLowerCase();
    if (["true", "yes", "نعم", "1"].includes(t)) return { ok: true, value: true };
    if (["false", "no", "لا", "0"].includes(t)) return { ok: true, value: false };
  }
  return { ok: false, reason: `not a boolean: ${JSON.stringify(raw)}` };
}

/** Validates one raw model-supplied change against the catalog + type + domain. */
export function validateMutation(
  profile: CanonicalCompanyProfile,
  fieldPath: string,
  rawValue: unknown,
  source: DecisionMutationSource,
): { ok: true; mutation: ValidatedMutation } | { ok: false; rejection: MutationRejection } {
  if (!isMutableDecisionField(fieldPath)) {
    return {
      ok: false,
      rejection: {
        fieldPath,
        code: "UNSUPPORTED_DECISION_VARIABLE",
        reason: `'${fieldPath}' is not in the approved operational-variable catalog.`,
      },
    };
  }
  const kind = DECISION_FIELD_KIND[fieldPath];
  const coerced = coerceValue(kind, rawValue);
  if (!coerced.ok) {
    return { ok: false, rejection: { fieldPath, code: "INVALID_VALUE", reason: coerced.reason } };
  }
  return {
    ok: true,
    mutation: {
      fieldPath,
      kind,
      currentValue: readProfileField(profile, fieldPath),
      scenarioValue: coerced.value,
      source,
    },
  };
}

// -- user-stated constraints (§ "keep/same" is a constraint, not a change) ----

/**
 * A value the user explicitly wants held fixed (e.g. "keep workforce at 180").
 * Uses the SAME closed catalog + type validation as a mutation, but is NEVER a
 * scenario mutation and is NEVER reclassified as a SCENARIO_ASSUMPTION.
 */
export interface ValidatedConstraint {
  fieldPath: MutableDecisionField;
  kind: MutableFieldKind;
  expectedValue: number | boolean | null;
  source: "USER_STATED";
  intentAr: string;
}

export function validateConstraint(
  profile: CanonicalCompanyProfile,
  fieldPath: string,
  rawValue: unknown,
  intentAr: string,
): { ok: true; constraint: ValidatedConstraint } | { ok: false; rejection: MutationRejection } {
  if (!isMutableDecisionField(fieldPath)) {
    return {
      ok: false,
      rejection: {
        fieldPath,
        code: "UNSUPPORTED_DECISION_VARIABLE",
        reason: `'${fieldPath}' is not in the approved operational-variable catalog.`,
      },
    };
  }
  const kind = DECISION_FIELD_KIND[fieldPath];
  const coerced = coerceValue(kind, rawValue);
  if (!coerced.ok) {
    return { ok: false, rejection: { fieldPath, code: "INVALID_VALUE", reason: coerced.reason } };
  }
  return {
    ok: true,
    constraint: { fieldPath, kind, expectedValue: coerced.value, source: "USER_STATED", intentAr },
  };
}

/**
 * Returns the constraint a mutation would violate, or `null`. A mutation whose
 * value EQUALS the constrained expected value is a no-op, not a violation.
 */
export function mutationViolatesConstraint(
  mutation: ValidatedMutation,
  constraints: ValidatedConstraint[],
): ValidatedConstraint | null {
  for (const c of constraints) {
    if (c.fieldPath === mutation.fieldPath && mutation.scenarioValue !== c.expectedValue) return c;
  }
  return null;
}

/** Deep-clones a profile and applies mutations to the CLONE only. Never touches the input. */
export function applyMutations(
  profile: CanonicalCompanyProfile,
  mutations: ValidatedMutation[],
): CanonicalCompanyProfile {
  const clone = structuredClone(profile);
  for (const m of mutations) {
    switch (m.fieldPath) {
      case "pilgrims.count":
        clone.pilgrims.count = m.scenarioValue as number | null;
        break;
      case "workforce.count":
        clone.workforce.count = m.scenarioValue as number | null;
        break;
      case "directContactWorkers.count":
        clone.directContactWorkers.count = m.scenarioValue as number | null;
        break;
      case "nusukApplicablePersons.count":
        clone.nusukApplicablePersons.count = m.scenarioValue as number | null;
        break;
      case "declaredFacts.experienceTrackScopeDeclared":
        clone.declaredFacts.experienceTrackScopeDeclared = m.scenarioValue as boolean | null;
        break;
      case "declaredFacts.companyResponsibleForCamp":
        clone.declaredFacts.companyResponsibleForCamp = m.scenarioValue as boolean | null;
        break;
      case "declaredFacts.contractsExternalServiceProviders":
        clone.declaredFacts.contractsExternalServiceProviders = m.scenarioValue as boolean | null;
        break;
      case "declaredFacts.providesOrEnsuresCatering":
        clone.declaredFacts.providesOrEnsuresCatering = m.scenarioValue as boolean | null;
        break;
    }
  }
  return clone;
}

// -- canonical requirement lineage (§12) -----------------------------

export interface RequirementLineage {
  requirementId: string;
  titleAr: string;
  authorityId: string;
  regulatoryResolution: RequirementResolution;
  officialSourceReference: string | null;
  officialSourceUrls: string[];
  officialSourceLocatorNote: string | null;
  locatorStatus: LocatorStatus | null;
  matrixSourceRef: string;
  season: string;
}

export function requirementLineage(requirementId: string): RequirementLineage | null {
  const req = getRequirementByCanonicalId(requirementId);
  if (!req) return null;
  const src = req.officialSource;
  return {
    requirementId: req.id,
    titleAr: req.titleAr,
    authorityId: req.authorityId,
    regulatoryResolution: req.resolution,
    officialSourceReference: src ? src.reference : null,
    officialSourceUrls: src ? [...src.urls] : [],
    officialSourceLocatorNote: src ? src.locatorNote : null,
    locatorStatus: src ? src.locatorStatus : null,
    matrixSourceRef: req.matrixSourceRef,
    season: req.season,
  };
}

// -- internal operational indicator (§ "add deterministic operational impact") -
//
// A pure ratio of two canonical profile fields. It is explicitly NOT an official
// requirement, NOT a compliance measure, NOT a readiness component, NOT a risk
// tier, NOT a government threshold. No "safe" / "required" ratio is ever invented.
// It NEVER feeds readiness, coverage, blockers, or any score.

export type OperationalMetricClassification = "INTERNAL_OPERATIONAL_INDICATOR";

export interface OperationalMetric {
  key: "pilgrimsPerWorkforceMember";
  /** `pilgrims.count / workforce.count`. `null` when either is missing or workforce is 0. */
  raw: number | null;
  /** Rounded to 2 decimals — for display only, never for further arithmetic. */
  display: number | null;
  provenanceFieldPaths: string[];
  classification: OperationalMetricClassification;
}

export interface OperationalMetrics {
  pilgrimsPerWorkforceMember: OperationalMetric;
}

export function operationalMetrics(profile: CanonicalCompanyProfile): OperationalMetrics {
  const pilgrims = profile.pilgrims.count;
  const workforce = profile.workforce.count;
  const raw =
    typeof pilgrims === "number" && typeof workforce === "number" && workforce > 0
      ? pilgrims / workforce
      : null;
  return {
    pilgrimsPerWorkforceMember: {
      key: "pilgrimsPerWorkforceMember",
      raw,
      display: raw == null ? null : Math.round(raw * 100) / 100,
      provenanceFieldPaths: ["pilgrims.count", "workforce.count"],
      classification: "INTERNAL_OPERATIONAL_INDICATOR",
    },
  };
}

// -- deterministic state + KPIs --------------------------------------

export interface DeterministicKpis {
  readinessRaw: number | null;
  readiness: number | null;
  coverageRaw: number | null;
  coverage: number | null;
  statusCounts: Record<ComplianceStatus, number>;
  criticalBlockerIds: string[];
  verificationGapIds: string[];
  regulatoryPendingIds: string[];
  applicabilityPendingIds: string[];
  /** Enforced invariant — Emtithal never computes an Official Score. */
  officialScoreComputed: false;
}

export function kpisFromRun(run: VerificationRun): DeterministicKpis {
  return {
    readinessRaw: run.readiness.rawValue,
    readiness: run.readiness.value,
    coverageRaw: run.coverage.rawValue,
    coverage: run.coverage.value,
    statusCounts: run.statusCounts,
    criticalBlockerIds: run.criticalBlockers.map((b) => b.requirementId).sort(),
    verificationGapIds: run.verificationGaps.map((g) => g.requirementId).sort(),
    regulatoryPendingIds: [...run.regulatoryPendingIds].sort(),
    applicabilityPendingIds: [...run.applicabilityPendingIds].sort(),
    officialScoreComputed: false,
  };
}

export interface RequirementState {
  requirementId: string;
  applicability: ApplicabilityOutcome;
  applicabilityReason: string;
  status: ComplianceStatus;
  readiness: number | null;
  assessable: boolean;
  regulatoryResolution: RequirementResolution;
  regulatoryPending: boolean;
}

export interface DeterministicScenarioState {
  scenarioId: string;
  mutations: ValidatedMutation[];
  requirements: RequirementState[];
  kpis: DeterministicKpis;
  /** Internal operational indicator(s) — never part of any compliance/readiness calc. */
  operationalMetrics: OperationalMetrics;
}

/** Runs applicability + verification on a (possibly mutated) clone of the profile. */
export function runDeterministicState(
  scenarioId: string,
  baseProfile: CanonicalCompanyProfile,
  mutations: ValidatedMutation[],
  verificationInputs: RequirementVerificationInput[],
): DeterministicScenarioState {
  const requirements = getRegulatoryRequirements();
  const profile = applyMutations(baseProfile, mutations);
  const run = verifyAll(requirements, profile, verificationInputs);
  return {
    scenarioId,
    mutations,
    requirements: run.results.map((r) => ({
      requirementId: r.requirementId,
      applicability: r.applicability,
      applicabilityReason: r.applicabilityReason,
      status: r.status,
      readiness: r.readiness,
      assessable: r.assessable,
      regulatoryResolution: r.regulatoryResolution,
      regulatoryPending: r.regulatoryPending,
    })),
    kpis: kpisFromRun(run),
    operationalMetrics: operationalMetrics(profile),
  };
}

// -- deterministic scenario diff ("why did the result change?") -------

export interface OutcomeChange<T> {
  requirementId: string;
  from: T;
  to: T;
  lineage: RequirementLineage | null;
}

export type MetricDirection = "INCREASED" | "DECREASED" | "UNCHANGED" | "UNDETERMINED";

export interface OperationalMetricChange {
  key: string;
  fromRaw: number | null;
  toRaw: number | null;
  fromDisplay: number | null;
  toDisplay: number | null;
  direction: MetricDirection;
}

export interface ScenarioDiff {
  scenarioId: string;
  fieldsChanged: ValidatedMutation[];
  applicabilityChanges: OutcomeChange<ApplicabilityOutcome>[];
  verificationStatusChanges: OutcomeChange<ComplianceStatus>[];
  /** RAW − RAW readiness. `null` when either side is `null`. */
  readinessDelta: number | null;
  coverageDelta: number | null;
  blockersAdded: string[];
  blockersRemoved: string[];
  verificationGapsAdded: string[];
  verificationGapsRemoved: string[];
  regulatoryPendingDelta: number;
  applicabilityPendingDelta: number;
  /** Deterministic change in the internal operational indicator(s). */
  operationalMetricChanges: OperationalMetricChange[];
  /** Deduped canonical lineage for every requirement surfaced above. */
  sourceLineage: RequirementLineage[];
  /** Any UNRESOLVED_REQUIREMENT that appears in a change — stays visibly unresolved. */
  unresolvedRequirementIds: string[];
}

function setDiff(before: string[], after: string[]): { added: string[]; removed: string[] } {
  const b = new Set(before);
  const a = new Set(after);
  return {
    added: after.filter((x) => !b.has(x)).sort(),
    removed: before.filter((x) => !a.has(x)).sort(),
  };
}

export function diffAgainst(
  current: DeterministicScenarioState,
  scenario: DeterministicScenarioState,
): ScenarioDiff {
  const curById = new Map(current.requirements.map((r) => [r.requirementId, r]));

  const applicabilityChanges: OutcomeChange<ApplicabilityOutcome>[] = [];
  const verificationStatusChanges: OutcomeChange<ComplianceStatus>[] = [];
  for (const s of scenario.requirements) {
    const c = curById.get(s.requirementId);
    if (!c) continue;
    if (c.applicability !== s.applicability) {
      applicabilityChanges.push({
        requirementId: s.requirementId,
        from: c.applicability,
        to: s.applicability,
        lineage: requirementLineage(s.requirementId),
      });
    }
    if (c.status !== s.status) {
      verificationStatusChanges.push({
        requirementId: s.requirementId,
        from: c.status,
        to: s.status,
        lineage: requirementLineage(s.requirementId),
      });
    }
  }

  const readinessDelta =
    current.kpis.readinessRaw == null || scenario.kpis.readinessRaw == null
      ? null
      : scenario.kpis.readinessRaw - current.kpis.readinessRaw;
  const coverageDelta =
    current.kpis.coverageRaw == null || scenario.kpis.coverageRaw == null
      ? null
      : scenario.kpis.coverageRaw - current.kpis.coverageRaw;

  const blockers = setDiff(current.kpis.criticalBlockerIds, scenario.kpis.criticalBlockerIds);
  const gaps = setDiff(current.kpis.verificationGapIds, scenario.kpis.verificationGapIds);

  const touchedIds = new Set<string>([
    ...applicabilityChanges.map((c) => c.requirementId),
    ...verificationStatusChanges.map((c) => c.requirementId),
    ...blockers.added,
    ...blockers.removed,
    ...gaps.added,
    ...gaps.removed,
  ]);

  const sourceLineage: RequirementLineage[] = [];
  const unresolvedRequirementIds: string[] = [];
  for (const id of [...touchedIds].sort()) {
    const lin = requirementLineage(id);
    if (lin) {
      sourceLineage.push(lin);
      if (lin.regulatoryResolution === "UNRESOLVED_REQUIREMENT") unresolvedRequirementIds.push(id);
    }
  }

  const operationalMetricChanges = diffOperationalMetrics(
    current.operationalMetrics,
    scenario.operationalMetrics,
  );

  return {
    scenarioId: scenario.scenarioId,
    fieldsChanged: scenario.mutations,
    applicabilityChanges,
    verificationStatusChanges,
    readinessDelta,
    coverageDelta,
    blockersAdded: blockers.added,
    blockersRemoved: blockers.removed,
    verificationGapsAdded: gaps.added,
    verificationGapsRemoved: gaps.removed,
    regulatoryPendingDelta:
      scenario.kpis.regulatoryPendingIds.length - current.kpis.regulatoryPendingIds.length,
    applicabilityPendingDelta:
      scenario.kpis.applicabilityPendingIds.length - current.kpis.applicabilityPendingIds.length,
    operationalMetricChanges,
    sourceLineage,
    unresolvedRequirementIds,
  };
}

function diffOperationalMetrics(
  before: OperationalMetrics,
  after: OperationalMetrics,
): OperationalMetricChange[] {
  const keys = Object.keys(before) as (keyof OperationalMetrics)[];
  const out: OperationalMetricChange[] = [];
  for (const k of keys) {
    const b = before[k];
    const a = after[k];
    let direction: MetricDirection;
    if (b.raw == null || a.raw == null) direction = "UNDETERMINED";
    else if (a.raw > b.raw) direction = "INCREASED";
    else if (a.raw < b.raw) direction = "DECREASED";
    else direction = "UNCHANGED";
    out.push({
      key: b.key,
      fromRaw: b.raw,
      toRaw: a.raw,
      fromDisplay: b.display,
      toDisplay: a.display,
      direction,
    });
  }
  return out;
}

// -- deterministic "why did the result change?" (§ authoritative explanation) --
//
// Built ONLY from the diff fields. The AI may add an optional supplementary
// note, but this list is the canonical answer.

export function buildWhyChangedAr(diff: ScenarioDiff): string[] {
  const lines: string[] = [];

  if (diff.fieldsChanged.length > 0) {
    lines.push(
      `الحقول المتغيرة: ${diff.fieldsChanged
        .map(
          (m) =>
            `${m.fieldPath} من ${String(m.currentValue)} إلى ${String(m.scenarioValue)} (${m.source})`,
        )
        .join("، ")}.`,
    );
  } else {
    lines.push("لا يوجد تغيير في حقول ملف الشركة.");
  }

  for (const mc of diff.operationalMetricChanges) {
    if (mc.direction === "UNCHANGED" || mc.direction === "UNDETERMINED") {
      lines.push(
        mc.direction === "UNDETERMINED"
          ? `المؤشر التشغيلي الداخلي (${mc.key}) غير محدد لعدم توفر القيمتين.`
          : `المؤشر التشغيلي الداخلي (${mc.key}) لم يتغيّر (${mc.fromDisplay ?? "—"}).`,
      );
    } else {
      const dir = mc.direction === "INCREASED" ? "ارتفع" : "انخفض";
      lines.push(
        `المؤشر التشغيلي الداخلي (${mc.key}) ${dir} من ${mc.fromDisplay} إلى ${mc.toDisplay} (مؤشر داخلي فقط — ليس متطلبًا رسميًا ولا مقياس امتثال ولا حدًا حكوميًا).`,
      );
    }
  }

  lines.push(
    diff.applicabilityChanges.length > 0
      ? `تغيّر انطباق المتطلبات: ${diff.applicabilityChanges
          .map((c) => `${c.requirementId} (${c.from}→${c.to})`)
          .join("، ")}.`
      : "لم يتغيّر انطباق أي متطلب.",
  );
  lines.push(
    diff.verificationStatusChanges.length > 0
      ? `تغيّرت حالة التحقق: ${diff.verificationStatusChanges
          .map((c) => `${c.requirementId} (${c.from}→${c.to})`)
          .join("، ")}.`
      : "لم تتغيّر حالة التحقق لأي متطلب.",
  );
  lines.push(
    diff.readinessDelta == null
      ? "مؤشر الجاهزية غير محدد على أحد الجانبين."
      : diff.readinessDelta === 0
        ? "لم يتغيّر مؤشر الجاهزية."
        : `تغيّر مؤشر الجاهزية (قيمة خام) بمقدار ${diff.readinessDelta}.`,
  );
  lines.push(
    diff.coverageDelta == null
      ? "نسبة التحقق غير محددة على أحد الجانبين."
      : diff.coverageDelta === 0
        ? "لم تتغيّر نسبة التحقق."
        : `تغيّرت نسبة التحقق (قيمة خام) بمقدار ${diff.coverageDelta}.`,
  );
  if (diff.blockersAdded.length > 0)
    lines.push(`عوائق حرجة مضافة: ${diff.blockersAdded.join("، ")}.`);
  if (diff.blockersRemoved.length > 0)
    lines.push(`عوائق حرجة مُزالة: ${diff.blockersRemoved.join("، ")}.`);
  if (diff.verificationGapsAdded.length > 0)
    lines.push(`فجوات تحقق مضافة: ${diff.verificationGapsAdded.join("، ")}.`);
  if (diff.verificationGapsRemoved.length > 0)
    lines.push(`فجوات تحقق مُزالة: ${diff.verificationGapsRemoved.join("، ")}.`);
  if (diff.regulatoryPendingDelta !== 0)
    lines.push(`تغيّر عدد المتطلبات غير المحسومة تنظيميًا بمقدار ${diff.regulatoryPendingDelta}.`);
  if (diff.applicabilityPendingDelta !== 0)
    lines.push(`تغيّر عدد المتطلبات غير مؤكدة الانطباق بمقدار ${diff.applicabilityPendingDelta}.`);
  if (diff.unresolvedRequirementIds.length > 0)
    lines.push(
      `متطلبات غير محسومة تنظيميًا ضمن التغيير وتبقى غير محسومة: ${diff.unresolvedRequirementIds.join(
        "، ",
      )}.`,
    );

  const hasOperationalChange = diff.operationalMetricChanges.some(
    (m) => m.direction === "INCREASED" || m.direction === "DECREASED",
  );
  const noRegulatoryOrReadinessEffect =
    diff.applicabilityChanges.length === 0 &&
    diff.verificationStatusChanges.length === 0 &&
    diff.blockersAdded.length === 0 &&
    diff.blockersRemoved.length === 0 &&
    diff.verificationGapsAdded.length === 0 &&
    diff.verificationGapsRemoved.length === 0 &&
    (diff.readinessDelta == null || diff.readinessDelta === 0) &&
    (diff.coverageDelta == null || diff.coverageDelta === 0);

  if (diff.fieldsChanged.length > 0 && hasOperationalChange && noRegulatoryOrReadinessEffect) {
    lines.push(
      "تغيّر المؤشر التشغيلي الداخلي نتيجة التغيير المقترح، بينما لم ينتج عن هذا التغيير وحده أثر تنظيمي أو تغيّر في مؤشر الجاهزية وفق المتطلبات والبيانات المعتمدة حاليًا. لا يعني هذا أنه لا يمكن أن ينطبق أي متطلب مستقبلًا.",
    );
  }

  return lines;
}
