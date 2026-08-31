// =============================================================================
// Verification Engine — deterministic, authoritative (Phase 3).
//
// This engine is the SOLE source of compliance status, requirement readiness,
// the Emtithal Readiness Index, Verification Coverage, and Critical Blockers.
// No LLM / AI may determine any of: compliance status, official weight, target,
// penalty, internal criticality. Official published weights are display-only
// metadata and are NEVER combined into a score. No "Official Score" is ever
// computed (`officialScoreComputed: false` is an enforced invariant).
//
// Per-requirement order (§3):
//   A. Regulatory resolution — UNRESOLVED_REQUIREMENT → not scored, surfaced as
//      `regulatoryPending`. The company is NOT penalised for our regulatory gap.
//   B. Applicability (Phase 2 engine) — NOT_APPLICABLE / INSUFFICIENT_DATA →
//      no score; APPLICABLE (+ SPECIFIED) → continue.
//   C. Verification — only VERIFIED target/actual (quantitative) or VERIFIED
//      sub-requirement results (qualitative) can yield a final COMPLIANT /
//      PARTIALLY_COMPLIANT / NON_COMPLIANT. Anything less → PENDING_VERIFICATION
//      or INSUFFICIENT_DATA.
// =============================================================================

import type {
  ApplicabilityOutcome,
  CanonicalCompanyProfile,
  ComplianceStatus,
  CriticalBlocker,
  RegulatoryRequirement,
  RequirementResolution,
  ValueVerification,
} from "@/lib/model";
import { COMPLIANCE_STATUSES } from "@/lib/model";
import type { DataSource as DataOrigin } from "@/lib/mode";
import {
  evaluateAllApplicability,
  type ApplicabilityResult,
} from "@/lib/engine/applicabilityEngine";

// -- Verification inputs (DEMO_DATA now; real inputs arrive Phase 6+) ----------

export type VerificationMode = "QUANTITATIVE" | "QUALITATIVE" | "NONE";

export type SubRequirementState =
  | "SATISFIED_VERIFIED"
  | "UNSATISFIED_VERIFIED"
  | "PENDING_VERIFICATION"
  | "NO_DATA";

export interface SubRequirementInput {
  key: string;
  /** Verbatim from the requirement's matrix "Verification Areas". */
  labelAr: string;
  state: SubRequirementState;
}

export interface SourcedNumberInput {
  value: number | null;
  /** `null` = no data at all. `"UNVERIFIED"` = declared but not verified. */
  verification: ValueVerification | null;
  sourceAr: string | null;
}

export interface RequirementVerificationInput {
  /** Canonical matrix ID. */
  requirementId: string;
  mode: VerificationMode;
  target?: SourcedNumberInput;
  actual?: SourcedNumberInput;
  subRequirements?: SubRequirementInput[];
  origin: DataOrigin;
  noteAr?: string;
}

// -- Engine output -----------------------------------------------------------

export interface SubRequirementRef {
  key: string;
  labelAr: string;
}

export type NonAssessableKind = "ZERO_TARGET" | "NEGATIVE_ACTUAL";

export interface RequirementVerificationResult {
  requirementId: string;
  titleAr: string;
  authorityId: string;
  status: ComplianceStatus;
  /**
   * RAW requirement readiness (exact, unrounded) — `min(actual/target,1)*100`
   * or `satisfied/total*100`. `null` when not assessable. The aggregate mean is
   * taken over these raw values; only the final index is rounded.
   */
  readinessRaw: number | null;
  /** Rounded display value of `readinessRaw` (0–100), or `null`. Never for aggregation. */
  readiness: number | null;
  /** `true` only when a final COMPLIANT/PARTIALLY_COMPLIANT/NON_COMPLIANT was reached from verified data. */
  assessable: boolean;
  mode: VerificationMode;

  applicability: ApplicabilityOutcome;
  applicabilityReason: string;

  regulatoryResolution: RequirementResolution;
  regulatoryPending: boolean;
  regulatoryPendingReason: string | null;

  // quantitative
  target: number | null;
  actual: number | null;
  gap: number | null;

  // qualitative
  requiredSubRequirementCount: number;
  verifiedSatisfiedCount: number;
  unsatisfiedSubRequirements: SubRequirementRef[];
  pendingSubRequirements: SubRequirementRef[];
  noDataSubRequirements: SubRequirementRef[];

  reason: string;
  dataOrigin: DataOrigin | null;
  nonAssessableReason: string | null;
  nonAssessableKind: NonAssessableKind | null;
  /** APPLICABLE && regulatory SPECIFIED — the eligibility set for both aggregates. */
  eligibleForAggregates: boolean;
}

export interface AggregateMetric {
  /** Exact (unrounded) aggregate. `null` when nothing is assessable/eligible. */
  rawValue: number | null;
  /** `Math.round(rawValue)` — the only value fit for display. `null` when `rawValue` is `null`. */
  value: number | null;
  assessableCount: number;
  eligibleCount: number;
}

/**
 * A deterministic canonical verification gap — an eligible requirement that
 * verified as PARTIALLY_COMPLIANT or NON_COMPLIANT. No invented HIGH/MEDIUM risk
 * severity: the fact is the status plus the numeric gap (quantitative) or the
 * exact unsatisfied sub-requirements (qualitative).
 */
export interface VerificationGap {
  requirementId: string;
  titleAr: string;
  authorityId: string;
  status: "PARTIALLY_COMPLIANT" | "NON_COMPLIANT";
  kind: VerificationMode;
  /** Quantitative gap = `max(target - actual, 0)`; `null` for qualitative. */
  numericGap: number | null;
  /** Qualitative unsatisfied required sub-requirements, verbatim. */
  unsatisfiedSubRequirements: SubRequirementRef[];
  isCriticalBlocker: boolean;
}

export interface VerificationRun {
  results: RequirementVerificationResult[];
  /** Emtithal Readiness Index V1 — unweighted mean of assessable eligible RAW readiness values. */
  readiness: AggregateMetric;
  /** assessable eligible / all eligible applicable requirements. */
  coverage: AggregateMetric;
  criticalBlockers: CriticalBlocker[];
  /** Eligible requirements verified PARTIALLY_COMPLIANT / NON_COMPLIANT. */
  verificationGaps: VerificationGap[];
  /** Eligible requirements currently PENDING_VERIFICATION (not blockers). */
  pendingWarnings: string[];
  /** Eligible requirements currently INSUFFICIENT_DATA, excluding regulatory-pending ones. */
  insufficientDataWarnings: string[];
  /** resolution === UNRESOLVED_REQUIREMENT (our regulatory gap, not the company's). */
  regulatoryPendingCount: number;
  regulatoryPendingIds: string[];
  /**
   * Phase 2 applicability outcome === INSUFFICIENT_DATA (and NOT regulatory-pending).
   * Distinct from `regulatoryPending`. Excluded from Verification Coverage's
   * denominator — surfaced here so the uncertainty stays visible.
   */
  applicabilityPendingCount: number;
  applicabilityPendingIds: string[];
  statusCounts: Record<ComplianceStatus, number>;
  /** Controlled non-assessable results caused by a verified zero/negative target. */
  zeroTargetRequirements: string[];
  /** Official published weights — DISPLAY-ONLY metadata, never fed into any score. */
  officialWeightsDisplayOnly: {
    requirementId: string;
    trackWeightPercent: number;
    withinTrackWeightPercent: number;
    matrixRef: string;
  }[];
  /** Enforced invariant — Emtithal never computes an Official Score. */
  officialScoreComputed: false;
}

// -------------------------------------------------------------------------------

function numState(x: SourcedNumberInput | undefined): "VERIFIED" | "PENDING" | "NO_DATA" {
  if (!x || x.value == null || x.verification == null) return "NO_DATA";
  if (x.verification === "VERIFIED") return "VERIFIED";
  // PENDING_VERIFICATION or UNVERIFIED — declared but not verified.
  return "PENDING";
}

function emptyResult(
  requirement: RegulatoryRequirement,
  applicability: ApplicabilityResult,
  input: RequirementVerificationInput | undefined,
): RequirementVerificationResult {
  return {
    requirementId: requirement.id,
    titleAr: requirement.titleAr,
    authorityId: requirement.authorityId,
    status: "INSUFFICIENT_DATA",
    readinessRaw: null,
    readiness: null,
    assessable: false,
    mode: input?.mode ?? "NONE",
    applicability: applicability.outcome,
    applicabilityReason: applicability.reason,
    regulatoryResolution: requirement.resolution,
    regulatoryPending: requirement.resolution === "UNRESOLVED_REQUIREMENT",
    regulatoryPendingReason:
      requirement.resolution === "UNRESOLVED_REQUIREMENT"
        ? (requirement.unresolved[0] ?? "UNRESOLVED_REQUIREMENT")
        : null,
    target: null,
    actual: null,
    gap: null,
    requiredSubRequirementCount: 0,
    verifiedSatisfiedCount: 0,
    unsatisfiedSubRequirements: [],
    pendingSubRequirements: [],
    noDataSubRequirements: [],
    reason: "",
    dataOrigin: input?.origin ?? null,
    nonAssessableReason: null,
    nonAssessableKind: null,
    eligibleForAggregates: false,
  };
}

/** Evaluates ONE requirement. Pure. */
export function verifyRequirement(
  requirement: RegulatoryRequirement,
  applicability: ApplicabilityResult,
  input: RequirementVerificationInput | undefined,
): RequirementVerificationResult {
  const base = emptyResult(requirement, applicability, input);

  // A. Regulatory resolution ------------------------------------------------
  if (base.regulatoryPending) {
    return {
      ...base,
      status: "INSUFFICIENT_DATA",
      reason: `Regulatory truth is not established (UNRESOLVED_REQUIREMENT): ${base.regulatoryPendingReason}. Not scored; not counted against the company.`,
    };
  }

  // B. Applicability ------------------------------------------------------
  if (applicability.outcome === "NOT_APPLICABLE") {
    return { ...base, status: "NOT_APPLICABLE", reason: applicability.reason };
  }
  if (applicability.outcome === "INSUFFICIENT_DATA") {
    return {
      ...base,
      status: "INSUFFICIENT_DATA",
      reason: `Applicability could not be established: ${applicability.reason}`,
    };
  }

  // APPLICABLE + regulatory SPECIFIED → eligible for both aggregates.
  const eligible = { ...base, eligibleForAggregates: true };

  // C. Verification -----------------------------------------------------
  if (!input || input.mode === "NONE") {
    return {
      ...eligible,
      status: "INSUFFICIENT_DATA",
      reason: "No verification data is available for this requirement yet.",
    };
  }

  if (input.mode === "QUANTITATIVE") {
    const tState = numState(input.target);
    const aState = numState(input.actual);

    if (tState === "NO_DATA" || aState === "NO_DATA") {
      const missing = [tState === "NO_DATA" ? "target" : null, aState === "NO_DATA" ? "actual" : null]
        .filter(Boolean)
        .join(" and ");
      return {
        ...eligible,
        status: "INSUFFICIENT_DATA",
        reason: `Missing required data: ${missing}. A target is never derived or invented.`,
      };
    }
    if (tState !== "VERIFIED" || aState !== "VERIFIED") {
      return {
        ...eligible,
        status: "PENDING_VERIFICATION",
        reason:
          "Target and/or actual are declared but not verified. Only VERIFIED values can produce a final compliance status.",
      };
    }

    const target = input.target!.value as number;
    const actual = input.actual!.value as number;

    if (target <= 0) {
      return {
        ...eligible,
        status: "INSUFFICIENT_DATA",
        assessable: false,
        target,
        actual,
        nonAssessableKind: "ZERO_TARGET",
        nonAssessableReason: `Verified target is ${target}. Quantitative readiness is undefined (no division by zero). Returned as a controlled non-assessable result.`,
        reason: `Controlled non-assessable: verified target is ${target}.`,
      };
    }
    if (actual < 0) {
      return {
        ...eligible,
        status: "INSUFFICIENT_DATA",
        assessable: false,
        target,
        actual,
        nonAssessableKind: "NEGATIVE_ACTUAL",
        nonAssessableReason: `Verified actual is negative (${actual}). Returned as a controlled non-assessable result.`,
        reason: `Controlled non-assessable: verified actual is ${actual}.`,
      };
    }

    const readinessRaw = Math.min(actual / target, 1) * 100;
    const readiness = Math.round(readinessRaw);
    const gap = Math.max(target - actual, 0);
    const status: ComplianceStatus =
      actual >= target ? "COMPLIANT" : actual === 0 ? "NON_COMPLIANT" : "PARTIALLY_COMPLIANT";

    return {
      ...eligible,
      status,
      readinessRaw,
      readiness,
      assessable: true,
      target,
      actual,
      gap,
      reason: `Verified quantitative: actual ${actual} / target ${target} → readiness ${readiness}, gap ${gap}.`,
    };
  }

  // QUALITATIVE
  const subs = input.subRequirements ?? [];
  if (subs.length === 0) {
    return {
      ...eligible,
      status: "INSUFFICIENT_DATA",
      reason: "No required sub-requirement results were provided.",
    };
  }
  const noData = subs.filter((s) => s.state === "NO_DATA").map((s) => ({ key: s.key, labelAr: s.labelAr }));
  const pending = subs
    .filter((s) => s.state === "PENDING_VERIFICATION")
    .map((s) => ({ key: s.key, labelAr: s.labelAr }));

  if (noData.length > 0) {
    return {
      ...eligible,
      status: "INSUFFICIENT_DATA",
      requiredSubRequirementCount: subs.length,
      noDataSubRequirements: noData,
      reason: `Missing data for ${noData.length} of ${subs.length} required sub-requirement(s).`,
    };
  }
  if (pending.length > 0) {
    return {
      ...eligible,
      status: "PENDING_VERIFICATION",
      requiredSubRequirementCount: subs.length,
      pendingSubRequirements: pending,
      reason: `${pending.length} of ${subs.length} required sub-requirement(s) await verification.`,
    };
  }

  const satisfied = subs.filter((s) => s.state === "SATISFIED_VERIFIED");
  const unsatisfied = subs.filter((s) => s.state === "UNSATISFIED_VERIFIED");
  const readinessRaw = (satisfied.length / subs.length) * 100;
  const readiness = Math.round(readinessRaw);
  const status: ComplianceStatus =
    unsatisfied.length === 0
      ? "COMPLIANT"
      : satisfied.length === 0
        ? "NON_COMPLIANT"
        : "PARTIALLY_COMPLIANT";

  return {
    ...eligible,
    status,
    readinessRaw,
    readiness,
    assessable: true,
    requiredSubRequirementCount: subs.length,
    verifiedSatisfiedCount: satisfied.length,
    unsatisfiedSubRequirements: unsatisfied.map((s) => ({ key: s.key, labelAr: s.labelAr })),
    reason: `${satisfied.length}/${subs.length} required sub-requirements verified satisfied.`,
  };
}

function tallyStatuses(results: RequirementVerificationResult[]): Record<ComplianceStatus, number> {
  const counts = Object.fromEntries(COMPLIANCE_STATUSES.map((s) => [s, 0])) as Record<
    ComplianceStatus,
    number
  >;
  for (const r of results) counts[r.status] += 1;
  return counts;
}

/** Runs the full engine for a company. Pure & deterministic. */
export function verifyAll(
  requirements: RegulatoryRequirement[],
  profile: CanonicalCompanyProfile,
  inputs: RequirementVerificationInput[],
): VerificationRun {
  const applicById = new Map(
    evaluateAllApplicability(requirements, profile).map((a) => [a.requirementId, a]),
  );
  const inputById = new Map(inputs.map((i) => [i.requirementId, i]));
  const reqById = new Map(requirements.map((r) => [r.id, r]));

  const results = requirements.map((r) =>
    verifyRequirement(r, applicById.get(r.id)!, inputById.get(r.id)),
  );

  const eligible = results.filter((r) => r.eligibleForAggregates);
  // RAW readiness values feed the aggregate — no intermediate rounding.
  const assessable = eligible.filter((r) => r.readinessRaw != null);

  const readinessRawValue =
    assessable.length === 0
      ? null
      : assessable.reduce((s, r) => s + (r.readinessRaw as number), 0) / assessable.length;

  const coverageRawValue =
    eligible.length === 0 ? null : (assessable.length / eligible.length) * 100;

  const criticalBlockerIds = new Set(
    results
      .filter((r) => {
        const req = reqById.get(r.requirementId)!;
        return (
          req.resolution === "SPECIFIED" &&
          req.internalCriticality === "CRITICAL" &&
          r.status === "NON_COMPLIANT"
        );
      })
      .map((r) => r.requirementId),
  );

  const criticalBlockers: CriticalBlocker[] = results
    .filter((r) => criticalBlockerIds.has(r.requirementId))
    .map((r) => ({
      requirementId: r.requirementId,
      titleAr: r.titleAr,
      authorityId: r.authorityId,
      reasonAr: "معيار حرج بحالة غير ملتزم",
    }));

  const verificationGaps: VerificationGap[] = eligible
    .filter((r) => r.status === "PARTIALLY_COMPLIANT" || r.status === "NON_COMPLIANT")
    .map((r) => ({
      requirementId: r.requirementId,
      titleAr: r.titleAr,
      authorityId: r.authorityId,
      status: r.status as "PARTIALLY_COMPLIANT" | "NON_COMPLIANT",
      kind: r.mode,
      numericGap: r.mode === "QUANTITATIVE" ? r.gap : null,
      unsatisfiedSubRequirements: r.unsatisfiedSubRequirements,
      isCriticalBlocker: criticalBlockerIds.has(r.requirementId),
    }));

  const applicabilityPending = results.filter(
    (r) => r.applicability === "INSUFFICIENT_DATA" && !r.regulatoryPending,
  );

  return {
    results,
    readiness: {
      rawValue: readinessRawValue,
      value: readinessRawValue == null ? null : Math.round(readinessRawValue),
      assessableCount: assessable.length,
      eligibleCount: eligible.length,
    },
    coverage: {
      rawValue: coverageRawValue,
      value: coverageRawValue == null ? null : Math.round(coverageRawValue),
      assessableCount: assessable.length,
      eligibleCount: eligible.length,
    },
    criticalBlockers,
    verificationGaps,
    pendingWarnings: eligible
      .filter((r) => r.status === "PENDING_VERIFICATION")
      .map((r) => r.requirementId),
    insufficientDataWarnings: eligible
      .filter((r) => r.status === "INSUFFICIENT_DATA" && !r.regulatoryPending)
      .map((r) => r.requirementId),
    regulatoryPendingCount: results.filter((r) => r.regulatoryPending).length,
    regulatoryPendingIds: results.filter((r) => r.regulatoryPending).map((r) => r.requirementId),
    applicabilityPendingCount: applicabilityPending.length,
    applicabilityPendingIds: applicabilityPending.map((r) => r.requirementId),
    statusCounts: tallyStatuses(results),
    zeroTargetRequirements: results
      .filter((r) => r.nonAssessableKind === "ZERO_TARGET")
      .map((r) => r.requirementId),
    officialWeightsDisplayOnly: requirements
      .filter((r) => r.officialWeight)
      .map((r) => ({
        requirementId: r.id,
        trackWeightPercent: r.officialWeight!.trackWeightPercent,
        withinTrackWeightPercent: r.officialWeight!.withinTrackWeightPercent,
        matrixRef: r.officialWeight!.matrixRef,
      })),
    officialScoreComputed: false,
  };
}
