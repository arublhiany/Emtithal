// =============================================================================
// Phase 4 tests — Zod schema validity, strictness, and type parity with the
// Phase 1 canonical types in `@/lib/model/ai.ts`.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  DecisionInterpretation,
  DecisionObject,
  DecisionRecommendation,
  EvidenceAgentAnalysis,
  EvidenceAgentOutput,
  RegulatoryAgentAnswer,
  RegulatoryAgentOutput,
  ResearchAgentAnswer,
  ResearchQueryResult,
  Scenario,
  ScenarioComparisonResult,
} from "@/lib/model";
import {
  AI_OUTPUT_SCHEMAS,
  decisionInterpretationSchema,
  decisionObjectSchema,
  decisionRecommendationSchema,
  evidenceAgentAnalysisSchema,
  evidenceAgentOutputSchema,
  regulatoryAgentAnswerSchema,
  regulatoryAgentOutputSchema,
  researchAgentAnswerSchema,
  researchQueryResultSchema,
  scenarioComparisonResultSchema,
  scenarioSchema,
} from "@/lib/ai/schemas";
import type {
  DecisionInterpretationParsed,
  DecisionObjectParsed,
  DecisionRecommendationParsed,
  EvidenceAgentAnalysisParsed,
  EvidenceAgentOutputParsed,
  RegulatoryAgentAnswerParsed,
  RegulatoryAgentOutputParsed,
  ResearchAgentAnswerParsed,
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
const _din: DecisionInterpretation = {} as DecisionInterpretationParsed;
const _drc: DecisionRecommendation = {} as DecisionRecommendationParsed;
const _sce: Scenario = {} as ScenarioParsed;
const _res: ResearchQueryResult = {} as ResearchQueryResultParsed;
const _rag: ResearchAgentAnswer = {} as ResearchAgentAnswerParsed;
// ScenarioComparisonResult minus the guardrail-forbidden `affectedStatuses`.
const _cmp: Omit<ScenarioComparisonResult, "affectedStatuses"> =
  {} as ScenarioComparisonResultParsed;
void [_reg, _rga, _evi, _eva, _dec, _din, _drc, _sce, _res, _rag, _cmp];

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

test("decisionInterpretationSchema (Phase 7): valid parses; strict; constraints[]; no compliance/weight field", () => {
  const valid = {
    decisionTitleAr: "زيادة الحجاج",
    decisionSummaryAr: "رفع العدد من 4200 إلى 5200 مع بقاء القوى العاملة 180",
    requestedChanges: [{ fieldPath: "pilgrims.count", toValue: "5200", intentAr: "زيادة العدد" }],
    constraints: [
      { fieldPath: "workforce.count", expectedValue: "180", intentAr: "إبقاء عدد القوى العاملة" },
    ],
    assumptionsAr: [],
    ambiguitiesAr: [],
    missingInfoAr: [],
    interpretationConfidence: "MEDIUM" as const,
    needsHumanReview: false,
  };
  assert.equal(decisionInterpretationSchema.safeParse(valid).success, true);
  assert.equal(
    decisionInterpretationSchema.safeParse({ ...valid, complianceStatus: "COMPLIANT" }).success,
    false,
  );
  // lone-string explanatory list tolerated
  assert.equal(
    decisionInterpretationSchema.safeParse({ ...valid, assumptionsAr: "افتراض واحد" }).success,
    true,
  );
});

test("decisionRecommendationSchema (Phase 7): valid parses; strict; nullable recommendedScenarioId", () => {
  const valid = {
    recommendedScenarioId: "A" as string | null,
    recommendationAr: "ننصح بالسيناريو أ",
    tradeoffsAr: [],
    assumptionsAr: [],
    scenarioExplanations: [{ scenarioId: "A", whyChangedAr: "لم تتغير المؤشرات الحتمية" }],
    needsHumanReview: true,
  };
  assert.equal(decisionRecommendationSchema.safeParse(valid).success, true);
  assert.equal(
    decisionRecommendationSchema.safeParse({ ...valid, recommendedScenarioId: null }).success,
    true,
  );
  assert.equal(
    decisionRecommendationSchema.safeParse({ ...valid, officialWeight: 3 }).success,
    false,
  );
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

test("researchAgentAnswerSchema (Phase 8): valid parses; strict; no bibliographic/regulatory fields", () => {
  // shape-only fixture — placeholder text, asserts nothing about any real source
  const valid = {
    summaryAr: "[نص اختباري] دعم بحثي سياقي فقط",
    insights: [
      {
        researchId: "TEST-RESEARCH-ID",
        claimAr: "[نص اختباري] جملة تجريبية للتحقق من بنية المخطط.",
        relevanceAr: "[نص اختباري] صياغة تجريبية للصلة.",
        citedPassageIds: ["TEST-RESEARCH-ID#p1"],
        interpretationConfidence: "MEDIUM" as const,
      },
    ],
    noRelevantResearch: false,
    needsHumanReview: true,
  };
  assert.equal(researchAgentAnswerSchema.safeParse(valid).success, true);
  // lone-string citedPassageIds tolerated
  assert.equal(
    researchAgentAnswerSchema.safeParse({
      ...valid,
      insights: [{ ...valid.insights[0], citedPassageIds: "TEST-RESEARCH-ID#p1" }],
    }).success,
    true,
  );
  // the model may not supply any code-reattached canonical / provenance field
  for (const bad of [
    { publisherAr: "x" },
    { publicationStatus: "FINAL_REPORT" },
    { publicationYear: "2019" },
    { snapshotHash: "0".repeat(64) },
    { locator: { type: "PDF_PAGE", page: 3 } },
    { officialUrl: "https://x" },
    { sourceKind: "OFFICIAL_WEB_PAGE" },
    { complianceStatus: "COMPLIANT" },
    { officialWeight: 3 },
  ]) {
    assert.equal(researchAgentAnswerSchema.safeParse({ ...valid, ...bad }).success, false);
  }
});

test("the schema registry exposes every canonical agent output schema", () => {
  assert.deepEqual(Object.keys(AI_OUTPUT_SCHEMAS).sort(), [
    "decisionInterpretation",
    "decisionObject",
    "decisionRecommendation",
    "evidenceAgentAnalysis",
    "evidenceAgentOutput",
    "regulatoryAgentAnswer",
    "regulatoryAgentOutput",
    "researchAgentAnswer",
    "researchQueryResult",
    "scenario",
    "scenarioComparisonResult",
  ]);
});
