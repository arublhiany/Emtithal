// =============================================================================
// Phase 9 tests — Emtithal AI Orchestrator: routing→execution, authority,
// failure isolation, provenance, human-review aggregation, immutability,
// efficiency. NO real AI call — a per-purpose fake client is injected.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { runOrchestration } from "@/lib/orchestrator";
import { getRegulatoryRequirements } from "@/lib/data/regulatory";
import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
import { DEMO_VERIFICATION_INPUTS } from "@/lib/data/demo/verificationInputs";
import { verifyAll } from "@/lib/engine/verificationEngine";
import { getResearchCorpus, WEB_SOURCE_SIMULATION_UNIT } from "@/lib/research";
import type { ExtractedEvidenceFact } from "@/lib/evidence/types";

import {
  fakeClientByPurpose,
  unavailableClient,
  REG_BODY_SAFE,
  REG_BODY_APPLICABILITY_CONTRADICTION,
  RESEARCH_BODY_SAFE,
  DECISION_INTERPRET_BODY,
  DECISION_RECOMMEND_BODY,
  DECISION_RECOMMEND_VERDICT_BODY,
} from "./helpers";

const WRID = WEB_SOURCE_SIMULATION_UNIT.researchId;
const WP1 = WEB_SOURCE_SIMULATION_UNIT.passages[0].passageId;

const COMBINED_Q =
  "اشرح متطلب توثيق فعاليات ومبادرات فريق السعادة، وهل توجد دلالة بحثية عامة تدعم استخدام النمذجة والمحاكاة عند تقييم البدائل التشغيلية؟";
const RESEARCH_Q =
  "هل يدعم المصدر الرسمي للمعهد استخدام النمذجة والمحاكاة لتقييم البدائل ودعم اتخاذ القرار؟";
const DECISION_Q = "إذا زدنا عدد الحجاج، قارن السيناريوهات";

const combinedClient = () =>
  fakeClientByPurpose({
    "regulatory-agent": REG_BODY_SAFE,
    "research-agent": RESEARCH_BODY_SAFE(WRID, WP1),
  });

// -- routing → execution --------------------------------------------------

test("UNSUPPORTED request invokes no capability and no AI call", async () => {
  const client = fakeClientByPurpose({});
  const r = await runOrchestration({ textAr: "كم الساعة الآن في مكة؟" }, { client });
  assert.equal(r.intent, "UNSUPPORTED");
  assert.equal(r.failureCode, "UNSUPPORTED_REQUEST");
  assert.deepEqual(r.capabilitiesUsed, []);
  assert.deepEqual(client.calls, []);
  assert.equal(r.meta.aiCallsMade, 0);
});

test("COMBINED_ANALYSIS runs regulation + research only, research strictly last", async () => {
  const client = combinedClient();
  const r = await runOrchestration({ textAr: COMBINED_Q }, { client });
  assert.equal(r.intent, "COMBINED_ANALYSIS");
  // only the two requested AI capabilities were called, regulation before research
  assert.deepEqual(client.calls, ["regulatory-agent", "research-agent"]);
  assert.equal(r.regulatoryResult?.ok, true);
  assert.equal(r.researchResult?.ok, true);
  // no evidence / decision capability ran
  assert.equal(r.evidenceResult, null);
  assert.equal(r.decisionResults, null);
  assert.equal(
    r.capabilitiesUsed.some((c) => c.capability === "EVIDENCE_INTELLIGENCE"),
    false,
  );
});

test("a deterministic-only decision query still calls Gemini only for interpret+recommend", async () => {
  const client = fakeClientByPurpose({
    "decision-agent-interpret": DECISION_INTERPRET_BODY,
    "decision-agent-recommend": DECISION_RECOMMEND_BODY,
  });
  const r = await runOrchestration({ textAr: DECISION_Q }, { client });
  assert.equal(r.intent, "DECISION_INTELLIGENCE");
  assert.deepEqual(client.calls, ["decision-agent-interpret", "decision-agent-recommend"]);
  assert.equal(r.decisionResults?.ok, true);
  assert.ok((r.decisionResults?.scenarios.length ?? 0) >= 1);
  // regulation / evidence / research never touched
  assert.equal(r.regulatoryResult, null);
  assert.equal(r.researchResult, null);
});

// -- authority hierarchy -----------------------------------------------

test("AI cannot override the deterministic applicability outcome", async () => {
  const client = fakeClientByPurpose({
    "regulatory-agent": REG_BODY_APPLICABILITY_CONTRADICTION,
    "research-agent": RESEARCH_BODY_SAFE(WRID, WP1),
  });
  const r = await runOrchestration({ textAr: COMBINED_Q }, { client });
  const app = r.deterministicResults.applicability;
  assert.equal(app?.requirementId, "HAJ-EXP-05");
  assert.equal(app?.outcome, "APPLICABLE"); // engine, not the model
  // the child replaced the contradictory prose with the canonical statement
  assert.match(
    r.regulatoryResult?.applicabilityExplanationAr ?? "",
    /المتطلب منطبق على ملف الشركة/,
  );
  assert.doesNotMatch(r.regulatoryResult?.answerAr ?? "", /غير منطبق/);
});

test("AI cannot inject a compliance verdict — decision recommendation is rejected, scenarios survive", async () => {
  const client = fakeClientByPurpose({
    "decision-agent-interpret": DECISION_INTERPRET_BODY,
    "decision-agent-recommend": DECISION_RECOMMEND_VERDICT_BODY,
  });
  const r = await runOrchestration({ textAr: DECISION_Q }, { client });
  assert.equal(r.decisionResults?.ok, true);
  assert.equal(r.decisionResults?.recommendation.available, false);
  assert.equal(r.decisionResults?.recommendation.failureCode, "GUARDRAIL_REJECTED");
  // deterministic scenarios + diffs are RETAINED
  assert.ok((r.decisionResults?.scenarios.length ?? 0) >= 1);
  assert.equal(r.decisionResults?.officialScoreComputed, false);
  assert.equal(r.needsHumanReviewReasons.includes("decision-recommendation-guardrail-rejected"), true);
});

test("an EXPLICIT readiness request runs DETERMINISTIC_VERIFICATION; its snapshot equals an independent engine run", async () => {
  // no AI capability needed — a pure deterministic readiness view
  const client = fakeClientByPurpose({});
  const r = await runOrchestration({ textAr: "اعرض مؤشر جاهزية سبّاق ونسبة التحقق والعوائق الحرجة للشركة" }, { client });
  assert.equal(r.intent, "COMBINED_ANALYSIS");
  assert.deepEqual(client.calls, []); // deterministic only — no LLM
  const run = verifyAll(getRegulatoryRequirements(), DEMO_COMPANY_PROFILE, DEMO_VERIFICATION_INPUTS);
  const v = r.deterministicResults.verification!;
  assert.ok(v);
  assert.equal(v.readiness.value, run.readiness.value);
  assert.equal(v.coverage.value, run.coverage.value);
  assert.deepEqual(v.criticalBlockerIds, run.criticalBlockers.map((b) => b.requirementId));
  assert.deepEqual(v.regulatoryPendingIds, [...run.regulatoryPendingIds]);
  assert.deepEqual(v.applicabilityPendingIds, [...run.applicabilityPendingIds]);
  assert.equal(v.officialScoreComputed, false);
});

test("a narrow regulatory+research request does NOT run DETERMINISTIC_VERIFICATION", async () => {
  const client = combinedClient();
  const r = await runOrchestration({ textAr: COMBINED_Q }, { client });
  assert.equal(r.deterministicResults.verification, null);
  assert.equal(
    r.capabilitiesUsed.some((c) => c.capability === "DETERMINISTIC_VERIFICATION"),
    false,
  );
  // deterministic applicability for the requested requirement still runs
  assert.equal(r.deterministicResults.applicability?.requirementId, "HAJ-EXP-05");
});

test("research runs last and never changes the regulatory result", async () => {
  const client = combinedClient();
  const r = await runOrchestration({ textAr: COMBINED_Q }, { client });
  // regulatory answer references only the canonical requirement; research is a
  // separate section that adds no requirement id to the regulatory result.
  assert.deepEqual(r.regulatoryResult?.requirementIds, ["HAJ-EXP-05"]);
  assert.equal(
    r.researchInsights.every((i) => i.capability === "RESEARCH_INTELLIGENCE"),
    true,
  );
  assert.equal(client.calls.indexOf("research-agent") > client.calls.indexOf("regulatory-agent"), true);
});

test("an UNRESOLVED_REQUIREMENT stays unresolved through orchestration", async () => {
  const client = fakeClientByPurpose({ "regulatory-agent": { ...REG_BODY_SAFE, requirementIds: ["HAJ-PROVIDERS-01"] } });
  // HAJ-PROVIDERS-01 is regulatorily UNRESOLVED
  const r = await runOrchestration({ textAr: "اشرح المتطلب HAJ-PROVIDERS-01" }, { client });
  assert.equal(r.regulatoryResult?.regulatoryState, "UNRESOLVED_REQUIREMENT");
  // the deterministic applicability view carries the unresolved resolution through, never resolving it
  assert.equal(
    r.deterministicResults.applicability?.regulatoryResolution,
    "UNRESOLVED_REQUIREMENT",
  );
  // request-scoped review reason — about THIS requirement, not a company-wide leak
  assert.equal(r.needsHumanReviewReasons.includes("unresolved-requirement"), true);
  // no company-wide verification snapshot for this narrow request
  assert.equal(r.deterministicResults.verification, null);
});

// -- failure isolation -----------------------------------------------

test("regulatory provider unavailable → failure reason only, NO phantom interpretation-review; deterministic applicability survives", async () => {
  const r = await runOrchestration({ textAr: COMBINED_Q }, { client: unavailableClient() });
  assert.equal(r.regulatoryResult?.ok, false);
  assert.equal(r.regulatoryResult?.failureCode, "AI_UNAVAILABLE");
  // deterministic applicability for the requested requirement survives the AI outage
  assert.equal(r.deterministicResults.applicability?.outcome, "APPLICABLE");
  assert.equal(
    r.capabilitiesUsed.some((c) => c.capability === "REGULATORY_INTELLIGENCE" && c.status === "UNAVAILABLE"),
    true,
  );
  assert.equal(r.needsHumanReviewReasons.includes("requested-regulatory-capability-failed"), true);
  assert.equal(r.needsHumanReviewReasons.includes("regulatory-interpretation-review"), false);
});

test("research provider unavailable → failure reason only, NO phantom research-interpretation-review", async () => {
  const r = await runOrchestration({ textAr: RESEARCH_Q }, { client: unavailableClient() });
  assert.equal(r.researchResult?.ok, false);
  assert.equal(r.needsHumanReviewReasons.includes("requested-research-capability-failed"), true);
  assert.equal(r.needsHumanReviewReasons.includes("research-interpretation-review"), false);
  assert.equal(r.needsHumanReviewReasons.includes("provisional-research-source"), false);
});

test("evidence provider unavailable → failure reason only, NO phantom evidence-interpretation-review, no fabricated mapping", async () => {
  const facts: ExtractedEvidenceFact[] = [
    {
      factId: "F1",
      text: "توثيق فعاليات ومبادرات فريق السعادة",
      extractionMethod: "PDF_TEXT",
      sourceLocator: { kind: "PDF_PAGE", page: 1 },
    } as ExtractedEvidenceFact,
  ];
  const r = await runOrchestration(
    {
      textAr: "وش يثبت هذا الملف المرفوع؟",
      evidenceExtraction: {
        ok: true,
        state: "EXTRACTED",
        evidenceId: "EV3",
        companyId: DEMO_COMPANY_PROFILE.companyId,
        fileName: "x.pdf",
        facts,
      },
    },
    { client: unavailableClient() },
  );
  assert.equal(r.evidenceResult?.ok, false);
  assert.deepEqual(r.evidenceResult?.mappings, []);
  assert.deepEqual(r.evidenceInsights, []);
  assert.equal(r.needsHumanReviewReasons.includes("requested-evidence-capability-failed"), true);
  assert.equal(r.needsHumanReviewReasons.includes("evidence-interpretation-review"), false);
});

test("a SUCCESSFUL LOW-confidence surfaced interpretation DOES add the interpretation-review reason", async () => {
  const base = RESEARCH_BODY_SAFE(WRID, WP1);
  const lowBody = {
    ...base,
    insights: [{ ...base.insights[0], interpretationConfidence: "LOW" as const }],
  };
  const client = fakeClientByPurpose({ "research-agent": lowBody });
  const r = await runOrchestration({ textAr: RESEARCH_Q }, { client });
  assert.equal(r.researchResult?.ok, true);
  assert.equal(r.researchResult?.insights[0].interpretationConfidence, "LOW");
  assert.equal(r.needsHumanReviewReasons.includes("research-interpretation-review"), true);
  // SOURCE A is still not provisional
  assert.equal(r.needsHumanReviewReasons.includes("provisional-research-source"), false);
});

test("AI unavailable on an EXPLICIT readiness request → the deterministic snapshot still returns", async () => {
  const r = await runOrchestration(
    { textAr: "اشرح المتطلب HAJ-EXP-05 واعرض مؤشر الجاهزية ونسبة التحقق" },
    { client: unavailableClient() },
  );
  assert.ok(r.deterministicResults.verification);
  assert.equal(
    r.capabilitiesUsed.some((c) => c.capability === "DETERMINISTIC_VERIFICATION" && c.status === "SUCCESS"),
    true,
  );
  assert.equal(r.regulatoryResult?.failureCode, "AI_UNAVAILABLE");
});

test("research NO-match does not fail the whole result", async () => {
  const client = fakeClientByPurpose({ "regulatory-agent": REG_BODY_SAFE }); // no research-agent fixture
  const r = await runOrchestration(
    { textAr: "اشرح المتطلب HAJ-EXP-05 وهل يوجد دعم بحثي عن ترخيص وكالات السفر الخارجي؟" },
    { client },
  );
  // regulation succeeded; research found nothing relevant and did not call the LLM
  assert.equal(r.regulatoryResult?.ok, true);
  const research = r.capabilitiesUsed.find((c) => c.capability === "RESEARCH_INTELLIGENCE");
  assert.equal(research?.status, "NO_RELEVANT_DATA");
  assert.deepEqual(r.researchInsights, []);
  assert.equal(client.calls.includes("research-agent"), false); // no LLM call for a no-match
});

test("malformed AI output stays a controlled FAILED_SAFE, deterministic parts intact", async () => {
  const client = fakeClientByPurpose({
    "regulatory-agent": { __fail: "SCHEMA_VALIDATION_FAILED" },
  });
  const r = await runOrchestration({ textAr: "اشرح المتطلب HAJ-EXP-05" }, { client });
  assert.equal(r.regulatoryResult?.ok, false);
  assert.equal(r.regulatoryResult?.failureCode, "SCHEMA_VALIDATION_FAILED");
  assert.equal(
    r.capabilitiesUsed.find((c) => c.capability === "REGULATORY_INTELLIGENCE")?.status,
    "FAILED_SAFE",
  );
  assert.equal(r.deterministicResults.applicability?.outcome, "APPLICABLE");
});

test("evidence failure fabricates no mapping", async () => {
  const facts: ExtractedEvidenceFact[] = [
    {
      factId: "F1",
      text: "توثيق فعاليات ومبادرات فريق السعادة خلال الموسم",
      extractionMethod: "PDF_TEXT",
      sourceLocator: { kind: "PDF_PAGE", page: 1 },
    } as ExtractedEvidenceFact,
  ];
  const client = fakeClientByPurpose({
    "regulatory-agent": REG_BODY_SAFE,
    "evidence-agent": { __fail: "PROVIDER_ERROR" },
  });
  const r = await runOrchestration(
    {
      textAr: "اربط هذا الدليل بالمتطلب واشرح المتطلب",
      evidenceExtraction: {
        ok: true,
        state: "EXTRACTED",
        evidenceId: "EV1",
        companyId: DEMO_COMPANY_PROFILE.companyId,
        fileName: "happiness.pdf",
        facts,
      },
    },
    { client },
  );
  assert.equal(r.evidenceResult?.ok, false);
  assert.deepEqual(r.evidenceResult?.mappings, []);
  assert.deepEqual(r.evidenceInsights, []);
  assert.equal(r.evidenceResult?.complianceAsserted, false);
});

// -- provenance ----------------------------------------------------

test("provenance is reattached from child results (canonical), never synthesised", async () => {
  const client = combinedClient();
  const r = await runOrchestration({ textAr: COMBINED_Q }, { client });
  // regulatory lineage from canonical requirement data
  assert.ok(r.provenance.regulatory && r.provenance.regulatory.length >= 1);
  assert.equal(r.provenance.regulatory![0].requirementId, "HAJ-EXP-05");
  // research provenance: canonical id + WEB_SECTION locator + snapshot hash, no page
  assert.deepEqual(r.provenance.research?.researchIds, [WRID]);
  assert.deepEqual(r.provenance.research?.sourceKinds, ["OFFICIAL_WEB_PAGE"]);
  assert.equal(r.provenance.research?.snapshotHashes[0], WEB_SOURCE_SIMULATION_UNIT.snapshotHash);
  assert.equal(r.provenance.research?.locators[0].type, "WEB_SECTION");
  assert.equal("page" in r.provenance.research!.locators[0], false);
  // AI provenance is safe metadata only
  assert.equal(r.provenance.ai.every((m) => typeof m.requestId === "string" && !("system" in m)), true);
});

test("decision provenance carries scenario ids + deterministic requirement lineage", async () => {
  const client = fakeClientByPurpose({
    "decision-agent-interpret": DECISION_INTERPRET_BODY,
    "decision-agent-recommend": DECISION_RECOMMEND_BODY,
  });
  const r = await runOrchestration({ textAr: DECISION_Q }, { client });
  assert.ok(r.provenance.decision);
  assert.ok(r.provenance.decision!.scenarioIds.length >= 1);
});

// -- human-review aggregation ------------------------------------

test("needsHumanReview is request-scoped — a narrow regulatory+research query leaks NO company-wide reason", async () => {
  const client = combinedClient();
  const r = await runOrchestration({ textAr: COMBINED_Q }, { client });
  assert.equal(r.needsHumanReview, r.needsHumanReviewReasons.length > 0);
  // HAJ-EXP-05 is SPECIFIED / VERIFIED_COMPLETE locator / APPLICABLE → HIGH, no review;
  // research SOURCE A is OFFICIAL_WEB_PAGE / OTHER_APPROVED / MEDIUM → no review.
  for (const leaked of [
    "critical-blocker-present",
    "pending-verification",
    "regulatory-pending-requirement",
    "ambiguous-applicability",
    "provisional-research-source",
    "research-interpretation-review",
  ]) {
    assert.equal(r.needsHumanReviewReasons.includes(leaked), false, `leaked: ${leaked}`);
  }
  assert.deepEqual(r.needsHumanReviewReasons, []);
  assert.equal(r.needsHumanReview, false);
});

test("an EXPLICIT company-wide readiness request DOES surface company-wide review reasons", async () => {
  const client = fakeClientByPurpose({});
  const r = await runOrchestration({ textAr: "ما وضع الشركة كامل؟ اعرض الجاهزية والعوائق الحرجة وفجوات التحقق" }, { client });
  // now the demo company's company-wide deterministic conditions are in scope
  assert.equal(r.needsHumanReviewReasons.includes("critical-blocker-present"), true);
  assert.equal(r.needsHumanReviewReasons.includes("pending-verification"), true);
  assert.equal(r.needsHumanReviewReasons.includes("regulatory-pending-requirement"), true);
  assert.equal(r.needsHumanReview, true);
});

test("SOURCE B (OFFICIAL_STUDY_PAGE) → provisional-research-source IS present", async () => {
  const bId = "UQU-HAJJ-1447-BRT-SIMULATION-STUDY";
  const bP1 = `${bId}#web-1`;
  const client = fakeClientByPurpose({ "research-agent": RESEARCH_BODY_SAFE(bId, bP1) });
  const r = await runOrchestration(
    { textAr: "هل يوجد دعم بحثي عن كفاءة نظام الحافلات السريعة BRT؟" },
    { client },
  );
  assert.equal(r.intent, "RESEARCH_INTELLIGENCE");
  assert.equal(r.researchResult?.ok, true);
  assert.equal(r.researchResult?.insights[0].researchId, bId);
  assert.equal(r.researchResult?.insights[0].sourceKind, "OFFICIAL_STUDY_PAGE");
  assert.equal(r.needsHumanReviewReasons.includes("provisional-research-source"), true);
  assert.equal(r.needsHumanReview, true);
});

test("a clean research-only result (SOURCE A, MEDIUM) does not force human review", async () => {
  const client = fakeClientByPurpose({ "research-agent": RESEARCH_BODY_SAFE(WRID, WP1) });
  const r = await runOrchestration({ textAr: RESEARCH_Q }, { client });
  assert.equal(r.needsHumanReviewReasons.includes("provisional-research-source"), false);
  assert.equal(r.needsHumanReviewReasons.includes("research-interpretation-review"), false);
  assert.equal(r.intent, "RESEARCH_INTELLIGENCE");
  assert.equal(r.researchResult?.ok, true);
  assert.equal(r.researchResult?.retrievalOutcome, "MATCH");
  // OFFICIAL_WEB_PAGE / OTHER_APPROVED / MEDIUM confidence → no forced review
  assert.deepEqual(r.needsHumanReviewReasons, []);
  assert.equal(r.needsHumanReview, false);
});

// -- request-scoped execution plan -----------------------------

test("evidence-only (attached extraction) → EVIDENCE only: no regulatory LLM, no company-wide verification", async () => {
  const facts: ExtractedEvidenceFact[] = [
    {
      factId: "F1",
      text: "توثيق فعاليات ومبادرات فريق السعادة خلال الموسم مع صور ومؤشرات",
      extractionMethod: "PDF_TEXT",
      sourceLocator: { kind: "PDF_PAGE", page: 2 },
    } as ExtractedEvidenceFact,
  ];
  const client = fakeClientByPurpose({
    "evidence-agent": {
      summaryAr: "يبدو أن الدليل يوثق فعاليات فريق السعادة؛ يحتاج تحققًا إضافيًا.",
      mappings: [
        {
          requirementId: "HAJ-EXP-05",
          evidenceFactIds: ["F1"],
          appearsToSupportAr: "يبدو أن الدليل يوثق تنفيذ فعاليات فريق السعادة.",
          stillMissingAr: ["سجل تفصيلي بالتواريخ"],
          relatedVerificationTargetAr: null,
          interpretationConfidence: "MEDIUM",
        },
      ],
      conflicts: [],
      unmappedFactIds: [],
      needsHumanReview: false,
    },
    // present but MUST NOT be called for an evidence-only request:
    "regulatory-agent": REG_BODY_SAFE,
  });
  const r = await runOrchestration(
    {
      textAr: "وش يثبت هذا الملف المرفوع؟",
      evidenceExtraction: {
        ok: true,
        state: "EXTRACTED",
        evidenceId: "EV2",
        companyId: DEMO_COMPANY_PROFILE.companyId,
        fileName: "happiness.pdf",
        facts,
      },
    },
    { client },
  );
  assert.equal(r.intent, "EVIDENCE_INTELLIGENCE");
  assert.deepEqual(client.calls, ["evidence-agent"]); // no regulatory LLM to "make evidence work"
  assert.equal(r.regulatoryResult, null);
  assert.equal(r.deterministicResults.verification, null); // no company-wide snapshot
  assert.equal(r.evidenceResult?.state, "AI_INTERPRETED");
  assert.equal(r.evidenceResult?.complianceAsserted, false);
});

test("decision query executes only the Phase 7 decision path (its own internal deterministic engine)", async () => {
  const client = fakeClientByPurpose({
    "decision-agent-interpret": DECISION_INTERPRET_BODY,
    "decision-agent-recommend": DECISION_RECOMMEND_BODY,
  });
  const r = await runOrchestration({ textAr: DECISION_Q }, { client });
  assert.equal(r.intent, "DECISION_INTELLIGENCE");
  assert.equal(r.deterministicResults.verification, null); // no separate company-wide snapshot
  assert.ok(r.decisionResults?.current); // Phase 7 deterministic CURRENT is present
  assert.ok((r.decisionResults?.scenarios.length ?? 0) >= 1);
  assert.deepEqual(client.calls, ["decision-agent-interpret", "decision-agent-recommend"]);
});

test("'تحقق من هذا الملف' + attached extraction → EVIDENCE path, NO company-wide verification", async () => {
  const facts: ExtractedEvidenceFact[] = [
    {
      factId: "F1",
      text: "توثيق فعاليات ومبادرات فريق السعادة",
      extractionMethod: "PDF_TEXT",
      sourceLocator: { kind: "PDF_PAGE", page: 1 },
    } as ExtractedEvidenceFact,
  ];
  const ext = {
    ok: true,
    state: "EXTRACTED",
    evidenceId: "EV4",
    companyId: DEMO_COMPANY_PROFILE.companyId,
    fileName: "x.pdf",
    facts,
  };
  const evBody = {
    summaryAr: "يبدو أن الدليل يوثق فعاليات فريق السعادة؛ يحتاج تحققًا إضافيًا.",
    mappings: [],
    conflicts: [],
    unmappedFactIds: ["F1"],
    needsHumanReview: false,
  };
  for (const textAr of ["تحقق من هذا الملف", "هل تم التحقق من هذا الدليل؟"]) {
    const client = fakeClientByPurpose({ "evidence-agent": evBody });
    const r = await runOrchestration({ textAr, evidenceExtraction: ext }, { client });
    assert.equal(r.intent, "EVIDENCE_INTELLIGENCE", textAr);
    assert.equal(r.deterministicResults.verification, null, textAr);
    assert.equal(
      r.capabilitiesUsed.some((c) => c.capability === "DETERMINISTIC_VERIFICATION"),
      false,
      textAr,
    );
  }
});

test("'اعرض نسبة التحقق ومؤشر الجاهزية للشركة' → DETERMINISTIC_VERIFICATION only", async () => {
  const client = fakeClientByPurpose({});
  const r = await runOrchestration({ textAr: "اعرض نسبة التحقق ومؤشر الجاهزية للشركة" }, { client });
  assert.equal(r.intent, "COMBINED_ANALYSIS");
  assert.deepEqual(client.calls, []);
  assert.ok(r.deterministicResults.verification);
  assert.deepEqual(
    r.capabilitiesUsed.map((c) => c.capability),
    ["DETERMINISTIC_VERIFICATION"],
  );
  // no separate single-requirement applicability view for a company-wide readiness output
  assert.equal(r.deterministicResults.applicability, null);
});

test("UNSUPPORTED query invokes no engine and no agent", async () => {
  const client = fakeClientByPurpose({ "regulatory-agent": REG_BODY_SAFE });
  const r = await runOrchestration({ textAr: "ما هو الطقس اليوم في جدة؟" }, { client });
  assert.equal(r.intent, "UNSUPPORTED");
  assert.deepEqual(client.calls, []);
  assert.equal(r.deterministicResults.verification, null);
  assert.equal(r.deterministicResults.applicability, null);
  assert.equal(r.deterministicResults.scenario, null);
});

// -- immutability -----------------------------------------------

test("orchestration mutates none of its canonical inputs", async () => {
  const profileSnap = JSON.stringify(DEMO_COMPANY_PROFILE);
  const inputsSnap = JSON.stringify(DEMO_VERIFICATION_INPUTS);
  const corpusSnap = JSON.stringify(getResearchCorpus());
  const reqSnap = JSON.stringify(getRegulatoryRequirements());

  const client = fakeClientByPurpose({
    "regulatory-agent": REG_BODY_SAFE,
    "research-agent": RESEARCH_BODY_SAFE(WRID, WP1),
    "decision-agent-interpret": DECISION_INTERPRET_BODY,
    "decision-agent-recommend": DECISION_RECOMMEND_BODY,
  });
  await runOrchestration(
    { textAr: "اشرح المتطلب HAJ-EXP-05، وإذا زدنا عدد الحجاج قارن السيناريوهات، وهل يوجد دعم بحثي للنمذجة والمحاكاة؟" },
    { client },
  );

  assert.equal(JSON.stringify(DEMO_COMPANY_PROFILE), profileSnap);
  assert.equal(JSON.stringify(DEMO_VERIFICATION_INPUTS), inputsSnap);
  assert.equal(JSON.stringify(getResearchCorpus()), corpusSnap);
  assert.equal(JSON.stringify(getRegulatoryRequirements()), reqSnap);
});

test("a caller-supplied profile object is not mutated", async () => {
  const profile = structuredClone(DEMO_COMPANY_PROFILE);
  const snap = JSON.stringify(profile);
  const client = fakeClientByPurpose({
    "decision-agent-interpret": DECISION_INTERPRET_BODY,
    "decision-agent-recommend": DECISION_RECOMMEND_BODY,
  });
  await runOrchestration({ textAr: DECISION_Q, profile }, { client });
  assert.equal(JSON.stringify(profile), snap);
});

// -- efficiency ------------------------------------------------

test("agents not required by the routed intent are never called", async () => {
  const client = fakeClientByPurpose({
    "regulatory-agent": REG_BODY_SAFE,
    "evidence-agent": REG_BODY_SAFE, // present but must NOT be called
    "research-agent": RESEARCH_BODY_SAFE(WRID, WP1),
    "decision-agent-interpret": DECISION_INTERPRET_BODY,
    "decision-agent-recommend": DECISION_RECOMMEND_BODY,
  });
  await runOrchestration({ textAr: "اشرح المتطلب HAJ-EXP-05 فقط" }, { client });
  assert.deepEqual(client.calls, ["regulatory-agent"]);
});
