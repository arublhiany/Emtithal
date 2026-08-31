// =============================================================================
// Phase 8 tests — deterministic research retrieval (NO LLM).
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { SEED_RESEARCH_ENTRY, matchResearch, retrieveResearch } from "@/lib/research";
import type { ResearchCorpusEntry } from "@/lib/research";

/**
 * A synthetic LOADED corpus for retrieval tests only. Retrieval matches on
 * title / topicTags / scope — not on passage text — so the passage is a pure
 * PLACEHOLDER, NOT from the real approved publication, and asserts nothing.
 */
const loaded = (): ResearchCorpusEntry[] => [
  {
    ...SEED_RESEARCH_ENTRY,
    sourceVerificationStatus: "OFFICIAL_SOURCE_VERIFIED_LOCAL",
    documentHash: "0".repeat(64),
    ingestedAt: "2026-08-31T00:00:00.000Z",
    officialUrl: "https://example.invalid/synthetic-research-fixture.pdf",
    passages: [
      {
        passageId: `${SEED_RESEARCH_ENTRY.researchId}#p1`,
        locator: { type: "PDF_PAGE", page: 1, section: null },
        textAr: "[نص اختباري تركيبي — ليس من مصدر حقيقي] فقرة تجريبية لاختبار الاسترجاع فقط.",
        extractionMethod: "PDF_TEXT",
      },
    ],
  },
];

// -- live corpus is now CORPUS_LOADED (from the real web snapshot) -------------

test("retrieveResearch on the live corpus is no longer CORPUS_PENDING", () => {
  const r = retrieveResearch({ questionAr: "سؤال غير ذي صلة تمامًا عن ترخيص وكالة سياحية" });
  assert.notEqual(r.kind, "CORPUS_PENDING");
  assert.equal(r.kind, "NO_RELEVANT_RESEARCH"); // unrelated → no candidate, no LLM
  assert.deepEqual(r.researchIds, []);
});

test("retrieveResearch on the live corpus maps a simulation-support question to SOURCE A", () => {
  const r = retrieveResearch({
    questionAr:
      "هل يدعم المصدر الرسمي للمعهد استخدام النمذجة والمحاكاة لتقييم البدائل ودعم اتخاذ القرار؟",
    restrictToResearchIds: ["UQU-HAJJ-INSTITUTE-SIMULATION-UNIT"],
  });
  assert.equal(r.kind, "MATCH");
  assert.deepEqual(r.researchIds, ["UQU-HAJJ-INSTITUTE-SIMULATION-UNIT"]);
});

// -- deterministic matching over a LOADED corpus ---------------

test("exact canonical title → MATCH", () => {
  const r = matchResearch(loaded(), { questionAr: SEED_RESEARCH_ENTRY.titleAr });
  assert.equal(r.kind, "MATCH");
  assert.deepEqual(r.researchIds, [SEED_RESEARCH_ENTRY.researchId]);
});

test("approved topic terms → MATCH", () => {
  const r = matchResearch(loaded(), {
    questionAr: "هل تفيد النمذجة والمحاكاة في تقييم البدائل التشغيلية قبل التنفيذ الميداني؟",
  });
  assert.equal(r.kind, "MATCH");
  assert.deepEqual(r.researchIds, [SEED_RESEARCH_ENTRY.researchId]);
});

test("direct researchId → MATCH; unknown id → NO_RELEVANT_RESEARCH", () => {
  assert.equal(matchResearch(loaded(), { researchId: SEED_RESEARCH_ENTRY.researchId }).kind, "MATCH");
  assert.equal(matchResearch(loaded(), { researchId: "NOPE" }).kind, "NO_RELEVANT_RESEARCH");
});

test("unrelated question → NO_RELEVANT_RESEARCH (no candidates)", () => {
  const r = matchResearch(loaded(), { questionAr: "ما هي شروط ترخيص وكالة سياحية للسفر الخارجي؟" });
  assert.equal(r.kind, "NO_RELEVANT_RESEARCH");
  assert.deepEqual(r.researchIds, []);
});

test("ambiguous retrieval never silently picks one source", () => {
  const a = { ...loaded()[0], researchId: "A-SIM", titleAr: "دراسة محاكاة أولى" };
  const b = { ...loaded()[0], researchId: "B-SIM", titleAr: "دراسة محاكاة ثانية" };
  const r = matchResearch([a, b], { questionAr: "دراسة محاكاة" });
  assert.equal(r.kind, "AMBIGUOUS");
  assert.ok(r.researchIds.length >= 2);
  assert.deepEqual(r.researchIds, [...r.researchIds].sort());
});

test("restrictToResearchIds narrows the pool; an empty restricted pool → NO_RELEVANT_RESEARCH", () => {
  const q = "النمذجة والمحاكاة لتقييم البدائل التشغيلية قبل التنفيذ الميداني";
  assert.equal(
    matchResearch(loaded(), { questionAr: q, restrictToResearchIds: [SEED_RESEARCH_ENTRY.researchId] })
      .kind,
    "MATCH",
  );
  assert.equal(
    matchResearch(loaded(), { questionAr: q, restrictToResearchIds: ["OTHER"] }).kind,
    "NO_RELEVANT_RESEARCH",
  );
});
