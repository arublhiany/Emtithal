// =============================================================================
// Phase 8 tests — Research Knowledge Agent (decision support only).
//
// The live approved corpus is CORPUS_PENDING, so tests that exercise the LLM
// path pass a SYNTHETIC LOADED corpus via `opts.corpus`. The AI returns
// claim/relevance text only; bibliographic lineage + publication status are
// reattached by code; research can never assert a regulation or a compliance
// verdict, and never changes a Phase 7 scenario.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { StructuredAIClient, UnavailableAIClient } from "@/lib/ai/client/aiClient";
import type { AITransport } from "@/lib/ai/client/types";
import { answerResearchQuestion, getResearchInsightsForDecision } from "@/lib/ai/agents";
import {
  SEED_RESEARCH_ENTRY,
  WEB_SOURCE_SIMULATION_UNIT,
  WEB_SNAPSHOT_SHA256,
} from "@/lib/research";
import type { ResearchCorpusEntry } from "@/lib/research";
import type { ScenarioDiff } from "@/lib/engine/decisionScenarioEngine";

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

const RID = SEED_RESEARCH_ENTRY.researchId;
const P1 = `${RID}#p1`;
const P2 = `${RID}#p2`;

/**
 * A synthetic LOADED corpus for exercising the LLM/grounding pipeline ONLY. The
 * passage text is fabricated PLACEHOLDER text — it is NOT from the real approved
 * publication and asserts no real finding, statistic, waiting time, or sample
 * size. `PLACEHOLDER_NUMBER` exists solely to exercise numeric-claim grounding.
 */
const PLACEHOLDER_NUMBER = "12";
function loadedCorpus(): ResearchCorpusEntry[] {
  return [
    {
      ...SEED_RESEARCH_ENTRY,
      sourceVerificationStatus: "OFFICIAL_SOURCE_VERIFIED_LOCAL",
      documentHash: "a".repeat(64),
      ingestedAt: "2026-08-31T00:00:00.000Z",
      officialUrl: "https://example.invalid/synthetic-research-fixture.pdf",
      passages: [
        {
          passageId: P1,
          locator: { type: "PDF_PAGE", page: 1, section: null },
          textAr:
            "[نص اختباري تركيبي — ليس من مصدر حقيقي] فقرة تجريبية لاختبار مسار الربط. تتناول عمومًا فكرة استخدام النمذجة والمحاكاة لتقييم البدائل التشغيلية قبل التنفيذ الميداني.",
          extractionMethod: "PDF_TEXT",
        },
        {
          passageId: P2,
          locator: { type: "PDF_PAGE", page: 2, section: null },
          textAr: `[نص اختباري تركيبي] فقرة تجريبية ثانية تحتوي على الرقم ${PLACEHOLDER_NUMBER} لغرض اختبار التحقق العددي فقط، ولا يمثل هذا الرقم أي نتيجة بحثية.`,
          extractionMethod: "PDF_TEXT",
        },
      ],
    },
  ];
}

/** The still-pending Nawwariyah PDF seed only — forces a CORPUS_PENDING path. */
function pendingCorpus(): ResearchCorpusEntry[] {
  return [{ ...SEED_RESEARCH_ENTRY }];
}

const WRID = WEB_SOURCE_SIMULATION_UNIT.researchId;
const WP1 = WEB_SOURCE_SIMULATION_UNIT.passages[0].passageId;

const insightBody = (over: Record<string, unknown> = {}, insightOver: Record<string, unknown> = {}) =>
  JSON.stringify({
    summaryAr: "يقدم التقرير دعمًا بحثيًا لفكرة تقييم البدائل بالنمذجة والمحاكاة قبل التنفيذ الميداني.",
    insights: [
      {
        researchId: RID,
        claimAr: "تشير الدراسة إلى استخدام النمذجة والمحاكاة لتقييم بدائل تشغيلية قبل التنفيذ الميداني.",
        relevanceAr: "قد يكون ذا صلة عند تقييم البدائل التشغيلية قبل تنفيذها ميدانيًا. لا يمثل ذلك متطلبًا تنظيميًا.",
        citedPassageIds: [P1],
        interpretationConfidence: "MEDIUM",
        ...insightOver,
      },
    ],
    noRelevantResearch: false,
    needsHumanReview: false,
    ...over,
  });

const Q = {
  questionAr:
    "هل توجد في المصدر البحثي المعتمد دلالة على فائدة استخدام المحاكاة لتقييم البدائل التشغيلية قبل التنفيذ الميداني؟",
};

// -- corpus-pending: no LLM call, ever -------------------------

test("a CORPUS_PENDING corpus → controlled result, NO LLM call", async () => {
  const r = await answerResearchQuestion(Q, { corpus: pendingCorpus() });
  assert.equal(r.ok, false);
  assert.equal(r.corpusState, "CORPUS_PENDING");
  assert.equal(r.retrievalOutcome, "CORPUS_PENDING");
  assert.equal(r.failureCode, "CORPUS_PENDING");
  assert.equal(r.message, "CORPUS_PENDING_NEEDS_APPROVED_SOURCE");
  assert.equal(r.meta, null);
  assert.deepEqual(r.insights, []);
});

test("unrelated question against a LOADED corpus → NO_RELEVANT_RESEARCH, no LLM", async () => {
  const r = await answerResearchQuestion(
    { questionAr: "ما هي شروط ترخيص وكالة سياحية؟" },
    { corpus: loadedCorpus() },
  );
  assert.equal(r.failureCode, "NO_RELEVANT_RESEARCH");
  assert.equal(r.meta, null);
  assert.deepEqual(r.insights, []);
});

// -- happy path: grounded insight + reattached lineage --------

test("MATCH → grounded insight; canonical lineage + INTERIM status reattached by code", async () => {
  const r = await answerResearchQuestion(Q, {
    corpus: loadedCorpus(),
    ...withClient(insightBody()),
  });
  assert.equal(r.ok, true);
  assert.equal(r.retrievalOutcome, "MATCH");
  assert.deepEqual(r.candidateResearchIds, [RID]);
  assert.equal(r.insights.length, 1);
  const ins = r.insights[0];
  assert.equal(ins.researchId, RID);
  // lineage reattached from the corpus — never from the model
  assert.equal(ins.sourceTitleAr, SEED_RESEARCH_ENTRY.titleAr);
  assert.equal(ins.publisherAr, "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة");
  assert.equal(ins.institutionAr, "جامعة أم القرى");
  assert.equal(ins.publicationStatus, "INTERIM_REPORT");
  assert.equal(ins.researchSeason, "1447H");
  assert.equal(ins.sourceKind, "PDF_REPORT");
  assert.equal(ins.snapshotHash, null); // PDF source → no web-snapshot hash
  assert.equal(ins.officialUrl, "https://example.invalid/synthetic-research-fixture.pdf");
  // page provenance from the SYNTHETIC fixture passage (not a real publication page)
  assert.deepEqual(ins.citedPassages, [
    { passageId: P1, locator: { type: "PDF_PAGE", page: 1, section: null } },
  ]);
  // SOURCE_DIRECT and AI_INTERPRETATION are separate fields
  assert.equal(ins.provenanceKind, "SOURCE_DIRECT_PLUS_AI_INTERPRETATION");
  assert.notEqual(ins.claimAr, ins.aiRelevanceAr);
  // interim → forced review + limitation visible
  assert.equal(ins.needsHumanReview, true);
  assert.ok(ins.limitationsAr.some((l) => l.includes("المصدر تقرير مرحلي")));
  assert.equal(r.needsHumanReview, true);
  assert.equal(r.containsRegulatoryClaim, false);
});

// -- official-web source: WEB_SECTION provenance, no page number --------------

test("MATCH on a real OFFICIAL_WEB_PAGE → WEB_SECTION provenance, no page, canonical URL reattached", async () => {
  const webBody = JSON.stringify({
    summaryAr: "يقدم المصدر الرسمي دعمًا سياقيًا لفكرة استخدام النمذجة والمحاكاة لتقييم البدائل ودعم القرار.",
    insights: [
      {
        researchId: WRID,
        claimAr:
          "يشير المصدر الرسمي إلى استخدام تقنيات النمذجة والمحاكاة لتقييم فاعلية المقترحات والحلول واقتراح بدائل واستنباط مؤشرات لدعم القرار.",
        relevanceAr:
          "قد يكون ذلك ذا صلة عند تقييم البدائل التشغيلية. لا يمثل ذلك متطلبًا تنظيميًا ولا يتحقق من صحة أي ناتج رقمي محدد.",
        citedPassageIds: [WP1],
        interpretationConfidence: "MEDIUM",
      },
    ],
    noRelevantResearch: false,
    needsHumanReview: false,
  });
  const r = await answerResearchQuestion(
    {
      questionAr:
        "هل يدعم المصدر الرسمي للمعهد استخدام النمذجة والمحاكاة لتقييم البدائل ودعم اتخاذ القرار؟",
      restrictToResearchIds: [WRID],
    },
    { corpus: [WEB_SOURCE_SIMULATION_UNIT], ...withClient(webBody) },
  );
  assert.equal(r.ok, true);
  assert.equal(r.retrievalOutcome, "MATCH");
  assert.deepEqual(r.candidateResearchIds, [WRID]);
  const ins = r.insights[0];
  assert.equal(ins.researchId, WRID);
  assert.equal(ins.sourceKind, "OFFICIAL_WEB_PAGE");
  assert.equal(ins.publicationStatus, "OTHER_APPROVED");
  assert.equal(ins.researchSeason, null);
  // canonical URL reattached by CODE, never from the model
  assert.equal(ins.officialUrl, "https://uqu.edu.sa/hajj/70777");
  assert.equal(ins.citedPassages.length, 1);
  assert.equal(ins.citedPassages[0].locator.type, "WEB_SECTION");
  assert.equal("page" in ins.citedPassages[0].locator, false);
  assert.equal(
    (ins.citedPassages[0].locator as { section: string }).section,
    "main body / unit description",
  );
  // canonical web-snapshot hash reattached by CODE from the corpus entry
  assert.equal(ins.snapshotHash, WEB_SNAPSHOT_SHA256);
  assert.equal(ins.snapshotHash, WEB_SOURCE_SIMULATION_UNIT.snapshotHash);
});

test("model output cannot override any code-reattached canonical field (strict schema)", async () => {
  // every one of these is a canonical/provenance field the model must not supply
  for (const extra of [
    { officialUrl: "https://evil.example/fake" },
    { sourceTitleAr: "عنوان مزيف" },
    { publisherAr: "ناشر مزيف" },
    { sourceKind: "OFFICIAL_WEB_PAGE" },
    { publicationStatus: "FINAL_REPORT" },
    { publicationYear: "1999" },
    { snapshotHash: "0".repeat(64) },
    { locator: { type: "PDF_PAGE", page: 3, section: null } },
    { citedPassages: [{ passageId: WP1, locator: { type: "WEB_SECTION", section: "x" } }] },
  ] as const) {
    const bad = JSON.stringify({
      summaryAr: "x",
      insights: [
        {
          researchId: WRID,
          claimAr: "y",
          relevanceAr: "z",
          citedPassageIds: [WP1],
          interpretationConfidence: "LOW",
          ...extra,
        },
      ],
      noRelevantResearch: false,
      needsHumanReview: false,
    });
    const r = await answerResearchQuestion(
      { questionAr: "النمذجة والمحاكاة لتقييم البدائل ودعم القرار", restrictToResearchIds: [WRID] },
      { corpus: [WEB_SOURCE_SIMULATION_UNIT], ...withClient(bad, bad) },
    );
    assert.equal(r.ok, false, `extra key ${Object.keys(extra)[0]} must be rejected`);
    assert.equal(r.failureCode, "SCHEMA_VALIDATION_FAILED");
    assert.deepEqual(r.insights, []);
  }
});

// -- claim grounding -----------------------------------------

test("an insight citing an invented passage id → dropped, not surfaced", async () => {
  const r = await answerResearchQuestion(Q, {
    corpus: loadedCorpus(),
    ...withClient(insightBody({}, { citedPassageIds: [`${RID}#p999`] })),
  });
  assert.deepEqual(r.insights, []);
  assert.equal(r.droppedInsights.some((d) => d.reason === "NO_REAL_CITED_PASSAGE"), true);
  assert.equal(r.needsHumanReview, true);
});

test("an insight for a researchId outside the candidate set → dropped", async () => {
  const r = await answerResearchQuestion(Q, {
    corpus: loadedCorpus(),
    ...withClient(insightBody({}, { researchId: "SOME-OTHER-STUDY" })),
  });
  assert.deepEqual(r.insights, []);
  assert.equal(r.droppedInsights[0].reason, "OUT_OF_CANDIDATE_SET");
});

test("the model cannot reproduce bibliographic metadata as truth (schema rejects it)", async () => {
  const bad = JSON.stringify({
    summaryAr: "x",
    insights: [
      {
        researchId: RID,
        claimAr: "y",
        relevanceAr: "z",
        citedPassageIds: [P1],
        interpretationConfidence: "LOW",
        publisherAr: "جهة مزيفة", // extra key → strict schema fails
      },
    ],
    noRelevantResearch: false,
    needsHumanReview: false,
  });
  const r = await answerResearchQuestion(Q, { corpus: loadedCorpus(), ...withClient(bad, bad) });
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "SCHEMA_VALIDATION_FAILED");
});

// -- numeric-claim grounding -------------------------------

test("a numeric token that IS present in a cited placeholder passage is allowed", async () => {
  const r = await answerResearchQuestion(Q, {
    corpus: loadedCorpus(),
    ...withClient(
      insightBody(
        {},
        {
          claimAr: `يشير النص التجريبي إلى الرقم ${PLACEHOLDER_NUMBER} كما ورد في الفقرة المستشهد بها.`,
          citedPassageIds: [P2],
        },
      ),
    ),
  });
  assert.equal(r.insights.length, 1);
  assert.ok(r.insights[0].claimAr.includes(PLACEHOLDER_NUMBER));
});

test("an INVENTED numeric token (not in any cited passage) → insight dropped", async () => {
  const r = await answerResearchQuestion(Q, {
    corpus: loadedCorpus(),
    ...withClient(
      insightBody(
        {},
        {
          claimAr: "يذكر النص التجريبي الرقم 999 وهو غير موجود في أي فقرة مستشهد بها.",
          citedPassageIds: [P1, P2],
        },
      ),
    ),
  });
  assert.deepEqual(r.insights, []);
  assert.equal(r.droppedInsights.some((d) => d.reason === "UNGROUNDED_NUMERIC_CLAIM"), true);
});

// -- regulation / research firewall ------------------------

for (const [label, over, insOver] of [
  ["compliance verdict in summary", { summaryAr: "السيناريو أ يجعل الشركة ملتزمة" }, {}],
  ["non-compliance verdict in relevance", {}, { relevanceAr: "هذا يثبت أن الشركة غير ملتزمة" }],
  ["regulatory requirement claim", {}, { claimAr: "هذا متطلب رسمي تفرضه وزارة الحج" }],
  ["official weight claim", {}, { relevanceAr: "الوزن الرسمي لهذا المعيار مرتفع" }],
] as const) {
  test(`firewall: ${label} → whole research answer discarded (GUARDRAIL_REJECTED)`, async () => {
    const r = await answerResearchQuestion(Q, {
      corpus: loadedCorpus(),
      ...withClient(insightBody(over, insOver)),
    });
    assert.equal(r.ok, false);
    assert.equal(r.failureCode, "GUARDRAIL_REJECTED");
    assert.deepEqual(r.insights, []);
    assert.equal(r.summaryAr, null);
    assert.equal(r.containsRegulatoryClaim, false);
    // the approved source stays available
    assert.equal(r.retrievalOutcome, "MATCH");
    assert.deepEqual(r.candidateResearchIds, [RID]);
  });
}

test("firewall: safe research wording ('تشير الدراسة…', disclaimer) is preserved", async () => {
  const r = await answerResearchQuestion(Q, { corpus: loadedCorpus(), ...withClient(insightBody()) });
  assert.equal(r.ok, true);
  assert.match(r.insights[0].claimAr, /تشير الدراسة/);
});

// -- Phase 7 integration separation -----------------------

const fakeDiff = (): ScenarioDiff => ({
  scenarioId: "A",
  fieldsChanged: [
    {
      fieldPath: "pilgrims.count",
      kind: "COUNT",
      currentValue: 4200,
      scenarioValue: 5200,
      source: "USER_STATED",
    },
  ],
  applicabilityChanges: [],
  verificationStatusChanges: [],
  readinessDelta: 0,
  coverageDelta: 0,
  blockersAdded: [],
  blockersRemoved: [],
  verificationGapsAdded: [],
  verificationGapsRemoved: [],
  regulatoryPendingDelta: 0,
  applicabilityPendingDelta: 0,
  operationalMetricChanges: [
    {
      key: "pilgrimsPerWorkforceMember",
      fromRaw: 4200 / 180,
      toRaw: 5200 / 180,
      fromDisplay: 23.33,
      toDisplay: 28.89,
      direction: "INCREASED",
    },
  ],
  sourceLineage: [],
  unresolvedRequirementIds: [],
});

test("getResearchInsightsForDecision does not read or mutate the scenario diff", async () => {
  const diff = fakeDiff();
  const snapshot = JSON.stringify(diff);
  const r = await getResearchInsightsForDecision(
    { scenarioDiff: diff },
    { corpus: loadedCorpus(), ...withClient(insightBody()) },
  );
  // the diff object is untouched (no KPI / recommendedScenarioId / whyChangedAr is added or changed)
  assert.equal(JSON.stringify(diff), snapshot);
  // the result carries ONLY a research section — no scenario KPI fields
  assert.equal("readiness" in r, false);
  assert.equal("recommendedScenarioId" in r, false);
  assert.equal("whyChangedAr" in r, false);
  assert.equal(r.insights.length, 1);
});

// -- failure model --------------------------------------

test("AI unavailable → controlled result; the approved source + retrieval stay available", async () => {
  const r = await answerResearchQuestion(Q, {
    corpus: loadedCorpus(),
    client: new UnavailableAIClient("no creds"),
  });
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "AI_UNAVAILABLE");
  assert.equal(r.retrievalOutcome, "MATCH");
  assert.deepEqual(r.candidateResearchIds, [RID]);
  assert.deepEqual(r.insights, []);
});

test("provider error → controlled PROVIDER_ERROR, no fabricated research", async () => {
  const r = await answerResearchQuestion(Q, {
    corpus: loadedCorpus(),
    ...withClient(new Error("boom")),
  });
  assert.equal(r.failureCode, "PROVIDER_ERROR");
  assert.deepEqual(r.insights, []);
});

test("malformed structured output → at most one retry → SCHEMA_VALIDATION_FAILED", async () => {
  const r = await answerResearchQuestion(Q, {
    corpus: loadedCorpus(),
    ...withClient("not json", "still not json"),
  });
  assert.equal(r.failureCode, "SCHEMA_VALIDATION_FAILED");
  assert.equal(r.meta?.attempts, 2);
  assert.deepEqual(r.insights, []);
});
