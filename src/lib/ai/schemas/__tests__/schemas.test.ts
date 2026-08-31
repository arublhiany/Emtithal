// =============================================================================
// Phase 4 tests — Zod schema validity, strictness, and type parity with the
// Phase 1 canonical types in `@/lib/model/ai.ts`.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  DecisionObject,
  EvidenceAgentAnalysis,
  EvidenceAgentOutput,
  RegulatoryAgentAnswer,
  RegulatoryAgentOutput,
  ResearchQueryResult,
  Scenario,
  ScenarioComparisonResult,
} from "@/lib/model";
import {
  AI_OUTPUT_SCHEMAS,
  decisionObjectSchema,
  evidenceAgentAnalysisSchema,
  evidenceAgentOutputSchema,
  regulatoryAgentAnswerSchema,
  regulatoryAgentOutputSchema,
  researchQueryResultSchema,
  scenarioComparisonResultSchema,
  scenarioSchema,
} from "@/lib/ai/schemas";
import type {
  DecisionObjectParsed,
  EvidenceAgentAnalysisParsed,
  EvidenceAgentOutputParsed,
  RegulatoryAgentAnswerParsed,
  RegulatoryAgentOutputParsed,
  ResearchQueryResultParsed,
  ScenarioComparisonResultParsed,
  ScenarioParsed,
} from "@/lib/ai/schemas";

// -- compile-time type parity ------------------------------------------------
// Each parsed type must be assignable to its Phase 1 canonical type.
const _reg: RegulatoryAgentOutput = {} as RegulatoryAgentOutputParsed;
const _rga: RegulatoryAgentAnswer = {} as RegulatoryAgentAnswerParsed;
const _evi: EvidenceAgentOutput = {} as EvidenceAgentOutputParsed;
const _eva: EvidenceAgentAnalysis = {} as EvidenceAgentAnalysisParsed;
const _dec: DecisionObject = {} as DecisionObjectParsed;
const _sce: Scenario = {} as ScenarioParsed;
const _res: ResearchQueryResult = {} as ResearchQueryResultParsed;
// ScenarioComparisonResult minus the guardrail-forbidden `affectedStatuses`.
const _cmp: Omit<ScenarioComparisonResult, "affectedStatuses"> =
  {} as ScenarioComparisonResultParsed;
void [_reg, _rga, _evi, _eva, _dec, _sce, _res, _cmp];

// -- runtime validity + strictness ----------------------------------------

test("regulatoryAgentOutputSchema: valid parses; unknown keys rejected", () => {
  const valid = {
    requirementIds: ["HAJ-EXP-01"],
    authorityId: "MOHU" as string | null,
    reason: "r",
    sources: [],
    confidence: "HIGH" as const,
    unresolved: [],
  };
  assert.equal(regulatoryAgentOutputSchema.safeParse(valid).success, true);
  assert.equal(regulatoryAgentOutputSchema.safeParse({ ...valid, complianceStatus: "COMPLIANT" }).success, false);
});

test("regulatoryAgentAnswerSchema (Phase 5): valid parses; no confidence field; unknown keys rejected", () => {
  const valid = {
    answerAr: "شرح موجز",
    requirementIds: ["HAJ-EXP-05"],
    authorityId: "MOHU" as string | null,
    missingInformation: [],
    applicabilityExplanationAr: null as string | null,
  };
  assert.equal(regulatoryAgentAnswerSchema.safeParse(valid).success, true);
  // confidence is deterministic + code-owned — the model may not supply one
  assert.equal(
    regulatoryAgentAnswerSchema.safeParse({ ...valid, confidence: "HIGH" }).success,
    false,
  );
  assert.equal(
    regulatoryAgentAnswerSchema.safeParse({ ...valid, complianceStatus: "COMPLIANT" }).success,
    false,
  );
  assert.equal(
    regulatoryAgentAnswerSchema.safeParse({ ...valid, officialWeight: 20 }).success,
    false,
  );
});

test("regulatoryAgentAnswerSchema (Phase 5): only harmless explanatory-list shape variance is tolerated", () => {
  const base = {
    answerAr: "شرح",
    requirementIds: ["HAJ-EXP-05"],
    authorityId: null as string | null,
    applicabilityExplanationAr: null as string | null,
  };
  // missingInformation as a lone string → one-element array (explanatory list only)
  const p1 = regulatoryAgentAnswerSchema.safeParse({
    ...base,
    missingInformation: "النص الكامل للمتطلب",
  });
  assert.equal(
    p1.success && JSON.stringify(p1.data.missingInformation),
    JSON.stringify(["النص الكامل للمتطلب"]),
  );
  // null missingInformation → []
  const p2 = regulatoryAgentAnswerSchema.safeParse({ ...base, missingInformation: null });
  assert.equal(p2.success && JSON.stringify(p2.data.missingInformation), "[]");
  // a number is NOT coerced into meaning — still rejected
  assert.equal(
    regulatoryAgentAnswerSchema.safeParse({ ...base, missingInformation: 3 }).success,
    false,
  );
});

test("evidenceAgentOutputSchema: valid parses; strict", () => {
  const valid = {
    facts: [{ field: "busCount", value: 45, evidenceReference: "page 3", confidence: "HIGH" as const }],
    missingFields: [],
    contradictions: [],
    confidence: "MEDIUM" as const,
  };
  assert.equal(evidenceAgentOutputSchema.safeParse(valid).success, true);
  assert.equal(evidenceAgentOutputSchema.safeParse({ ...valid, extra: 1 }).success, false);
});

test("evidenceAgentAnalysisSchema (Phase 6): valid parses; no compliance field; strict", () => {
  const valid = {
    summaryAr: "ملخص",
    mappings: [
      {
        requirementId: "HAJ-EXP-05",
        evidenceFactIds: ["ev-1#p1"],
        appearsToSupportAr: "يبدو داعمًا",
        stillMissingAr: [],
        relatedVerificationTargetAr: null as string | null,
        interpretationConfidence: "MEDIUM" as const,
      },
    ],
    conflicts: [],
    unmappedFactIds: [],
    needsHumanReview: false,
  };
  assert.equal(evidenceAgentAnalysisSchema.safeParse(valid).success, true);
  // a lone-string explanatory list is tolerated
  assert.equal(
    evidenceAgentAnalysisSchema.safeParse({
      ...valid,
      mappings: [{ ...valid.mappings[0], stillMissingAr: "التقرير النهائي" }],
    }).success,
    true,
  );
  // forbidden compliance / weight fields are rejected (strict)
  assert.equal(
    evidenceAgentAnalysisSchema.safeParse({ ...valid, complianceStatus: "COMPLIANT" }).success,
    false,
  );
  assert.equal(
    evidenceAgentAnalysisSchema.safeParse({
      ...valid,
      mappings: [{ ...valid.mappings[0], officialWeight: 3 }],
    }).success,
    false,
  );
});

test("decisionObjectSchema: valid parses (value/unit nullable); strict", () => {
  const valid = {
    decisionType: "TRANSPORT_CAPACITY_CHANGE",
    action: "INCREASE",
    value: 15 as number | null,
    unit: "PERCENT" as string | null,
    domain: "TRANSPORT",
    confidence: "HIGH" as const,
  };
  assert.equal(decisionObjectSchema.safeParse(valid).success, true);
  assert.equal(decisionObjectSchema.safeParse({ ...valid, value: null, unit: null }).success, true);
});

test("scenarioComparisonResultSchema: valid parses; `affectedStatuses` is rejected (omitted + strict)", () => {
  const scenario = {
    scenarioId: "A",
    titleAr: "أ",
    descriptionAr: "وصف",
    changes: [],
    assumptions: [],
    affectedRequirements: ["HAJ-EXP-01"],
    operationalEffects: [],
    regulatoryEffects: [],
    researchInsights: [],
    confidence: "MEDIUM" as const,
    dataUsed: [],
    sources: [],
    unresolved: [],
  };
  assert.equal(scenarioSchema.safeParse(scenario).success, true);
  const valid = {
    decision: {
      decisionType: "X",
      action: "Y",
      value: null,
      unit: null,
      domain: "D",
      confidence: "LOW" as const,
    },
    currentReadiness: 64 as number | null,
    scenarios: [scenario],
    recommendedScenarioId: "A" as string | null,
  };
  assert.equal(scenarioComparisonResultSchema.safeParse(valid).success, true);
  assert.equal(
    scenarioComparisonResultSchema.safeParse({ ...valid, affectedStatuses: {} }).success,
    false,
  );
});

test("researchQueryResultSchema: CORPUS_PENDING must have no studies", () => {
  const study = { title: "t", year: "2020", source: "s", summary: "sum", operationalInsight: "op" };
  assert.equal(
    researchQueryResultSchema.safeParse({
      corpusState: "CORPUS_LOADED",
      query: "q",
      studies: [study],
      confidence: "HIGH",
    }).success,
    true,
  );
  assert.equal(
    researchQueryResultSchema.safeParse({
      corpusState: "CORPUS_PENDING",
      query: "q",
      studies: [study],
      confidence: "HIGH",
    }).success,
    false,
  );
  assert.equal(
    researchQueryResultSchema.safeParse({
      corpusState: "CORPUS_PENDING",
      query: "q",
      studies: [],
      confidence: "LOW",
    }).success,
    true,
  );
});

test("the schema registry exposes every canonical agent output schema", () => {
  assert.deepEqual(Object.keys(AI_OUTPUT_SCHEMAS).sort(), [
    "decisionObject",
    "evidenceAgentAnalysis",
    "evidenceAgentOutput",
    "regulatoryAgentAnswer",
    "regulatoryAgentOutput",
    "researchQueryResult",
    "scenario",
    "scenarioComparisonResult",
  ]);
});
