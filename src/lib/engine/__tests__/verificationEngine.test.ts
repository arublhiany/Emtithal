// =============================================================================
// Phase 3 integrity tests — deterministic Verification Engine + Readiness Index
// V1 + Verification Coverage + Critical Blockers.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  ApplicabilityOutcome,
  RegulatoryRequirement,
  ValueVerification,
} from "@/lib/model";
import type { ApplicabilityResult } from "@/lib/engine/applicabilityEngine";
import {
  verifyAll,
  verifyRequirement,
  type RequirementVerificationInput,
  type SourcedNumberInput,
} from "@/lib/engine/verificationEngine";
import { getRegulatoryRequirements } from "@/lib/data/regulatory";
import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
import { DEMO_VERIFICATION_INPUTS } from "@/lib/data/demo/verificationInputs";

// -- factories ---------------------------------------------------------------

function req(overrides: Partial<RegulatoryRequirement> = {}): RegulatoryRequirement {
  return {
    id: "TEST-01",
    legacyIds: [],
    sourceAliasesAr: [],
    authorityId: "MOHU",
    domainAr: "d",
    trackAr: null,
    titleAr: "معيار اختبار",
    applicabilityRule: { kind: "DECLARED_SCOPE", scopeKey: "X", textEn: "x", matrixRef: "m" },
    targetSource: "s",
    verificationTarget: null,
    actualSource: [],
    verificationRule: "r",
    verificationAreasAr: [],
    acceptedEvidenceAr: [],
    responsiblePartyModel: null,
    officialWeight: null,
    internalCriticality: null,
    season: "1447H",
    matrixSourceRef: "m",
    officialSource: null,
    matrixNotes: [],
    unresolved: ["x"],
    resolution: "SPECIFIED",
    ...overrides,
  };
}

function applic(outcome: ApplicabilityOutcome): ApplicabilityResult {
  return {
    requirementId: "TEST-01",
    outcome,
    reason: "r",
    ruleEvaluated: "r",
    companyFieldsUsed: [],
    regulatoryResolution: "SPECIFIED",
    regulatoryUnresolvedNote: null,
    targetPopulationBasis: null,
  };
}

function qNum(value: number | null, verification: ValueVerification | null): SourcedNumberInput {
  return { value, verification, sourceAr: null };
}

function quantInput(target: SourcedNumberInput, actual: SourcedNumberInput): RequirementVerificationInput {
  return { requirementId: "TEST-01", mode: "QUANTITATIVE", target, actual, origin: "DEMO_DATA" };
}

function qualInput(states: RequirementVerificationInput["subRequirements"]): RequirementVerificationInput {
  return { requirementId: "TEST-01", mode: "QUALITATIVE", subRequirements: states, origin: "DEMO_DATA" };
}

const V: ValueVerification = "VERIFIED";
const P: ValueVerification = "PENDING_VERIFICATION";
const U: ValueVerification = "UNVERIFIED";

// -- §3-A regulatory resolution --------------------------------------------

test("UNRESOLVED_REQUIREMENT is not scored and is surfaced as regulatoryPending", () => {
  const r = verifyRequirement(
    req({ resolution: "UNRESOLVED_REQUIREMENT", unresolved: ["responsibility mapping unresolved"] }),
    applic("APPLICABLE"),
    quantInput(qNum(10, V), qNum(0, V)),
  );
  assert.equal(r.readiness, null);
  assert.equal(r.assessable, false);
  assert.equal(r.regulatoryPending, true);
  assert.equal(r.eligibleForAggregates, false);
  assert.notEqual(r.status, "NON_COMPLIANT", "the company must not be penalised for our regulatory gap");
  assert.equal(r.status, "INSUFFICIENT_DATA");
  assert.match(r.reason, /responsibility mapping unresolved/);
});

// -- §3-B applicability --------------------------------------------------

test("NOT_APPLICABLE → status NOT_APPLICABLE, excluded from aggregates", () => {
  const r = verifyRequirement(req(), applic("NOT_APPLICABLE"), quantInput(qNum(10, V), qNum(10, V)));
  assert.equal(r.status, "NOT_APPLICABLE");
  assert.equal(r.readiness, null);
  assert.equal(r.eligibleForAggregates, false);
});

test("INSUFFICIENT_DATA applicability → status INSUFFICIENT_DATA, no score", () => {
  const r = verifyRequirement(req(), applic("INSUFFICIENT_DATA"), quantInput(qNum(10, V), qNum(10, V)));
  assert.equal(r.status, "INSUFFICIENT_DATA");
  assert.equal(r.readiness, null);
  assert.equal(r.eligibleForAggregates, false);
});

// -- §4 evidence/data rules -------------------------------------------------

test("no verification data → INSUFFICIENT_DATA, not NON_COMPLIANT", () => {
  const r = verifyRequirement(req(), applic("APPLICABLE"), undefined);
  assert.equal(r.status, "INSUFFICIENT_DATA");
  assert.equal(r.readiness, null);
  assert.equal(r.eligibleForAggregates, true);
});

test("declared-but-unverified data → PENDING_VERIFICATION, never COMPLIANT", () => {
  const pending = verifyRequirement(req(), applic("APPLICABLE"), quantInput(qNum(10, V), qNum(10, P)));
  assert.equal(pending.status, "PENDING_VERIFICATION");
  assert.equal(pending.readiness, null);

  // "Manual declaration alone" (UNVERIFIED) is not verified either.
  const manual = verifyRequirement(req(), applic("APPLICABLE"), quantInput(qNum(10, U), qNum(10, U)));
  assert.equal(manual.status, "PENDING_VERIFICATION");
  assert.notEqual(manual.status, "COMPLIANT");
});

// -- §5 quantitative -----------------------------------------------------

test("quantitative: actual == target → COMPLIANT / 100", () => {
  const r = verifyRequirement(req(), applic("APPLICABLE"), quantInput(qNum(50, V), qNum(50, V)));
  assert.equal(r.status, "COMPLIANT");
  assert.equal(r.readiness, 100);
  assert.equal(r.gap, 0);
});

test("quantitative: actual > target → COMPLIANT, readiness capped at 100", () => {
  const r = verifyRequirement(req(), applic("APPLICABLE"), quantInput(qNum(50, V), qNum(80, V)));
  assert.equal(r.status, "COMPLIANT");
  assert.equal(r.readiness, 100);
  assert.equal(r.gap, 0);
});

test("quantitative: partial actual → PARTIALLY_COMPLIANT with correct gap/readiness", () => {
  const r = verifyRequirement(req(), applic("APPLICABLE"), quantInput(qNum(80, V), qNum(60, V)));
  assert.equal(r.status, "PARTIALLY_COMPLIANT");
  assert.equal(r.readiness, 75); // 60/80 * 100
  assert.equal(r.gap, 20);
});

test("quantitative: verified zero actual with positive target → NON_COMPLIANT / 0", () => {
  const r = verifyRequirement(req(), applic("APPLICABLE"), quantInput(qNum(30, V), qNum(0, V)));
  assert.equal(r.status, "NON_COMPLIANT");
  assert.equal(r.readiness, 0);
  assert.equal(r.gap, 30);
});

test("quantitative: missing / unverified target → no score", () => {
  const missing = verifyRequirement(req(), applic("APPLICABLE"), quantInput(qNum(null, null), qNum(10, V)));
  assert.equal(missing.status, "INSUFFICIENT_DATA");
  assert.equal(missing.readiness, null);

  const unverified = verifyRequirement(req(), applic("APPLICABLE"), quantInput(qNum(10, P), qNum(10, V)));
  assert.equal(unverified.status, "PENDING_VERIFICATION");
  assert.equal(unverified.readiness, null);
});

test("quantitative: verified target of zero is handled safely (no divide-by-zero)", () => {
  const r = verifyRequirement(req(), applic("APPLICABLE"), quantInput(qNum(0, V), qNum(0, V)));
  assert.equal(r.readiness, null);
  assert.equal(r.assessable, false);
  assert.equal(r.nonAssessableKind, "ZERO_TARGET");
  assert.ok(r.nonAssessableReason && r.nonAssessableReason.length > 0);
  assert.notEqual(r.status, "COMPLIANT");
});

// -- §6 qualitative ----------------------------------------------------

const A = "SATISFIED_VERIFIED" as const;
const X = "UNSATISFIED_VERIFIED" as const;
const PS = "PENDING_VERIFICATION" as const;
const ND = "NO_DATA" as const;
const subs = (...states: (typeof A | typeof X | typeof PS | typeof ND)[]) =>
  states.map((state, i) => ({ key: `k${i}`, labelAr: `بند ${i}`, state }));

test("qualitative: all verified satisfied → COMPLIANT / 100", () => {
  const r = verifyRequirement(req(), applic("APPLICABLE"), qualInput(subs(A, A, A)));
  assert.equal(r.status, "COMPLIANT");
  assert.equal(r.readiness, 100);
  assert.deepEqual(r.unsatisfiedSubRequirements, []);
});

test("qualitative: mixed verified satisfied/unsatisfied → PARTIALLY_COMPLIANT, exact unsatisfied listed", () => {
  const r = verifyRequirement(req(), applic("APPLICABLE"), qualInput(subs(A, A, X, X)));
  assert.equal(r.status, "PARTIALLY_COMPLIANT");
  assert.equal(r.readiness, 50);
  assert.equal(r.unsatisfiedSubRequirements.length, 2);
});

test("qualitative: all verified unsatisfied → NON_COMPLIANT / 0", () => {
  const r = verifyRequirement(req(), applic("APPLICABLE"), qualInput(subs(X, X, X)));
  assert.equal(r.status, "NON_COMPLIANT");
  assert.equal(r.readiness, 0);
});

test("qualitative: any missing sub-requirement → INSUFFICIENT_DATA", () => {
  const r = verifyRequirement(req(), applic("APPLICABLE"), qualInput(subs(A, A, ND)));
  assert.equal(r.status, "INSUFFICIENT_DATA");
  assert.equal(r.readiness, null);
  assert.equal(r.noDataSubRequirements.length, 1);
});

test("qualitative: any pending sub-requirement (none missing) → PENDING_VERIFICATION", () => {
  const r = verifyRequirement(req(), applic("APPLICABLE"), qualInput(subs(A, A, PS)));
  assert.equal(r.status, "PENDING_VERIFICATION");
  assert.equal(r.readiness, null);
  assert.equal(r.pendingSubRequirements.length, 1);
});

// -- §7 Readiness Index V1 -------------------------------------------------

test("Readiness Index is an UNWEIGHTED mean; official weights do not affect it", () => {
  const weighted = req({
    id: "W",
    officialWeight: { trackWeightPercent: 3, withinTrackWeightPercent: 20, matrixRef: "m" },
  });
  const unweighted = req({ id: "U", officialWeight: null });
  const inputs: RequirementVerificationInput[] = [
    { requirementId: "W", mode: "QUANTITATIVE", target: qNum(10, V), actual: qNum(10, V), origin: "DEMO_DATA" }, // 100
    { requirementId: "U", mode: "QUANTITATIVE", target: qNum(10, V), actual: qNum(0, V), origin: "DEMO_DATA" }, // 0
  ];
  // Both requirements are DECLARED_SCOPE → declare the profile is in scope.
  const profile = { ...DEMO_COMPANY_PROFILE };
  const run = verifyAll([weighted, unweighted], profile, inputs);
  assert.equal(run.readiness.value, 50); // (100 + 0) / 2 — NOT weighted 3/20
  assert.equal(run.officialScoreComputed, false);
});

test("Readiness is null (not 0) when nothing is assessable", () => {
  const r1 = req({ id: "A" });
  const r2 = req({ id: "B" });
  // Applicable + eligible, but no verification data → INSUFFICIENT_DATA, not assessable.
  const run = verifyAll([r1, r2], { ...DEMO_COMPANY_PROFILE }, []);
  assert.equal(run.readiness.value, null);
  assert.equal(run.readiness.assessableCount, 0);
  // Coverage: eligible = 2, assessable = 0 → 0.
  assert.equal(run.coverage.value, 0);
});

test("NOT_APPLICABLE and UNRESOLVED_REQUIREMENT are excluded from Readiness & Coverage", () => {
  const applicableAssessable = req({ id: "OK" });
  const notApplicable = req({
    id: "NA",
    applicabilityRule: { kind: "EXPRESSION", expression: "company_responsible_for_camp == true", matrixRef: "m" },
  });
  const unresolved = req({ id: "UR", resolution: "UNRESOLVED_REQUIREMENT" });
  const profile = {
    ...DEMO_COMPANY_PROFILE,
    declaredFacts: { ...DEMO_COMPANY_PROFILE.declaredFacts, companyResponsibleForCamp: false },
  };
  const run = verifyAll([applicableAssessable, notApplicable, unresolved], profile, [
    { requirementId: "OK", mode: "QUANTITATIVE", target: qNum(4, V), actual: qNum(2, V), origin: "DEMO_DATA" }, // 50
  ]);
  assert.equal(run.readiness.value, 50);
  assert.equal(run.readiness.eligibleCount, 1); // only "OK"
  assert.equal(run.coverage.value, 100);
  assert.equal(run.regulatoryPendingCount, 1);
  assert.deepEqual(run.regulatoryPendingIds, ["UR"]);
});

// -- §9 Critical Blockers ------------------------------------------------

test("Critical Blocker = SPECIFIED + CRITICAL + NON_COMPLIANT; appears even at high readiness", () => {
  const crit = req({ id: "CRIT", internalCriticality: "CRITICAL", resolution: "SPECIFIED" });
  const others = Array.from({ length: 9 }, (_, i) => req({ id: `OK-${i}` }));
  const inputs: RequirementVerificationInput[] = [
    { requirementId: "CRIT", mode: "QUANTITATIVE", target: qNum(4, V), actual: qNum(0, V), origin: "DEMO_DATA" }, // NON_COMPLIANT
    ...others.map((r) => ({
      requirementId: r.id,
      mode: "QUANTITATIVE" as const,
      target: qNum(4, V),
      actual: qNum(4, V),
      origin: "DEMO_DATA" as const,
    })), // all COMPLIANT / 100
  ];
  const run = verifyAll([crit, ...others], { ...DEMO_COMPANY_PROFILE }, inputs);
  assert.ok((run.readiness.value as number) >= 85, "overall readiness is high");
  assert.equal(run.criticalBlockers.length, 1);
  assert.equal(run.criticalBlockers[0].requirementId, "CRIT");
});

test("PENDING_VERIFICATION / INSUFFICIENT_DATA on a CRITICAL requirement are NOT critical blockers", () => {
  const crit = req({ id: "CRIT", internalCriticality: "CRITICAL" });
  const runPending = verifyAll([crit], { ...DEMO_COMPANY_PROFILE }, [
    { requirementId: "CRIT", mode: "QUANTITATIVE", target: qNum(4, V), actual: qNum(1, P), origin: "DEMO_DATA" },
  ]);
  assert.equal(runPending.criticalBlockers.length, 0);
  assert.deepEqual(runPending.pendingWarnings, ["CRIT"]);

  const runInsuff = verifyAll([crit], { ...DEMO_COMPANY_PROFILE }, []);
  assert.equal(runInsuff.criticalBlockers.length, 0);
  assert.deepEqual(runInsuff.insufficientDataWarnings, ["CRIT"]);
});

// -- Demo company snapshot -------------------------------------------------

test("demo company Phase 3 result matches the expected deterministic figures", () => {
  const run = verifyAll(getRegulatoryRequirements(), DEMO_COMPANY_PROFILE, DEMO_VERIFICATION_INPUTS);

  assert.equal(run.readiness.value, 64); // mean of [100,0,63,100,50,100,0,100]
  assert.equal(run.readiness.eligibleCount, 12); // APPLICABLE + SPECIFIED (HAJ-NUSUK-01 applicability is INSUFFICIENT_DATA → not eligible)
  assert.equal(run.readiness.assessableCount, 8);
  assert.equal(run.coverage.value, 67); // 8 / 12
  assert.equal(run.regulatoryPendingCount, 2);
  assert.deepEqual([...run.regulatoryPendingIds].sort(), ["HAJ-PROVIDERS-01", "MOH-01"]);
  assert.deepEqual(
    run.criticalBlockers.map((b) => b.requirementId),
    ["CIV-03"],
  );
  assert.deepEqual([...run.pendingWarnings].sort(), ["CIV-04", "HAJ-EXP-05"]);
  assert.deepEqual(
    [...run.insufficientDataWarnings].sort(),
    ["HAJ-CATERING-01", "HAJ-EXP-02"],
  );

  assert.deepEqual(run.statusCounts, {
    COMPLIANT: 4,
    PARTIALLY_COMPLIANT: 2,
    NON_COMPLIANT: 2,
    PENDING_VERIFICATION: 2,
    INSUFFICIENT_DATA: 5,
    NOT_APPLICABLE: 0,
  });

  // Official weights are display-only; no Official Score.
  assert.equal(run.officialScoreComputed, false);
  assert.equal(run.officialWeightsDisplayOnly.length, 5);
  for (const w of run.officialWeightsDisplayOnly) {
    assert.equal(w.trackWeightPercent, 3);
    assert.equal(w.withinTrackWeightPercent, 20);
  }
  assert.equal(run.zeroTargetRequirements.length, 0);
});

test("verifyAll is deterministic (same inputs → identical output)", () => {
  const a = verifyAll(getRegulatoryRequirements(), DEMO_COMPANY_PROFILE, DEMO_VERIFICATION_INPUTS);
  const b = verifyAll(getRegulatoryRequirements(), DEMO_COMPANY_PROFILE, DEMO_VERIFICATION_INPUTS);
  assert.deepEqual(a, b);
});

// -- §1 precision: aggregate uses RAW readiness, rounds only at the end -------

test("aggregate uses raw requirement readiness; intermediate rounding cannot change it", () => {
  // Four requirements with raw readiness 0.5%, 0.5%, 0.5%, 2.5%.
  // raw mean = 1.0 → round → 1.  Per-requirement round first: (1+1+1+3)/4 = 1.5 → round → 2.
  const reqs = ["A", "B", "C", "D"].map((id) => req({ id }));
  const inputs: RequirementVerificationInput[] = [
    { requirementId: "A", mode: "QUANTITATIVE", target: qNum(200, V), actual: qNum(1, V), origin: "DEMO_DATA" },
    { requirementId: "B", mode: "QUANTITATIVE", target: qNum(200, V), actual: qNum(1, V), origin: "DEMO_DATA" },
    { requirementId: "C", mode: "QUANTITATIVE", target: qNum(200, V), actual: qNum(1, V), origin: "DEMO_DATA" },
    { requirementId: "D", mode: "QUANTITATIVE", target: qNum(200, V), actual: qNum(5, V), origin: "DEMO_DATA" },
  ];
  const run = verifyAll(reqs, { ...DEMO_COMPANY_PROFILE }, inputs);
  assert.equal(run.readiness.rawValue, 1);
  assert.equal(run.readiness.value, 1); // NOT 2
  // Each raw value is unrounded on the result.
  const raws = run.results.map((r) => r.readinessRaw).sort();
  assert.deepEqual(raws, [0.5, 0.5, 0.5, 2.5]);
  // The naive "round each first" aggregate would have been 2 — prove we didn't.
  const naive = Math.round(
    run.results.reduce((s, r) => s + Math.round(r.readinessRaw as number), 0) / run.results.length,
  );
  assert.equal(naive, 2);
  assert.notEqual(run.readiness.value, naive);
});

// -- §2 no company-wide compliance status from Readiness --------------------

test("the engine never emits a company-wide regulatory compliance status", () => {
  const run = verifyAll(getRegulatoryRequirements(), DEMO_COMPANY_PROFILE, DEMO_VERIFICATION_INPUTS);
  // The run exposes canonical facts, not an overall COMPLIANT/NON_COMPLIANT judgment.
  assert.equal("companyStatus" in run, false);
  assert.equal("overallComplianceStatus" in run, false);
  assert.equal(typeof run.readiness.value === "number" || run.readiness.value === null, true);
  // statusCounts is a per-requirement tally, never collapsed into one label.
  const total = Object.values(run.statusCounts).reduce((a, b) => a + b, 0);
  assert.equal(total, run.results.length);
});

// -- §3 canonical KPI = criticalBlockers; legacy gaps/risks don't drive it --

test("critical KPI equals criticalBlockers, independent of legacy gap/risk data", () => {
  const run = verifyAll(getRegulatoryRequirements(), DEMO_COMPANY_PROFILE, DEMO_VERIFICATION_INPUTS);
  assert.equal(run.criticalBlockers.length, 1);
  assert.equal(run.criticalBlockers[0].requirementId, "CIV-03");
  // verificationGaps carry the deterministic facts, no invented severity field.
  for (const g of run.verificationGaps) {
    assert.ok(g.status === "PARTIALLY_COMPLIANT" || g.status === "NON_COMPLIANT");
    // No invented HIGH/MEDIUM risk severity on canonical gaps.
    assert.equal((g as unknown as Record<string, unknown>).severity, undefined);
    if (g.kind === "QUANTITATIVE") assert.equal(typeof g.numericGap, "number");
    if (g.kind === "QUALITATIVE") assert.ok(Array.isArray(g.unsatisfiedSubRequirements));
  }
  assert.deepEqual(
    [...run.verificationGaps].map((g) => g.requirementId).sort(),
    ["CIV-01", "CIV-03", "HAJ-EXP-03", "HAJ-EXP-04"],
  );
});

// -- §4 null readiness is not zero --------------------------------------

test("null requirement readiness is null (never 0) on the result", () => {
  for (const st of [
    verifyRequirement(req(), applic("APPLICABLE"), undefined), // INSUFFICIENT_DATA
    verifyRequirement(req(), applic("APPLICABLE"), quantInput(qNum(10, V), qNum(1, P))), // PENDING
    verifyRequirement(req({ resolution: "UNRESOLVED_REQUIREMENT" }), applic("APPLICABLE"), undefined),
  ]) {
    assert.equal(st.readiness, null);
    assert.equal(st.readinessRaw, null);
    assert.notEqual(st.readiness, 0);
  }
});

test("overall null Readiness is null (never 0), raw and display", () => {
  const run = verifyAll([req({ id: "X" }), req({ id: "Y" })], { ...DEMO_COMPANY_PROFILE }, []);
  assert.equal(run.readiness.value, null);
  assert.equal(run.readiness.rawValue, null);
  assert.notEqual(run.readiness.value as unknown, 0);
});

// -- §5 applicabilityPending distinct from regulatoryPending ---------------

test("applicabilityPendingCount / Ids reflect Phase 2 INSUFFICIENT_DATA applicability only", () => {
  const run = verifyAll(getRegulatoryRequirements(), DEMO_COMPANY_PROFILE, DEMO_VERIFICATION_INPUTS);
  assert.deepEqual(run.applicabilityPendingIds, ["HAJ-NUSUK-01"]);
  assert.equal(run.applicabilityPendingCount, 1);
});

test("regulatoryPending and applicabilityPending are disjoint sets", () => {
  const run = verifyAll(getRegulatoryRequirements(), DEMO_COMPANY_PROFILE, DEMO_VERIFICATION_INPUTS);
  const reg = new Set(run.regulatoryPendingIds);
  const app = new Set(run.applicabilityPendingIds);
  for (const id of app) assert.equal(reg.has(id), false, `${id} in both sets`);
  // MOH-01 (applicability INSUFFICIENT_DATA AND regulatory UNRESOLVED) is
  // counted only as regulatory-pending.
  assert.ok(reg.has("MOH-01"));
  assert.equal(app.has("MOH-01"), false);
  assert.ok(app.has("HAJ-NUSUK-01"));
  assert.equal(reg.has("HAJ-NUSUK-01"), false);
});
