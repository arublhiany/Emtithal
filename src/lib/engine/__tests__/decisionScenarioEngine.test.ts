// =============================================================================
// Phase 7 tests — deterministic Decision Scenario Engine (NO LLM).
// Applicability comes only from the Phase 2 engine; readiness / coverage /
// blockers only from the Phase 3 engine; profile is never mutated in place;
// Official Score is never computed.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
import { DEMO_VERIFICATION_INPUTS } from "@/lib/data/demo/verificationInputs";
import { getDemoVerificationRun } from "@/lib/engine/complianceView";
import {
  MUTABLE_DECISION_FIELDS,
  applyMutations,
  buildWhyChangedAr,
  diffAgainst,
  kpisFromRun,
  mutationViolatesConstraint,
  operationalMetrics,
  requirementLineage,
  runDeterministicState,
  validateConstraint,
  validateMutation,
  type ValidatedMutation,
} from "@/lib/engine/decisionScenarioEngine";

const run = (mutations: ValidatedMutation[], id = "S") =>
  runDeterministicState(id, DEMO_COMPANY_PROFILE, mutations, DEMO_VERIFICATION_INPUTS);

const mut = (fieldPath: string, value: unknown): ValidatedMutation => {
  const v = validateMutation(DEMO_COMPANY_PROFILE, fieldPath, value, "USER_STATED");
  if (!v.ok) throw new Error(`test mutation invalid: ${fieldPath} ${JSON.stringify(value)}`);
  return v.mutation;
};

// -- catalog / validation --------------------------------------------

test("the mutable catalog is exactly the eight approved canonical field paths", () => {
  assert.deepEqual([...MUTABLE_DECISION_FIELDS].sort(), [
    "declaredFacts.companyResponsibleForCamp",
    "declaredFacts.contractsExternalServiceProviders",
    "declaredFacts.experienceTrackScopeDeclared",
    "declaredFacts.providesOrEnsuresCatering",
    "directContactWorkers.count",
    "nusukApplicablePersons.count",
    "pilgrims.count",
    "workforce.count",
  ]);
});

test("validateMutation: a supported count field maps with current + scenario value", () => {
  const v = validateMutation(DEMO_COMPANY_PROFILE, "pilgrims.count", "5200", "USER_STATED");
  assert.equal(v.ok, true);
  assert.equal(v.ok && v.mutation.kind, "COUNT");
  assert.equal(v.ok && v.mutation.currentValue, 4200);
  assert.equal(v.ok && v.mutation.scenarioValue, 5200);
  assert.equal(v.ok && v.mutation.source, "USER_STATED");
});

test("validateMutation: an invented field → UNSUPPORTED_DECISION_VARIABLE", () => {
  const v = validateMutation(DEMO_COMPANY_PROFILE, "finance.annualRevenue", "1000000", "USER_STATED");
  assert.equal(v.ok, false);
  assert.equal(!v.ok && v.rejection.code, "UNSUPPORTED_DECISION_VARIABLE");
});

test("validateMutation: a bad value → INVALID_VALUE (non-numeric, negative)", () => {
  assert.equal(
    validateMutation(DEMO_COMPANY_PROFILE, "pilgrims.count", "abc", "USER_STATED").ok,
    false,
  );
  const neg = validateMutation(DEMO_COMPANY_PROFILE, "pilgrims.count", "-5", "USER_STATED");
  assert.equal(neg.ok, false);
  assert.equal(!neg.ok && neg.rejection.code, "INVALID_VALUE");
});

test("validateMutation: boolean fields accept true/false (string or bool)", () => {
  const v = validateMutation(
    DEMO_COMPANY_PROFILE,
    "declaredFacts.companyResponsibleForCamp",
    "false",
    "USER_STATED",
  );
  assert.equal(v.ok, true);
  assert.equal(v.ok && v.mutation.scenarioValue, false);
});

// -- isolation ------------------------------------------------------

test("applyMutations deep-clones — the input profile is never mutated", () => {
  const before = JSON.stringify(DEMO_COMPANY_PROFILE);
  const clone = applyMutations(DEMO_COMPANY_PROFILE, [mut("pilgrims.count", 9999)]);
  assert.equal(clone.pilgrims.count, 9999);
  assert.equal(DEMO_COMPANY_PROFILE.pilgrims.count, 4200);
  assert.equal(JSON.stringify(DEMO_COMPANY_PROFILE), before);
  assert.notEqual(clone, DEMO_COMPANY_PROFILE);
});

// -- CURRENT baseline parity --------------------------------------

test("a no-op scenario reproduces the canonical CURRENT verification run exactly", () => {
  const current = run([], "CURRENT");
  const canonical = kpisFromRun(getDemoVerificationRun());
  assert.deepEqual(current.kpis, canonical);
  assert.equal(current.kpis.officialScoreComputed, false);
});

// -- deterministic effects ---------------------------------------

test("companyResponsibleForCamp → false removes the CIV-03 critical blocker (deterministic)", () => {
  const current = run([], "CURRENT");
  const scenario = run([mut("declaredFacts.companyResponsibleForCamp", false)], "A");
  const diff = diffAgainst(current, scenario);

  assert.equal(current.kpis.criticalBlockerIds.includes("CIV-03"), true);
  assert.equal(scenario.kpis.criticalBlockerIds.includes("CIV-03"), false);
  assert.deepEqual(diff.blockersRemoved, ["CIV-03"]);
  // CIV-* and HAJ-CAMP-01 flip APPLICABLE → NOT_APPLICABLE
  const flipped = diff.applicabilityChanges.map((c) => c.requirementId).sort();
  assert.deepEqual(flipped, ["CIV-01", "CIV-02", "CIV-03", "CIV-04", "CIV-05", "HAJ-CAMP-01"]);
  for (const c of diff.applicabilityChanges) {
    assert.equal(c.from, "APPLICABLE");
    assert.equal(c.to, "NOT_APPLICABLE");
    assert.equal(c.lineage?.requirementId, c.requirementId);
  }
});

test("experienceTrackScopeDeclared → false changes readiness deterministically (raw delta)", () => {
  const current = run([], "CURRENT");
  const scenario = run([mut("declaredFacts.experienceTrackScopeDeclared", false)], "A");
  const diff = diffAgainst(current, scenario);

  const expected =
    scenario.kpis.readinessRaw == null || current.kpis.readinessRaw == null
      ? null
      : scenario.kpis.readinessRaw - current.kpis.readinessRaw;
  assert.equal(diff.readinessDelta, expected);
  assert.notEqual(diff.readinessDelta, null);
  // HAJ-EXP-* leave the assessable set → applicability changes carry lineage
  const changed = diff.applicabilityChanges.map((c) => c.requirementId);
  for (const id of ["HAJ-EXP-01", "HAJ-EXP-02", "HAJ-EXP-03", "HAJ-EXP-04", "HAJ-EXP-05"]) {
    assert.equal(changed.includes(id), true, id);
  }
});

test("pilgrim-volume change has NO verified regulatory / readiness effect BUT a real operational-metric effect", () => {
  const current = run([], "CURRENT");
  const scenario = run([mut("pilgrims.count", 5200)], "A");
  const diff = diffAgainst(current, scenario);

  assert.deepEqual(diff.fieldsChanged.map((m) => m.fieldPath), ["pilgrims.count"]);
  // no verified regulatory effect
  assert.deepEqual(diff.applicabilityChanges, []);
  assert.deepEqual(diff.verificationStatusChanges, []);
  assert.equal(diff.readinessDelta, 0);
  assert.equal(diff.coverageDelta, 0);
  assert.deepEqual(diff.blockersAdded, []);
  // but a deterministic operational-metric effect
  const mc = diff.operationalMetricChanges.find((m) => m.key === "pilgrimsPerWorkforceMember")!;
  assert.equal(mc.direction, "INCREASED");
  assert.equal(mc.fromDisplay, 23.33); // 4200/180
  assert.equal(mc.toDisplay, 28.89); // 5200/180
});

// -- internal operational indicator (§2) -----------------------

test("operationalMetrics: exact arithmetic; provenance; classification; no compliance input", () => {
  const m = operationalMetrics(DEMO_COMPANY_PROFILE).pilgrimsPerWorkforceMember;
  assert.equal(m.raw, 4200 / 180);
  assert.equal(m.display, 23.33);
  assert.deepEqual(m.provenanceFieldPaths, ["pilgrims.count", "workforce.count"]);
  assert.equal(m.classification, "INTERNAL_OPERATIONAL_INDICATOR");
  // the metric is NOT part of any KPI object
  const k = kpisFromRun(getDemoVerificationRun());
  assert.equal("pilgrimsPerWorkforceMember" in k, false);
  assert.equal("operationalMetrics" in k, false);
});

test("operationalMetrics never mutates the profile and is null when a value is missing", () => {
  const before = JSON.stringify(DEMO_COMPANY_PROFILE);
  operationalMetrics(DEMO_COMPANY_PROFILE);
  assert.equal(JSON.stringify(DEMO_COMPANY_PROFILE), before);
  const s = run([mut("workforce.count", 0)]);
  assert.equal(s.operationalMetrics.pilgrimsPerWorkforceMember.raw, null); // divide-by-zero guarded
});

test("changing only pilgrims: readiness/coverage KPIs identical, operational metric moved", () => {
  const current = run([], "CURRENT");
  const scenario = run([mut("pilgrims.count", 5200)]);
  assert.equal(scenario.kpis.readiness, current.kpis.readiness);
  assert.equal(scenario.kpis.coverage, current.kpis.coverage);
  assert.notEqual(
    scenario.operationalMetrics.pilgrimsPerWorkforceMember.raw,
    current.operationalMetrics.pilgrimsPerWorkforceMember.raw,
  );
});

// -- deterministic "why changed" (§3) ------------------------

test("buildWhyChangedAr is built from the diff and states the safe 'operational-only' line", () => {
  const current = run([], "CURRENT");
  const scenario = run([mut("pilgrims.count", 5200)], "A");
  const why = buildWhyChangedAr(diffAgainst(current, scenario));
  assert.ok(why.some((l) => l.includes("pilgrims.count") && l.includes("5200")));
  assert.ok(why.some((l) => l.includes("المؤشر التشغيلي الداخلي") && l.includes("ارتفع")));
  assert.ok(why.some((l) => l.includes("لم يتغيّر انطباق أي متطلب")));
  assert.ok(why.some((l) => l.includes("لم يتغيّر مؤشر الجاهزية")));
  assert.ok(
    why.some((l) =>
      l.includes("لم ينتج عن هذا التغيير وحده أثر تنظيمي أو تغيّر في مؤشر الجاهزية"),
    ),
  );
});

test("buildWhyChangedAr lists real applicability + blocker changes for a scope flip", () => {
  const current = run([], "CURRENT");
  const scenario = run([mut("declaredFacts.companyResponsibleForCamp", false)], "A");
  const why = buildWhyChangedAr(diffAgainst(current, scenario));
  assert.ok(why.some((l) => l.includes("تغيّر انطباق المتطلبات") && l.includes("CIV-01")));
  assert.ok(why.some((l) => l.includes("عوائق حرجة مُزالة") && l.includes("CIV-03")));
});

// -- user-stated constraints (§1) --------------------------

test("validateConstraint: a supported field + type-valid value → constraint (USER_STATED)", () => {
  const v = validateConstraint(DEMO_COMPANY_PROFILE, "workforce.count", "180", "إبقاء العدد");
  assert.equal(v.ok, true);
  assert.equal(v.ok && v.constraint.expectedValue, 180);
  assert.equal(v.ok && v.constraint.source, "USER_STATED");
});

test("validateConstraint: an invented field → UNSUPPORTED_DECISION_VARIABLE", () => {
  const v = validateConstraint(DEMO_COMPANY_PROFILE, "hr.headcount", "180", "x");
  assert.equal(v.ok, false);
  assert.equal(!v.ok && v.rejection.code, "UNSUPPORTED_DECISION_VARIABLE");
});

test("mutationViolatesConstraint: a value ≠ expected violates; a value = expected is a no-op", () => {
  const c = validateConstraint(DEMO_COMPANY_PROFILE, "workforce.count", "180", "x");
  assert.equal(c.ok, true);
  if (!c.ok) return;
  const bump = mut("workforce.count", 200);
  const noop = mut("workforce.count", 180);
  assert.equal(mutationViolatesConstraint(bump, [c.constraint])?.fieldPath, "workforce.count");
  assert.equal(mutationViolatesConstraint(noop, [c.constraint]), null);
});

// -- Official Score never computed ------------------------------

test("no scenario ever computes an Official Score", () => {
  for (const mutations of [
    [],
    [mut("pilgrims.count", 5200)],
    [mut("declaredFacts.companyResponsibleForCamp", false)],
    [mut("declaredFacts.experienceTrackScopeDeclared", false)],
  ]) {
    const s = run(mutations);
    assert.equal(s.kpis.officialScoreComputed, false);
    assert.equal("officialScore" in s.kpis, false);
  }
});

// -- UNRESOLVED regulatory truth stays unresolved --------------

test("UNRESOLVED requirements stay UNRESOLVED_REQUIREMENT in every scenario", () => {
  for (const mutations of [
    [],
    [mut("directContactWorkers.count", 45)],
    [mut("declaredFacts.contractsExternalServiceProviders", false)],
  ]) {
    const s = run(mutations);
    for (const id of ["MOH-01", "HAJ-PROVIDERS-01"]) {
      const r = s.requirements.find((x) => x.requirementId === id)!;
      assert.equal(r.regulatoryResolution, "UNRESOLVED_REQUIREMENT", id);
    }
  }
});

// -- lineage (§12) --------------------------------------------

test("requirementLineage returns canonical facts, no invented url / page", () => {
  const lin = requirementLineage("HAJ-EXP-05")!;
  assert.equal(lin.titleAr, "توثيق فعاليات ومبادرات فريق السعادة");
  assert.equal(lin.authorityId, "MOHU");
  assert.equal(lin.regulatoryResolution, "SPECIFIED");
  assert.equal(lin.locatorStatus, "VERIFIED_COMPLETE");
  assert.equal(lin.season, "1447H");
  assert.equal(typeof lin.matrixSourceRef, "string");
  assert.equal(requirementLineage("NOPE-99"), null);
});
