// =============================================================================
// Phase 5 tests — Regulatory Intelligence Agent orchestration.
//
// The real StructuredAIClient pipeline runs with a fake transport, so guardrails,
// the one-retry cap and the failure model are exercised for real. The LLM never
// decides a regulatory outcome, a confidence, or an applicability result —
// retrieval + canonical data + the deterministic applicability engine do.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { StructuredAIClient, UnavailableAIClient } from "@/lib/ai/client/aiClient";
import type { AITransport } from "@/lib/ai/client/types";
import {
  answerRegulatoryQuestion,
  explainApplicability,
  explainRequirement,
} from "@/lib/ai/agents";
import { getRequirementByCanonicalId } from "@/lib/data/regulatory";
import {
  DEMO_COMPANY_PROFILE,
  DEMO_COMPANY_PROFILE_DRAFT,
} from "@/lib/data/demo/companyProfile";
import { buildCompanyProfile } from "@/lib/onboarding/companyProfile";

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

/** opts for an agent call whose LLM returns these bodies in order. */
const withClient = (...bodies: (string | Error)[]) => ({
  client: new StructuredAIClient(fakeTransport(bodies)),
});

/**
 * A well-formed LLM answer body. NOTE: the schema has no `confidence` /
 * `confidenceReasonAr` field — a body carrying one is rejected (a dedicated
 * test relies on that).
 */
const answerBody = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    answerAr: "شرح موجز معتمد للمتطلب.",
    requirementIds: [],
    authorityId: null,
    missingInformation: [],
    applicabilityExplanationAr: null,
    ...over,
  });

const CANON_APPLICABLE = "المتطلب منطبق على ملف الشركة وفق قاعدة الانطباق الحتمية.";
const CANON_NOT_APPLICABLE = "المتطلب غير منطبق على ملف الشركة وفق قاعدة الانطباق الحتمية.";
const CANON_INSUFFICIENT = "لا تتوفر بيانات كافية لتحديد الانطباق حتميًا.";

// -- closed world / season lock (no LLM call) ---------------------------

test("unknown topic → OUT_OF_CORPUS, LOW ='low ability to answer', no answer, no LLM call", async () => {
  const r = await answerRegulatoryQuestion({
    text: "ما هي شروط ترخيص وكالة سياحية للسفر الخارجي؟",
  });
  assert.equal(r.ok, false);
  assert.equal(r.regulatoryState, "OUT_OF_CORPUS");
  assert.equal(r.failureCode, "OUT_OF_CORPUS");
  assert.equal(r.answerAr, null);
  assert.deepEqual(r.requirementIds, []);
  assert.equal(r.confidence, "LOW");
  assert.equal(r.needsHumanReview, true);
  assert.equal(r.meta, null);
  // documents that LOW means low ability to answer from corpus, not low
  // confidence in a fabricated regulation
  assert.match(r.confidenceReasonAr, /ضعف القدرة على الإجابة من النطاق المعتمد/);
});

test("non-1447H season → SEASON_MISMATCH, no answer, no LLM call", async () => {
  const r = await answerRegulatoryQuestion({ requirementId: "HAJ-EXP-05", season: "1446H" });
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "SEASON_MISMATCH");
  assert.equal(r.regulatoryState, "OUT_OF_CORPUS");
  assert.equal(r.answerAr, null);
  assert.equal(r.confidence, "LOW");
  assert.equal(r.season, "1446H");
  assert.equal(r.meta, null);
});

test("ambiguous retrieval → AMBIGUOUS_RETRIEVAL with candidate lineage, no silent pick, no LLM call", async () => {
  const r = await answerRegulatoryQuestion({ text: "جاهزية" });
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "AMBIGUOUS_RETRIEVAL");
  assert.equal(r.ambiguous, true);
  assert.equal(r.confidence, "LOW");
  assert.ok(r.candidateRequirementIds.length >= 2);
  assert.equal(r.answerAr, null);
  assert.equal(r.needsHumanReview, true);
  assert.equal(r.meta, null);
  assert.equal(r.sources.length, r.candidateRequirementIds.length);
});

// -- happy path + exact source lineage --------------------------------

test("explainRequirement(HAJ-EXP-05): schema-valid answer + exact canonical source lineage + deterministic HIGH", async () => {
  const r = await explainRequirement("HAJ-EXP-05", withClient(answerBody()));
  const canonical = getRequirementByCanonicalId("HAJ-EXP-05")!;

  assert.equal(r.ok, true);
  assert.equal(r.answerAr, "شرح موجز معتمد للمتطلب.");
  assert.deepEqual(r.requirementIds, ["HAJ-EXP-05"]);
  assert.equal(r.regulatoryState, "SPECIFIED");
  assert.equal(r.meta?.provider, "fake");

  const s = r.sources[0];
  assert.equal(s.requirementId, "HAJ-EXP-05");
  assert.equal(s.titleAr, "توثيق فعاليات ومبادرات فريق السعادة");
  assert.equal(s.titleAr, canonical.titleAr);
  assert.equal(s.authorityId, "MOHU");
  assert.equal(s.authorityNameAr, "وزارة الحج والعمرة");
  assert.equal(s.officialSourceReference, canonical.officialSource!.reference);
  assert.deepEqual(s.officialSourceUrls, canonical.officialSource!.urls);
  assert.equal(s.officialSourceLocatorNote, canonical.officialSource!.locatorNote);
  assert.equal(s.locatorComplete, true);
  assert.equal(s.matrixSourceRef, "REGULATORY_MATRIX_v1.md §4.1");
  assert.equal(s.resolution, "SPECIFIED");
  assert.equal(s.season, "1447H");

  // confidence is derived by code (SPECIFIED + complete locator + answer) — HIGH
  assert.equal(r.confidence, "HIGH");
  assert.equal(r.needsHumanReview, false);
  assert.match(r.confidenceReasonAr, /جودة الاسترجاع والتفسير/);
});

test("legacy alias CR-005 → canonical HAJ-EXP-05 in the result", async () => {
  const r = await explainRequirement("CR-005", withClient(answerBody()));
  assert.equal(r.ok, true);
  assert.deepEqual(r.requirementIds, ["HAJ-EXP-05"]);
});

// -- confidence is deterministic, never model-controlled -------------

test("the model cannot supply a confidence — a body carrying one fails schema, it is not honoured", async () => {
  const r = await explainRequirement(
    "HAJ-EXP-05",
    withClient(answerBody({ confidence: "LOW" }), answerBody({ confidence: "LOW" })),
  );
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "SCHEMA_VALIDATION_FAILED");
  assert.equal(r.answerAr, null);
});

test("a deterministic HIGH result is not downgraded (no model confidence path exists)", async () => {
  // Repeated clean runs are stable at HIGH; nothing the model returns moves it.
  for (let i = 0; i < 3; i++) {
    const r = await explainRequirement("HAJ-EXP-05", withClient(answerBody()));
    assert.equal(r.confidence, "HIGH");
    assert.equal(r.needsHumanReview, false);
  }
});

test("no invented numeric confidence thresholds remain in the agent / shared schema", () => {
  const root = path.resolve(import.meta.dirname, "../../../../..");
  const agent = readFileSync(path.join(root, "src/lib/ai/agents/regulatoryAgent.ts"), "utf8");
  const common = readFileSync(path.join(root, "src/lib/ai/schemas/common.ts"), "utf8");
  for (const src of [agent, common]) {
    assert.equal(/0\.67|0\.34|\/\s*100\b/.test(src), false, "numeric confidence mapping must be gone");
  }
});

// -- UNRESOLVED regulatory truth stays unresolved --------------------

for (const id of ["HAJ-PROVIDERS-01", "MOH-01"]) {
  test(`${id}: UNRESOLVED_REQUIREMENT stays unresolved; confidence deterministically LOW; review required`, async () => {
    const r = await explainRequirement(id, withClient(answerBody()));
    assert.equal(r.ok, true); // an explanation was produced
    assert.equal(r.regulatoryState, "UNRESOLVED_REQUIREMENT");
    assert.equal(r.confidence, "LOW");
    assert.equal(r.needsHumanReview, true);
    assert.equal(r.sources[0].resolution, "UNRESOLVED_REQUIREMENT");
    assert.ok(r.answerAr && r.answerAr.length > 0);
    assert.match(r.confidenceReasonAr, /غير محسوم تنظيميًا/);
  });
}

// -- explicit locator status drives locatorComplete (FIX 1) ----------

test("locatorComplete is derived ONLY from the explicit canonical locatorStatus", async () => {
  const expect: [string, "VERIFIED_COMPLETE" | "INCOMPLETE", boolean][] = [
    ["HAJ-EXP-05", "VERIFIED_COMPLETE", true],
    ["HAJ-CATERING-01", "INCOMPLETE", false],
    ["HAJ-CAMP-01", "INCOMPLETE", false],
    ["HAJ-PROVIDERS-01", "INCOMPLETE", false],
  ];
  for (const [id, status, complete] of expect) {
    const r = await explainRequirement(id, withClient(answerBody()));
    assert.equal(r.sources[0].locatorStatus, status, id);
    assert.equal(r.sources[0].locatorComplete, complete, id);
  }
});

test("HAJ-CAMP-01: INCOMPLETE locator → confidence MEDIUM, review required, nothing invented", async () => {
  const r = await explainRequirement("HAJ-CAMP-01", withClient(answerBody()));
  assert.equal(r.ok, true);
  assert.equal(r.sources[0].locatorStatus, "INCOMPLETE");
  assert.equal(r.sources[0].locatorComplete, false);
  assert.equal(r.confidence, "MEDIUM");
  assert.equal(r.needsHumanReview, true);
  assert.match(r.confidenceReasonAr, /غير مكتمل/);
});

test("HAJ-EXP-05: VERIFIED_COMPLETE locator → confidence HIGH, no review", async () => {
  const r = await explainRequirement("HAJ-EXP-05", withClient(answerBody()));
  assert.equal(r.sources[0].locatorStatus, "VERIFIED_COMPLETE");
  assert.equal(r.sources[0].locatorComplete, true);
  assert.equal(r.confidence, "HIGH");
  assert.equal(r.needsHumanReview, false);
});

// -- applicability: deterministic outcome + no contradictory prose surfaced --

test("APPLICABLE + AI says «غير منطبق» → contradiction discarded, canonical statement only", async () => {
  const r = await explainApplicability(
    { requirementIdOrAlias: "HAJ-EXP-05", profile: DEMO_COMPANY_PROFILE },
    withClient(
      answerBody({
        answerAr: "المتطلب غير منطبق على الشركة", // misleading free-text
        applicabilityExplanationAr: "أرى أن المتطلب غير منطبق هنا.",
      }),
    ),
  );
  assert.equal(r.deterministicApplicability?.outcome, "APPLICABLE");
  assert.equal(r.applicabilityExplanationAr, CANON_APPLICABLE);
  assert.equal(r.applicabilityExplanationAr?.includes("غير منطبق"), false);
  // a contradictory free-text answer is also not surfaced verbatim
  assert.equal(r.answerAr?.includes("غير منطبق"), false);
  assert.match(r.confidenceReasonAr, /غير متسق/);
});

test("NOT_APPLICABLE + AI says «منطبق» → contradiction discarded, canonical statement only", async () => {
  const outOfScope = buildCompanyProfile({
    ...DEMO_COMPANY_PROFILE_DRAFT,
    declaredFacts: {
      ...DEMO_COMPANY_PROFILE_DRAFT.declaredFacts,
      experienceTrackScopeDeclared: false,
    },
  });
  const r = await explainApplicability(
    { requirementIdOrAlias: "HAJ-EXP-05", profile: outOfScope },
    withClient(answerBody({ applicabilityExplanationAr: "المتطلب منطبق على الشركة فعليًا." })),
  );
  assert.equal(r.deterministicApplicability?.outcome, "NOT_APPLICABLE");
  assert.equal(r.applicabilityExplanationAr, CANON_NOT_APPLICABLE);
  assert.match(r.confidenceReasonAr, /غير متسق/);
});

test("INSUFFICIENT_DATA + AI claims a definite outcome → contradiction discarded", async () => {
  const r = await explainApplicability(
    { requirementIdOrAlias: "MOH-01", profile: DEMO_COMPANY_PROFILE },
    withClient(answerBody({ applicabilityExplanationAr: "المتطلب منطبق بالتأكيد على جميع العاملين." })),
  );
  assert.equal(r.deterministicApplicability?.outcome, "INSUFFICIENT_DATA");
  assert.equal(r.applicabilityExplanationAr, CANON_INSUFFICIENT);
  assert.match(r.confidenceReasonAr, /غير متسق/);
});

test("a consistent AI applicability explanation is preserved under the canonical statement", async () => {
  const r = await explainApplicability(
    { requirementIdOrAlias: "HAJ-EXP-05", profile: DEMO_COMPANY_PROFILE },
    withClient(
      answerBody({
        applicabilityExplanationAr: "لأن الشركة أعلنت انضمامها إلى نطاق مسار التجربة المعتمد.",
      }),
    ),
  );
  assert.equal(r.deterministicApplicability?.outcome, "APPLICABLE");
  assert.equal(r.applicabilityExplanationAr?.startsWith(CANON_APPLICABLE), true);
  assert.match(r.applicabilityExplanationAr ?? "", /أعلنت انضمامها إلى نطاق مسار التجربة/);
  assert.equal(r.confidenceReasonAr.includes("غير متسق"), false);
});

// -- missing information stays truthful ---------------------------

test("canonical missingInformation is seeded ONLY from missingCompanyFields, never companyFieldsUsed", async () => {
  const r = await explainApplicability(
    { requirementIdOrAlias: "MOH-01", profile: DEMO_COMPANY_PROFILE },
    withClient(answerBody({ missingInformation: [] })),
  );
  assert.equal(r.deterministicApplicability?.outcome, "INSUFFICIENT_DATA");
  assert.deepEqual(r.deterministicApplicability?.missingCompanyFields, ["directContactWorkers.count"]);
  assert.deepEqual(r.missingInformation, ["حقل ملف الشركة غير مُعلن: directContactWorkers.count"]);
});

test("a field the rule CONSULTED but which is present is never surfaced as missing (APPLICABLE)", async () => {
  // demo is in-scope → HAJ-EXP-05 APPLICABLE; companyFieldsUsed lists the scope
  // field but it is present, so missingCompanyFields = [] and missingInformation = [].
  const r = await explainApplicability(
    { requirementIdOrAlias: "HAJ-EXP-05", profile: DEMO_COMPANY_PROFILE },
    withClient(answerBody()),
  );
  assert.equal(r.deterministicApplicability?.outcome, "APPLICABLE");
  assert.ok((r.deterministicApplicability?.companyFieldsUsed.length ?? 0) > 0);
  assert.deepEqual(r.deterministicApplicability?.missingCompanyFields, []);
  assert.deepEqual(r.missingInformation, []);
});

test("deterministic missing profile fields survive even when the AI returns []", async () => {
  const r = await explainApplicability(
    { requirementIdOrAlias: "MOH-01", profile: DEMO_COMPANY_PROFILE },
    withClient(answerBody({ missingInformation: [] })),
  );
  assert.equal(r.deterministicApplicability?.outcome, "INSUFFICIENT_DATA");
  assert.ok(
    r.missingInformation.some((m) => m.includes("directContactWorkers.count")),
    `expected the engine field to survive: ${JSON.stringify(r.missingInformation)}`,
  );
});

test("the AI cannot remove or replace canonical missing fields; its own items are additive", async () => {
  const r = await explainApplicability(
    { requirementIdOrAlias: "MOH-01", profile: DEMO_COMPANY_PROFILE },
    withClient(answerBody({ missingInformation: "معلومة غير ذات صلة" })), // lone string
  );
  assert.ok(r.missingInformation.some((m) => m.includes("directContactWorkers.count")));
  assert.ok(r.missingInformation.some((m) => m.includes("معلومة غير ذات صلة")));
});

test("general requirement explanation with no deterministic missing fields → empty list is fine", async () => {
  const r = await explainRequirement("HAJ-EXP-05", withClient(answerBody({ missingInformation: [] })));
  assert.equal(r.ok, true);
  assert.deepEqual(r.missingInformation, []);
});

test("INSUFFICIENT_DATA is explained, never inferred to APPLICABLE", async () => {
  const r = await explainApplicability(
    { requirementIdOrAlias: "MOH-01", profile: DEMO_COMPANY_PROFILE },
    withClient(answerBody({ applicabilityExplanationAr: "لم تُعلن الشركة فئة العاملين ذوي الاتصال المباشر." })),
  );
  assert.equal(r.deterministicApplicability?.outcome, "INSUFFICIENT_DATA");
  assert.notEqual(r.deterministicApplicability?.outcome, "APPLICABLE");
  assert.equal(r.regulatoryState, "UNRESOLVED_REQUIREMENT"); // MOH-01
  assert.equal(r.confidence, "LOW");
  assert.equal(r.needsHumanReview, true);
});

// -- guardrails still run AFTER JSON parsing -----------------------

const guardrailRejects = async (over: Record<string, unknown>) => {
  const r = await explainRequirement("HAJ-EXP-05", withClient(answerBody(over)));
  assert.equal(r.ok, false, `expected rejection for ${JSON.stringify(over)}`);
  assert.equal(r.failureCode, "GUARDRAIL_REJECTED");
  assert.equal(r.answerAr, null);
  assert.equal(r.meta?.attempts, 1, "guardrail rejection must not retry");
};

test("AI attempting a compliance status → GUARDRAIL_REJECTED", () =>
  guardrailRejects({ complianceStatus: "COMPLIANT" }));
test("AI attempting an official weight → GUARDRAIL_REJECTED", () =>
  guardrailRejects({ officialWeight: 5 }));
test("AI attempting a penalty → GUARDRAIL_REJECTED", () =>
  guardrailRejects({ penalty: "1000 SAR" }));
test("AI attempting a numeric target → GUARDRAIL_REJECTED", () =>
  guardrailRejects({ targetPopulation: 320 }));
test("AI attempting a government integration state → GUARDRAIL_REJECTED", () =>
  guardrailRejects({ isConnected: true }));
test("AI attempting an out-of-corpus requirement id → GUARDRAIL_REJECTED", () =>
  guardrailRejects({ requirementIds: ["HAJ-FAKE-99"] }));

// -- failure model ------------------------------------------------

test("AI unavailable → controlled AI_UNAVAILABLE, no fabricated answer, LOW, lineage still returned", async () => {
  const r = await explainRequirement("HAJ-EXP-05", {
    client: new UnavailableAIClient("no creds"),
  });
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "AI_UNAVAILABLE");
  assert.equal(r.answerAr, null);
  assert.equal(r.confidence, "LOW");
  assert.deepEqual(r.requirementIds, ["HAJ-EXP-05"]);
  assert.equal(r.sources[0].requirementId, "HAJ-EXP-05");
  assert.equal(r.regulatoryState, "SPECIFIED");
  assert.equal(r.needsHumanReview, true);
});

test("malformed model output → at most one retry → SCHEMA_VALIDATION_FAILED", async () => {
  const r = await explainRequirement(
    "HAJ-EXP-05",
    withClient("not json at all", "still not json"),
  );
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "SCHEMA_VALIDATION_FAILED");
  assert.equal(r.meta?.attempts, 2);
  assert.equal(r.answerAr, null);
});

test("schema-invalid shape → at most one retry → SCHEMA_VALIDATION_FAILED", async () => {
  const bad = JSON.stringify({ answerAr: "x" }); // missing required keys
  const r = await explainRequirement("HAJ-EXP-05", withClient(bad, bad));
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "SCHEMA_VALIDATION_FAILED");
  assert.equal(r.meta?.attempts, 2);
});

test("provider error → controlled PROVIDER_ERROR, no retry, no fabricated answer", async () => {
  const r = await explainRequirement("HAJ-EXP-05", withClient(new Error("boom")));
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "PROVIDER_ERROR");
  assert.equal(r.meta?.attempts, 1);
  assert.equal(r.answerAr, null);
});

test("no failure path ever returns a regulatory answer", async () => {
  const results = [
    await answerRegulatoryQuestion({ text: "ترخيص وكالة سياحية" }),
    await answerRegulatoryQuestion({ text: "جاهزية" }),
    await explainRequirement("HAJ-EXP-05", withClient(new Error("x"))),
    await explainRequirement("HAJ-EXP-05", withClient("bad", "bad")),
    await explainRequirement("HAJ-EXP-05", { client: new UnavailableAIClient("n") }),
    await explainRequirement("HAJ-EXP-05", withClient(answerBody({ officialWeight: 1 }))),
  ];
  for (const r of results) {
    assert.equal(r.ok, false);
    assert.equal(r.answerAr, null);
  }
});
