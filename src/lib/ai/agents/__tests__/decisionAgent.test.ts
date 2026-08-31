// =============================================================================
// Phase 7 tests — Decision Intelligence Agent (interpretation + recommendation).
//
// The real StructuredAIClient pipeline runs with a fake transport. The AI only
// interprets / explains / recommends; every number comes from the deterministic
// Phase 2/3 engines on a CLONED profile. No Official Score, no AI-set status.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { StructuredAIClient, UnavailableAIClient } from "@/lib/ai/client/aiClient";
import type { AITransport } from "@/lib/ai/client/types";
import { interpretDecision, simulateDecisionScenarios } from "@/lib/ai/agents";
import {
  DEMO_COMPANY_PROFILE,
  DEMO_COMPANY_PROFILE_DRAFT,
} from "@/lib/data/demo/companyProfile";
import { buildCompanyProfile } from "@/lib/onboarding/companyProfile";
import { getDemoVerificationRun } from "@/lib/engine/complianceView";
import { kpisFromRun } from "@/lib/engine/decisionScenarioEngine";

function fakeTransport(queue: (string | Error)[]): AITransport {
  const q = [...queue];
  return {
    provider: "fake",
    model: "fake-model",
    async complete() {
      const next = q.shift();
      if (next === undefined) throw new Error("fake transport queue exhausted");
      if (next instanceof Error) throw next;
      return { text: next };
    },
  };
}
const withClient = (...bodies: (string | Error)[]) => ({
  client: new StructuredAIClient(fakeTransport(bodies)),
});

const interpBody = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    decisionTitleAr: "زيادة عدد الحجاج",
    decisionSummaryAr: "رفع العدد من 4200 إلى 5200 مع بقاء القوى العاملة 180.",
    requestedChanges: [
      { fieldPath: "pilgrims.count", toValue: "5200", intentAr: "زيادة عدد الحجاج المخدومين" },
    ],
    constraints: [],
    assumptionsAr: [],
    ambiguitiesAr: [],
    missingInfoAr: [],
    interpretationConfidence: "MEDIUM",
    needsHumanReview: false,
    ...over,
  });

const recBody = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    recommendedScenarioId: "A",
    recommendationAr: "لا يوجد أثر تنظيمي حتمي من زيادة العدد وحدها ضمن البيانات المعتمدة.",
    tradeoffsAr: ["السيناريو أ يحقق الهدف التشغيلي دون تغيّر في المؤشرات الحتمية."],
    assumptionsAr: [],
    scenarioExplanations: [{ scenarioId: "A", whyChangedAr: "لم تتغير نتائج الانطباق أو التحقق." }],
    needsHumanReview: false,
    ...over,
  });

const D = { textAr: "نفكر في زيادة عدد الحجاج المخدومين من 4200 إلى 5200 مع بقاء عدد القوى العاملة 180." };

// -- interpretation ----------------------------------------------

test("interpretDecision: a supported field maps to a validated USER_STATED mutation", async () => {
  const r = await interpretDecision(D, withClient(interpBody()));
  assert.equal(r.ok, true);
  assert.equal(r.requestedChanges.length, 1);
  assert.equal(r.requestedChanges[0].fieldPath, "pilgrims.count");
  assert.equal(r.requestedChanges[0].currentValue, 4200);
  assert.equal(r.requestedChanges[0].scenarioValue, 5200);
  assert.equal(r.requestedChanges[0].source, "USER_STATED");
  assert.deepEqual(r.rejectedChanges, []);
});

test("interpretDecision: an invented field is rejected (not renamed) and forces review", async () => {
  const r = await interpretDecision(
    D,
    withClient(
      interpBody({
        requestedChanges: [
          { fieldPath: "pilgrims.count", toValue: "5200", intentAr: "x" },
          { fieldPath: "finance.annualRevenue", toValue: "9000000", intentAr: "y" },
        ],
      }),
    ),
  );
  assert.equal(r.requestedChanges.length, 1);
  assert.equal(r.rejectedChanges.length, 1);
  assert.equal(r.rejectedChanges[0].code, "UNSUPPORTED_DECISION_VARIABLE");
  assert.equal(r.needsHumanReview, true);
});

test("interpretDecision: only-unsupported fields → controlled UNSUPPORTED_DECISION", async () => {
  const r = await interpretDecision(
    D,
    withClient(
      interpBody({ requestedChanges: [{ fieldPath: "marketing.spend", toValue: "1", intentAr: "z" }] }),
    ),
  );
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "UNSUPPORTED_DECISION");
  assert.equal(r.needsHumanReview, true);
});

test("interpretDecision: no changes at all → INSUFFICIENT_DECISION_DATA", async () => {
  const r = await interpretDecision(D, withClient(interpBody({ requestedChanges: [] })));
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "INSUFFICIENT_DECISION_DATA");
});

test("interpretDecision: a bad value → INVALID_VALUE rejection + review", async () => {
  const r = await interpretDecision(
    D,
    withClient(
      interpBody({
        requestedChanges: [{ fieldPath: "pilgrims.count", toValue: "خمسة آلاف", intentAr: "x" }],
      }),
    ),
  );
  assert.equal(r.rejectedChanges[0].code, "INVALID_VALUE");
  assert.equal(r.ok, false);
});

test("interpretDecision: model-flagged ambiguity forces human review", async () => {
  const r = await interpretDecision(
    D,
    withClient(interpBody({ ambiguitiesAr: ["غير واضح إن كان التغيير موسميًا أم دائمًا"] })),
  );
  assert.equal(r.ok, true);
  assert.equal(r.needsHumanReview, true);
});

test("interpretDecision: guardrail rejects an attempted compliance status", async () => {
  const r = await interpretDecision(
    D,
    withClient(interpBody({ complianceStatus: "COMPLIANT" }), interpBody({ complianceStatus: "COMPLIANT" })),
  );
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "GUARDRAIL_REJECTED");
  assert.deepEqual(r.requestedChanges, []);
});

// -- full simulation: isolation + determinism -------------------

test("simulateDecisionScenarios: CURRENT matches the canonical run; the real profile is not mutated", async () => {
  const before = JSON.stringify(DEMO_COMPANY_PROFILE);
  const out = await simulateDecisionScenarios(D, withClient(interpBody(), recBody()));
  assert.equal(out.ok, true);
  assert.deepEqual(out.current.kpis, kpisFromRun(getDemoVerificationRun()));
  assert.equal(out.officialScoreComputed, false);
  assert.equal("officialScore" in out.current.kpis, false);
  assert.equal(JSON.stringify(DEMO_COMPANY_PROFILE), before);
  // a fresh build of the demo profile is still identical
  assert.deepEqual(DEMO_COMPANY_PROFILE, buildCompanyProfile(DEMO_COMPANY_PROFILE_DRAFT));
});

test("simulateDecisionScenarios: pilgrim-only change → deterministic diff shows no regulatory effect", async () => {
  const out = await simulateDecisionScenarios(D, withClient(interpBody(), recBody()));
  const a = out.scenarios.find((s) => s.scenarioId === "A")!;
  assert.equal(a.provenance, "USER_PROPOSED");
  assert.deepEqual(a.diff.fieldsChanged.map((m) => m.fieldPath), ["pilgrims.count"]);
  assert.deepEqual(a.diff.applicabilityChanges, []);
  assert.deepEqual(a.diff.verificationStatusChanges, []);
  assert.equal(a.diff.readinessDelta, 0);
  assert.deepEqual(a.diff.blockersAdded, []);
});

test("the AI cannot overwrite deterministic readiness / coverage / status", async () => {
  // a recommendation body that *claims* different numbers must not change engine output
  const out = await simulateDecisionScenarios(
    D,
    withClient(
      interpBody(),
      recBody({ recommendationAr: "الجاهزية سترتفع إلى 100 والامتثال مكتمل" }),
    ),
  );
  const canonical = kpisFromRun(getDemoVerificationRun());
  for (const s of out.scenarios) {
    // pilgrim-only change → identical KPIs to CURRENT
    assert.equal(s.state.kpis.readiness, canonical.readiness);
    assert.equal(s.state.kpis.coverage, canonical.coverage);
    assert.deepEqual(s.state.kpis.statusCounts, canonical.statusCounts);
    assert.equal(s.state.kpis.officialScoreComputed, false);
  }
});

test("a scope-declaration flip produces a real deterministic applicability + readiness diff", async () => {
  const out = await simulateDecisionScenarios(
    { textAr: "ماذا لو أعلنّا أننا خارج نطاق مسار التجربة؟" },
    withClient(
      interpBody({
        requestedChanges: [
          {
            fieldPath: "declaredFacts.experienceTrackScopeDeclared",
            toValue: "false",
            intentAr: "الخروج من نطاق مسار التجربة",
          },
        ],
      }),
      recBody({ recommendedScenarioId: "A" }),
    ),
  );
  const a = out.scenarios.find((s) => s.scenarioId === "A")!;
  const flipped = a.diff.applicabilityChanges.map((c) => c.requirementId);
  for (const id of ["HAJ-EXP-01", "HAJ-EXP-02", "HAJ-EXP-03", "HAJ-EXP-04", "HAJ-EXP-05"]) {
    assert.equal(flipped.includes(id), true, id);
  }
  assert.notEqual(a.diff.readinessDelta, 0);
  // lineage carried for every surfaced requirement, no invented url/page
  for (const lin of a.diff.sourceLineage) {
    assert.equal(typeof lin.requirementId, "string");
    assert.equal(typeof lin.matrixSourceRef, "string");
  }
});

// -- (1) change vs constraint --------------------------------

// The model may return "keep workforce 180" either as an explicit constraint or
// as a no-op change; both must land in `constraints`, not `requestedChanges`.
const keepWorkforceExplicit = () =>
  interpBody({
    requestedChanges: [
      { fieldPath: "pilgrims.count", toValue: "5200", intentAr: "زيادة الحجاج" },
    ],
    constraints: [
      { fieldPath: "workforce.count", expectedValue: "180", intentAr: "إبقاء القوى العاملة" },
    ],
  });
const keepWorkforceAsNoop = () =>
  interpBody({
    requestedChanges: [
      { fieldPath: "pilgrims.count", toValue: "5200", intentAr: "زيادة الحجاج" },
      { fieldPath: "workforce.count", toValue: "180", intentAr: "إبقاء القوى العاملة" },
    ],
  });

for (const [name, body] of [
  ["explicit constraint", keepWorkforceExplicit],
  ["no-op change folded to constraint", keepWorkforceAsNoop],
] as const) {
  test(`interpretDecision (${name}): pilgrims is a change, workforce is a USER_STATED constraint`, async () => {
    const r = await interpretDecision(D, withClient(body()));
    assert.equal(r.ok, true);
    assert.deepEqual(r.requestedChanges.map((m) => m.fieldPath), ["pilgrims.count"]);
    assert.equal(r.constraints.length, 1);
    assert.equal(r.constraints[0].fieldPath, "workforce.count");
    assert.equal(r.constraints[0].expectedValue, 180);
    assert.equal(r.constraints[0].source, "USER_STATED");
    // a no-op is never reported as a changed field
    assert.equal(r.requestedChanges.some((m) => m.fieldPath === "workforce.count"), false);
  });
}

test("scenarios respect a USER_STATED constraint; a scenario that would break it is not emitted", async () => {
  const out = await simulateDecisionScenarios(
    D,
    withClient(keepWorkforceExplicit(), recBody({ recommendedScenarioId: "A" })),
  );
  // constraints are visible on the final result
  assert.equal(out.interpretation.constraints[0].fieldPath, "workforce.count");
  for (const s of out.scenarios) {
    // no scenario mutates the constrained field to anything other than 180
    for (const m of s.state.mutations) {
      if (m.fieldPath === "workforce.count") assert.equal(m.scenarioValue, 180);
    }
    // the capacity-adjusted C (which would bump workforce) is not emitted
    assert.notEqual(s.provenance, "CAPACITY_ADJUSTED_ASSUMPTION");
  }
  // the profile is untouched
  assert.equal(DEMO_COMPANY_PROFILE.workforce.count, 180);
  assert.equal(DEMO_COMPANY_PROFILE.pilgrims.count, 4200);
});

// -- (2) operational metric in the simulation output ---------

test("every scenario + CURRENT carries the internal operational indicator; diff shows its deterministic move", async () => {
  const out = await simulateDecisionScenarios(D, withClient(interpBody(), recBody()));
  assert.equal(out.current.operationalMetrics.pilgrimsPerWorkforceMember.display, 23.33);
  const a = out.scenarios.find((s) => s.scenarioId === "A")!;
  assert.equal(a.state.operationalMetrics.pilgrimsPerWorkforceMember.display, 28.89); // 5200/180
  const mc = a.diff.operationalMetricChanges[0];
  assert.equal(mc.direction, "INCREASED");
  // pure volume change → regulatory diff empty, operational diff non-empty
  assert.deepEqual(a.diff.applicabilityChanges, []);
  assert.deepEqual(a.diff.verificationStatusChanges, []);
  assert.equal(a.diff.readinessDelta, 0);
});

// -- (3) deterministic "why changed" -------------------------

test("scenario.whyChangedAr is the deterministic explanation built from the diff", async () => {
  const out = await simulateDecisionScenarios(D, withClient(interpBody(), recBody()));
  const a = out.scenarios.find((s) => s.scenarioId === "A")!;
  assert.ok(Array.isArray(a.whyChangedAr) && a.whyChangedAr.length > 0);
  assert.ok(a.whyChangedAr.some((l) => l.includes("المؤشر التشغيلي الداخلي") && l.includes("ارتفع")));
  assert.ok(a.whyChangedAr.some((l) => l.includes("لم يتغيّر انطباق أي متطلب")));
  assert.ok(
    a.whyChangedAr.some((l) => l.includes("لم ينتج عن هذا التغيير وحده أثر تنظيمي")),
  );
});

// -- (4) AI prose grounding / rejection ---------------------

test("AI recommendation claiming a readiness number → whole recommendation discarded, KPIs survive", async () => {
  const canonicalBefore = { ...(await simulateDecisionScenarios(D, withClient(interpBody(), recBody()))).current.kpis };
  const out = await simulateDecisionScenarios(
    D,
    withClient(interpBody(), recBody({ recommendationAr: "بعد التنفيذ ستبلغ الجاهزية 100" })),
  );
  assert.equal(out.recommendation.available, false);
  assert.equal(out.recommendation.failureCode, "GUARDRAIL_REJECTED");
  assert.equal(out.recommendation.recommendationAr, null);
  assert.ok(out.scenarios.length >= 1); // deterministic scenarios retained
  assert.deepEqual(out.current.kpis, canonicalBefore);
});

test("AI recommendation asserting the company is compliant → discarded", async () => {
  const out = await simulateDecisionScenarios(
    D,
    withClient(interpBody(), recBody({ recommendationAr: "السيناريو أ يجعل الشركة ملتزمة بالكامل" })),
  );
  assert.equal(out.recommendation.available, false);
});

test("AI recommendation asserting the company is non-compliant → discarded", async () => {
  const out = await simulateDecisionScenarios(
    D,
    withClient(interpBody(), recBody({ tradeoffsAr: ["السيناريو أ يجعل الشركة غير ملتزمة"] })),
  );
  assert.equal(out.recommendation.available, false);
});

test("a safe qualitative tradeoff (no verdict, no number) is preserved", async () => {
  const out = await simulateDecisionScenarios(
    D,
    withClient(
      interpBody(),
      recBody({
        recommendedScenarioId: "A",
        recommendationAr: "السيناريو أ يحقق الهدف التشغيلي مع ارتفاع نسبي في العبء الداخلي دون أثر تنظيمي مؤكد.",
        tradeoffsAr: ["أ: تنفيذ فوري لكن يرفع المؤشر التشغيلي الداخلي.", "ب: يقلل الارتفاع لكنه يؤخر الهدف."],
      }),
    ),
  );
  assert.equal(out.recommendation.available, true);
  assert.match(out.recommendation.recommendationAr ?? "", /العبء الداخلي/);
});

// -- (5) needsHumanReview follows the RECOMMENDED scenario ---

test("recommend A (user-stated only) while B has assumptions → B alone does NOT force review", async () => {
  const out = await simulateDecisionScenarios(
    D,
    withClient(interpBody(), recBody({ recommendedScenarioId: "A", needsHumanReview: false })),
  );
  const b = out.scenarios.find((s) => s.scenarioId === "B");
  assert.ok(b, "expected a phased assumption scenario B to exist");
  assert.equal(out.recommendation.recommendedScenarioId, "A");
  assert.equal(out.recommendation.needsHumanReview, false);
});

test("recommend B (assumption-based) → review is forced", async () => {
  const out = await simulateDecisionScenarios(
    D,
    withClient(interpBody(), recBody({ recommendedScenarioId: "B", needsHumanReview: false })),
  );
  assert.equal(out.recommendation.recommendedScenarioId, "B");
  assert.equal(out.recommendation.needsHumanReview, true);
});

test("null recommendation → review is forced", async () => {
  const out = await simulateDecisionScenarios(
    D,
    withClient(interpBody(), recBody({ recommendedScenarioId: null, needsHumanReview: false })),
  );
  assert.equal(out.recommendation.recommendedScenarioId, null);
  assert.equal(out.recommendation.needsHumanReview, true);
});

// -- scenario provenance ---------------------------------------

test("phased scenario B carries SCENARIO_ASSUMPTION mutations, never USER_STATED", async () => {
  const out = await simulateDecisionScenarios(D, withClient(interpBody(), recBody()));
  const b = out.scenarios.find((s) => s.scenarioId === "B");
  if (b) {
    assert.equal(b.provenance, "PHASED_ASSUMPTION");
    for (const m of b.state.mutations) assert.equal(m.source, "SCENARIO_ASSUMPTION");
    // B halves the delta: 4200 → 4700
    const p = b.state.mutations.find((m) => m.fieldPath === "pilgrims.count");
    assert.equal(p?.scenarioValue, 4700);
  }
});

test("capacity-adjusted scenario C pairs an AI workforce assumption tagged SCENARIO_ASSUMPTION", async () => {
  const out = await simulateDecisionScenarios(D, withClient(interpBody(), recBody()));
  const c = out.scenarios.find((s) => s.scenarioId === "C");
  if (c) {
    const wf = c.state.mutations.find((m) => m.fieldPath === "workforce.count");
    assert.ok(wf);
    assert.equal(wf.source, "SCENARIO_ASSUMPTION");
    const pil = c.state.mutations.find((m) => m.fieldPath === "pilgrims.count");
    assert.equal(pil?.source, "USER_STATED"); // A's user change is preserved as-is
  }
});

// -- recommendation ------------------------------------------

test("recommendation: a fabricated scenario id is coerced to null + review", async () => {
  const out = await simulateDecisionScenarios(
    D,
    withClient(interpBody(), recBody({ recommendedScenarioId: "SCENARIO_Z" })),
  );
  assert.equal(out.recommendation.available, true);
  assert.equal(out.recommendation.recommendedScenarioId, null);
  assert.equal(out.recommendation.needsHumanReview, true);
});

test("recommendation: explanations referencing unknown scenario ids are dropped", async () => {
  const out = await simulateDecisionScenarios(
    D,
    withClient(
      interpBody(),
      recBody({
        scenarioExplanations: [
          { scenarioId: "A", whyChangedAr: "لا تغيّر" },
          { scenarioId: "GHOST", whyChangedAr: "مخترع" },
        ],
      }),
    ),
  );
  const ids = out.recommendation.scenarioExplanations.map((e) => e.scenarioId);
  assert.equal(ids.includes("GHOST"), false);
  assert.equal(ids.includes("A"), true);
});

// -- failure model -----------------------------------------

test("AI unavailable at interpretation → controlled failure; CURRENT still computed", async () => {
  const out = await simulateDecisionScenarios(D, { client: new UnavailableAIClient("no creds") });
  assert.equal(out.ok, false);
  assert.equal(out.failureCode, "AI_UNAVAILABLE");
  assert.deepEqual(out.scenarios, []);
  assert.deepEqual(out.current.kpis, kpisFromRun(getDemoVerificationRun())); // deterministic survives
  assert.equal(out.recommendation.available, false);
});

test("provider error at interpretation → controlled PROVIDER_ERROR", async () => {
  const out = await simulateDecisionScenarios(D, withClient(new Error("boom")));
  assert.equal(out.failureCode, "PROVIDER_ERROR");
  assert.deepEqual(out.scenarios, []);
});

test("malformed interpretation → at most one retry → SCHEMA_VALIDATION_FAILED", async () => {
  const out = await simulateDecisionScenarios(D, withClient("not json", "still not json"));
  assert.equal(out.failureCode, "SCHEMA_VALIDATION_FAILED");
  assert.equal(out.interpretation.meta?.attempts, 2);
});

test("recommendation-only failure → deterministic scenarios + diffs are retained, no fabricated prose", async () => {
  const out = await simulateDecisionScenarios(D, withClient(interpBody(), new Error("rec down")));
  assert.equal(out.ok, true);
  assert.ok(out.scenarios.length >= 1);
  assert.equal(out.scenarios[0].diff.scenarioId, "A");
  assert.equal(out.recommendation.available, false);
  assert.equal(out.recommendation.failureCode, "PROVIDER_ERROR");
  assert.equal(out.recommendation.recommendationAr, null);
  assert.deepEqual(out.recommendation.scenarioExplanations, []);
});

test("guardrails: invented officialWeight / penalty / integration in interpretation → GUARDRAIL_REJECTED", async () => {
  for (const bad of [{ officialWeight: 3 }, { penalty: "5000 SAR" }, { isConnected: true }]) {
    const out = await simulateDecisionScenarios(
      D,
      withClient(interpBody(bad), interpBody(bad)),
    );
    assert.equal(out.failureCode, "GUARDRAIL_REJECTED");
    assert.deepEqual(out.scenarios, []);
  }
});
