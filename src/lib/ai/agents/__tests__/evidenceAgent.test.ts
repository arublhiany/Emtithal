// =============================================================================
// Phase 6 tests — Evidence Intelligence Agent.
//
// The real StructuredAIClient pipeline runs with a fake transport, so guardrails,
// the one-retry cap and the failure model are exercised for real. Evidence is
// NOT compliance: the agent never sets a status / weight / target / penalty,
// never invents a requirement, never marks anything VERIFIED, and always echoes
// the extracted facts.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { StructuredAIClient, UnavailableAIClient } from "@/lib/ai/client/aiClient";
import type { AITransport } from "@/lib/ai/client/types";
import { analyzeEvidence, mapEvidenceToRequirements } from "@/lib/ai/agents";
import type { EvidenceAgentInput } from "@/lib/ai/agents";
import type { ExtractedEvidenceFact } from "@/lib/evidence/types";

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

const pdfFact = (n: number, text: string): ExtractedEvidenceFact => ({
  factId: `ev-1#p${n}`,
  text,
  value: text,
  evidenceId: "ev-1",
  fileName: "log.pdf",
  sourceLocator: { kind: "PDF_PAGE", page: n },
  extractionMethod: "PDF_TEXT",
});

const extraction = (facts: ExtractedEvidenceFact[]): EvidenceAgentInput["extraction"] => ({
  ok: true,
  state: "EXTRACTED",
  evidenceId: "ev-1",
  companyId: "demo-company-01",
  facts,
  fileName: "log.pdf",
});

const HAPPINESS_AR =
  "تم تنفيذ وتوثيق ثلاث فعاليات لفريق السعادة خلال موسم 1447هـ، ويتضمن السجل أسماء الفعاليات وتواريخ التنفيذ.";

/** A well-formed analysis body. `over` replaces top-level keys. */
const analysisBody = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    summaryAr: "يبدو أن الدليل يوثّق فعاليات فريق السعادة.",
    mappings: [
      {
        requirementId: "HAJ-EXP-05",
        evidenceFactIds: ["ev-1#p1"],
        appearsToSupportAr: "يبدو أن النص يشير إلى توثيق فعاليات فريق السعادة.",
        stillMissingAr: ["التقرير النهائي", "الاستبانات"],
        relatedVerificationTargetAr: "توثيق المبادرات",
        interpretationConfidence: "MEDIUM",
      },
    ],
    conflicts: [],
    unmappedFactIds: [],
    needsHumanReview: false,
    ...over,
  });

/** A body whose single mapping is fully overridable. */
const oneMappingBody = (mapping: Record<string, unknown>, top: Record<string, unknown> = {}) =>
  JSON.stringify({
    summaryAr: "يبدو أن الدليل مرتبط بالمتطلب.",
    mappings: [
      {
        requirementId: "HAJ-EXP-05",
        evidenceFactIds: ["ev-1#p1"],
        appearsToSupportAr: "يبدو أن الدليل يوثق فعاليات فريق السعادة.",
        stillMissingAr: [],
        relatedVerificationTargetAr: null,
        interpretationConfidence: "MEDIUM",
        ...mapping,
      },
    ],
    conflicts: [],
    unmappedFactIds: [],
    needsHumanReview: false,
    ...top,
  });

const oneFact = () => extraction([pdfFact(1, "activities log")]);

// -- (1) prose compliance-verdict guard ---------------------------

const verdictRejected = async (body: string) => {
  const r = await analyzeEvidence(
    { extraction: oneFact(), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(body),
  );
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "GUARDRAIL_REJECTED");
  assert.deepEqual(r.mappings, []);
  assert.equal(r.summaryAr, null);
  assert.equal(r.complianceAsserted, false);
  assert.equal(r.facts.length, 1); // extracted evidence preserved
  return r;
};

test("prose verdict in appearsToSupportAr → rejected, offending prose not surfaced", async () => {
  const r = await verdictRejected(
    oneMappingBody({ appearsToSupportAr: "هذا يثبت امتثال الشركة للمتطلب." }),
  );
  const all = JSON.stringify(r);
  assert.equal(all.includes("يثبت امتثال"), false);
});

test("prose verdict in summaryAr → rejected", async () => {
  await verdictRejected(oneMappingBody({}, { summaryAr: "الشركة ملتزمة بالمتطلب." }));
});

test("English compliance verdict in prose → rejected", async () => {
  await verdictRejected(
    oneMappingBody({ appearsToSupportAr: "the company is compliant with this requirement" }),
  );
});

test("prose verdict in stillMissingAr → rejected", async () => {
  await verdictRejected(oneMappingBody({ stillMissingAr: ["المتطلب متحقق بالكامل"] }));
});

test("hedged non-verdict wording is allowed", async () => {
  const r = await analyzeEvidence(
    { extraction: oneFact(), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(
      oneMappingBody({
        appearsToSupportAr: "لا يكفي هذا الدليل وحده للحكم على الامتثال، لكنه قد يدعم التحقق من توثيق المبادرات.",
      }),
    ),
  );
  assert.equal(r.ok, true);
  assert.equal(r.mappings.length, 1);
});

test("normal 'appears to document' wording is allowed", async () => {
  const r = await analyzeEvidence(
    { extraction: oneFact(), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(oneMappingBody({ appearsToSupportAr: "يبدو أن الدليل يوثق ثلاث فعاليات لفريق السعادة." })),
  );
  assert.equal(r.ok, true);
  assert.equal(r.mappings[0].appearsToSupportAr, "يبدو أن الدليل يوثق ثلاث فعاليات لفريق السعادة.");
});

test("NEGATIVE compliance verdicts in prose are rejected (Arabic) — offending text not surfaced", async () => {
  for (const phrase of [
    "الشركة غير ملتزمة بالمتطلب",
    "المتطلب غير متحقق في هذا المستند",
    "لم تستوف الشركة المتطلب",
    "هذا يثبت عدم الامتثال",
  ]) {
    const r = await verdictRejected(oneMappingBody({ appearsToSupportAr: phrase }));
    assert.equal(r.state, "EXTRACTED");
    assert.equal(JSON.stringify(r).includes(phrase), false, phrase);
  }
});

test("NEGATIVE compliance verdicts in prose are rejected (English)", async () => {
  for (const phrase of [
    "the company is not compliant with this requirement",
    "the company is non-compliant",
    "the requirement is not met by this document",
    "this proves non-compliance",
  ]) {
    await verdictRejected(oneMappingBody({ appearsToSupportAr: phrase }));
  }
});

test("safe uncertainty wording about compliance stays allowed", async () => {
  for (const phrase of [
    "لا يكفي هذا الدليل وحده للحكم على الامتثال",
    "يحتاج الأمر إلى تحقق إضافي قبل تحديد حالة الامتثال",
    "لا يمكن تحديد حالة الامتثال من هذا المستند وحده",
    "insufficient evidence to determine compliance",
  ]) {
    const r = await analyzeEvidence(
      { extraction: oneFact(), candidateRequirementIds: ["HAJ-EXP-05"] },
      withClient(oneMappingBody({ appearsToSupportAr: phrase })),
    );
    assert.equal(r.ok, true, phrase);
    assert.equal(r.mappings.length, 1, phrase);
  }
});

// -- (2) closed-world evidence-fact references -------------------

test("mapping references an invented fact id → whole mapping discarded, nothing supportive surfaces", async () => {
  const r = await analyzeEvidence(
    { extraction: oneFact(), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(oneMappingBody({ evidenceFactIds: ["ev-1#p999"] })),
  );
  assert.equal(r.ok, true);
  assert.deepEqual(r.mappings, []);
  assert.equal(r.droppedMappings.some((d) => d.reason === "UNKNOWN_EVIDENCE_FACT_REFERENCE"), true);
  assert.equal(r.needsHumanReview, true);
});

test("mapping with one real + one invented fact id → NOT reduced to the real one; whole mapping dropped", async () => {
  const r = await analyzeEvidence(
    { extraction: oneFact(), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(oneMappingBody({ evidenceFactIds: ["ev-1#p1", "ev-1#p42"] })),
  );
  assert.deepEqual(r.mappings, []);
  assert.equal(r.droppedMappings[0].reason, "UNKNOWN_EVIDENCE_FACT_REFERENCE");
  assert.equal(r.needsHumanReview, true);
});

test("mapping with zero fact ids never surfaces as supportive evidence", async () => {
  const r = await analyzeEvidence(
    { extraction: oneFact(), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(oneMappingBody({ evidenceFactIds: [] })),
  );
  assert.deepEqual(r.mappings, []);
  assert.equal(r.droppedMappings[0].reason, "NO_VALID_EVIDENCE_FACT");
  assert.equal(r.needsHumanReview, true);
});

test("conflict referencing an invented fact id → not accepted as a real conflict", async () => {
  const r = await analyzeEvidence(
    { extraction: extraction([pdfFact(1, "a"), pdfFact(2, "b")]), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(
      oneMappingBody(
        {},
        {
          conflicts: [
            { factIdA: "ev-1#p1", factIdB: "ev-1#p777", descriptionAr: "تعارض مزعوم." },
          ],
        },
      ),
    ),
  );
  assert.deepEqual(r.conflicts, []);
  assert.equal(r.integrityNotes.some((n) => n.includes("unknown fact id")), true);
  assert.equal(r.needsHumanReview, true);
});

test("invented unmappedFactIds are ignored; unmappedFactIds stay a subset of real facts", async () => {
  const r = await analyzeEvidence(
    { extraction: extraction([pdfFact(1, "a"), pdfFact(2, "b")]), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(oneMappingBody({ evidenceFactIds: ["ev-1#p1"] }, { unmappedFactIds: ["ev-1#pZZZ"] })),
  );
  assert.ok(r.unmappedFactIds.every((id) => ["ev-1#p1", "ev-1#p2"].includes(id)));
  assert.equal(r.unmappedFactIds.includes("ev-1#pZZZ"), false);
  assert.equal(r.unmappedFactIds.includes("ev-1#p2"), true); // real, not backing a mapping
  assert.equal(r.needsHumanReview, true); // invented ref forces review
});

test("all-valid references are preserved exactly", async () => {
  const r = await analyzeEvidence(
    { extraction: extraction([pdfFact(1, "a"), pdfFact(2, "b")]), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(oneMappingBody({ evidenceFactIds: ["ev-1#p1", "ev-1#p2"] })),
  );
  assert.deepEqual(r.mappings[0].evidenceFactIds, ["ev-1#p1", "ev-1#p2"]);
  assert.deepEqual(r.droppedMappings, []);
  assert.deepEqual(r.unmappedFactIds, []);
});

// -- (3) closed-world verification target -----------------------

async function targetResolution(suggested: string) {
  const r = await analyzeEvidence(
    { extraction: oneFact(), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(oneMappingBody({ relatedVerificationTargetAr: suggested })),
  );
  return r.mappings[0]?.relatedVerificationTargetAr ?? null;
}

test("verification target: EXACT normalized match succeeds and is reattached verbatim", async () => {
  assert.equal(await targetResolution("توثيق المبادرات"), "توثيق المبادرات");
  // harmless normalisation differences still match (extra spaces / punctuation)
  assert.equal(await targetResolution("  توثيق  المبادرات . "), "توثيق المبادرات");
});

test("verification target: partial PREFIX fails → null + review", async () => {
  assert.equal(await targetResolution("توثيق"), null);
});

test("verification target: partial SUFFIX fails → null", async () => {
  assert.equal(await targetResolution("المبادرات"), null);
});

test("verification target: canonical + EXTRA words fails → null", async () => {
  assert.equal(await targetResolution("توثيق المبادرات والسجل التجاري"), null);
});

test("verification target: unrelated target fails → null + review + note", async () => {
  const r = await analyzeEvidence(
    { extraction: oneFact(), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(oneMappingBody({ relatedVerificationTargetAr: "التحقق من السجل التجاري" })),
  );
  assert.equal(r.mappings[0].relatedVerificationTargetAr, null);
  assert.equal(r.needsHumanReview, true);
  assert.equal(r.integrityNotes.some((n) => n.includes("verification target")), true);
});

test("an exact canonical verification area is accepted with no integrity note", async () => {
  const r = await analyzeEvidence(
    { extraction: oneFact(), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(oneMappingBody({ relatedVerificationTargetAr: "توثيق المبادرات" })),
  );
  assert.equal(r.mappings[0].relatedVerificationTargetAr, "توثيق المبادرات");
  assert.equal(r.integrityNotes.length, 0);
});

test("a requirement with no usable verification target → relatedVerificationTargetAr null", async () => {
  const r = await analyzeEvidence(
    { extraction: oneFact(), candidateRequirementIds: ["HAJ-NUSUK-01"] },
    withClient(
      oneMappingBody({ requirementId: "HAJ-NUSUK-01", relatedVerificationTargetAr: "أي هدف مقترح" }),
    ),
  );
  assert.equal(r.mappings[0].relatedVerificationTargetAr, null);
});

test("UNRESOLVED requirement stays unresolved regardless of a target suggestion", async () => {
  const r = await analyzeEvidence(
    { extraction: oneFact(), candidateRequirementIds: ["MOH-01"] },
    withClient(
      oneMappingBody({ requirementId: "MOH-01", relatedVerificationTargetAr: "شيء مخترع" }),
    ),
  );
  assert.equal(r.mappings[0].regulatoryResolution, "UNRESOLVED_REQUIREMENT");
  assert.equal(r.mappings[0].relatedVerificationTargetAr, null);
  assert.equal(r.needsHumanReview, true);
});

// -- closed world: no invented requirement -------------------------

test("unknown evidence topic → NO_RELEVANT_REQUIREMENT, no LLM call, no regulation invented", async () => {
  const r = await analyzeEvidence({
    extraction: extraction([pdfFact(1, "Invoice total 500 SAR for office chairs, net 30 terms.")]),
  });
  assert.equal(r.ok, true);
  assert.equal(r.outOfScope, true);
  assert.equal(r.outOfScopeCode, "NO_RELEVANT_REQUIREMENT");
  assert.deepEqual(r.mappings, []);
  assert.equal(r.state, "EXTRACTED");
  assert.equal(r.meta, null);
  assert.equal(r.needsHumanReview, true);
  assert.equal(r.complianceAsserted, false);
  assert.equal(r.facts.length, 1); // extracted evidence still available
});

test("deterministic retrieval maps Arabic evidence text to the canonical HAJ-EXP-05", async () => {
  const r = await analyzeEvidence(
    { extraction: extraction([pdfFact(1, HAPPINESS_AR)]) },
    withClient(analysisBody()),
  );
  assert.equal(r.ok, true);
  assert.equal(r.retrievalOutcome, "MATCH");
  assert.deepEqual(r.candidateRequirementIds, ["HAJ-EXP-05"]);
  assert.equal(r.mappings[0].requirementId, "HAJ-EXP-05");
  assert.equal(r.mappings[0].titleAr, "توثيق فعاليات ومبادرات فريق السعادة");
});

// -- explicit candidate restriction --------------------------------

test("explicit candidate set restricts the model; mapping stays within it", async () => {
  const r = await mapEvidenceToRequirements(
    { extraction: extraction([pdfFact(1, "activities log")]), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(analysisBody()),
  );
  assert.equal(r.ok, true);
  assert.equal(r.state, "AI_INTERPRETED");
  assert.equal(r.retrievalOutcome, "EXPLICIT");
  assert.ok(r.mappings.every((m) => r.candidateRequirementIds.includes(m.requirementId)));
  assert.equal(r.mappings[0].note, "EVIDENCE_ONLY_NOT_A_COMPLIANCE_DECISION");
  assert.equal(r.mappings[0].evidenceFactIds[0], "ev-1#p1");
});

test("an invalid explicit candidate id is dropped; none left → NO_RELEVANT_REQUIREMENT", async () => {
  const r = await analyzeEvidence({
    extraction: extraction([pdfFact(1, "x")]),
    candidateRequirementIds: ["NOT-A-REQ"],
  });
  assert.equal(r.outOfScope, true);
  assert.equal(r.meta, null);
});

// -- UNRESOLVED requirements stay unresolved -----------------------

test("evidence mapped to MOH-01 keeps regulatoryResolution UNRESOLVED_REQUIREMENT; review forced", async () => {
  const body = analysisBody({
    mappings: [
      {
        requirementId: "MOH-01",
        evidenceFactIds: ["ev-1#p1"],
        appearsToSupportAr: "قد يتعلق بالتحصين.",
        stillMissingAr: [],
        relatedVerificationTargetAr: null,
        interpretationConfidence: "HIGH",
      },
    ],
  });
  const r = await analyzeEvidence(
    { extraction: extraction([pdfFact(1, "vaccination records")]), candidateRequirementIds: ["MOH-01"] },
    withClient(body),
  );
  assert.equal(r.ok, true);
  assert.equal(r.mappings[0].regulatoryResolution, "UNRESOLVED_REQUIREMENT");
  assert.equal(r.needsHumanReview, true);
});

// -- guardrails: evidence is not compliance -----------------------

const guardrailRejects = async (over: Record<string, unknown>) => {
  const r = await analyzeEvidence(
    { extraction: extraction([pdfFact(1, "x")]), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(analysisBody(over), analysisBody(over)),
  );
  assert.equal(r.ok, false, `expected rejection for ${JSON.stringify(over)}`);
  assert.equal(r.failureCode, "GUARDRAIL_REJECTED");
  assert.deepEqual(r.mappings, []);
  assert.equal(r.summaryAr, null);
  assert.equal(r.meta?.attempts, 1);
};

test("AI attempting complianceStatus → GUARDRAIL_REJECTED", () =>
  guardrailRejects({ complianceStatus: "COMPLIANT" }));
test("AI attempting officialWeight → GUARDRAIL_REJECTED", () => guardrailRejects({ officialWeight: 3 }));
test("AI attempting penalty → GUARDRAIL_REJECTED", () => guardrailRejects({ penalty: "5000 SAR" }));
test("AI attempting a numeric target → GUARDRAIL_REJECTED", () =>
  guardrailRejects({ targetPopulation: 3 }));
test("AI attempting a government integration state → GUARDRAIL_REJECTED", () =>
  guardrailRejects({ isConnected: true }));

test("AI attempting an out-of-candidate requirementId → GUARDRAIL_REJECTED", async () => {
  const body = analysisBody({
    mappings: [
      {
        requirementId: "HAJ-FAKE-99",
        evidenceFactIds: [],
        appearsToSupportAr: "x",
        stillMissingAr: [],
        relatedVerificationTargetAr: null,
        interpretationConfidence: "LOW",
      },
    ],
  });
  const r = await analyzeEvidence(
    { extraction: extraction([pdfFact(1, "x")]), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(body, body),
  );
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "GUARDRAIL_REJECTED");
});

// -- semantics: uploaded ≠ verified, extracted ≠ compliant -------

test("a parsed/interpreted document is never VERIFIED and never asserts compliance", async () => {
  const r = await analyzeEvidence(
    { extraction: extraction([pdfFact(1, HAPPINESS_AR)]), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(analysisBody()),
  );
  assert.notEqual(r.state, "VERIFIED");
  assert.equal(r.state, "AI_INTERPRETED");
  assert.equal(r.complianceAsserted, false);
  assert.equal("complianceStatus" in r, false);
  for (const m of r.mappings) assert.equal(m.note, "EVIDENCE_ONLY_NOT_A_COMPLIANCE_DECISION");
});

// -- conflicting evidence ---------------------------------------

test("conflicting extracted facts: both preserved, conflict recorded, human review forced", async () => {
  const facts = [
    pdfFact(1, "Documented events count: 3"),
    pdfFact(2, "Documented events count: 5"),
  ];
  const body = analysisBody({
    conflicts: [
      { factIdA: "ev-1#p1", factIdB: "ev-1#p2", descriptionAr: "عدد الفعاليات يختلف بين الصفحتين (3 مقابل 5)." },
    ],
    needsHumanReview: false, // the orchestrator must still force it
  });
  const r = await analyzeEvidence(
    { extraction: extraction(facts), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(body),
  );
  assert.equal(r.conflicts.length, 1);
  assert.equal(r.needsHumanReview, true);
  // both facts still available, neither silently dropped
  assert.equal(r.facts.length, 2);
  assert.ok(r.facts.some((f) => f.factId === "ev-1#p1"));
  assert.ok(r.facts.some((f) => f.factId === "ev-1#p2"));
});

// -- failure model --------------------------------------------

test("AI unavailable → controlled result, extracted evidence preserved, no mapping", async () => {
  const r = await analyzeEvidence(
    { extraction: extraction([pdfFact(1, "x")]), candidateRequirementIds: ["HAJ-EXP-05"] },
    { client: new UnavailableAIClient("no creds") },
  );
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "AI_UNAVAILABLE");
  assert.equal(r.state, "EXTRACTED");
  assert.deepEqual(r.mappings, []);
  assert.equal(r.summaryAr, null);
  assert.equal(r.facts.length, 1);
  assert.equal(r.complianceAsserted, false);
});

test("provider error → controlled PROVIDER_ERROR, no fabricated mapping", async () => {
  const r = await analyzeEvidence(
    { extraction: extraction([pdfFact(1, "x")]), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient(new Error("boom")),
  );
  assert.equal(r.failureCode, "PROVIDER_ERROR");
  assert.equal(r.meta?.attempts, 1);
  assert.deepEqual(r.mappings, []);
});

test("malformed structured output → at most one retry → SCHEMA_VALIDATION_FAILED", async () => {
  const r = await analyzeEvidence(
    { extraction: extraction([pdfFact(1, "x")]), candidateRequirementIds: ["HAJ-EXP-05"] },
    withClient("not json", "still not json"),
  );
  assert.equal(r.failureCode, "SCHEMA_VALIDATION_FAILED");
  assert.equal(r.meta?.attempts, 2);
  assert.deepEqual(r.mappings, []);
});

test("extraction not available → EXTRACTION_UNAVAILABLE, no LLM call", async () => {
  const r = await analyzeEvidence({
    extraction: { ...extraction([]), ok: false, state: "UPLOADED" },
  });
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "EXTRACTION_UNAVAILABLE");
  assert.equal(r.meta, null);
});
