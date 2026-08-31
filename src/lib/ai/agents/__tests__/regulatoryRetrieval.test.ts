// =============================================================================
// Phase 5 tests — deterministic regulatory retrieval (no LLM).
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { retrieveCandidates } from "@/lib/ai/agents/regulatoryRetrieval";

test("exact canonical title → single MATCH (HAJ-EXP-05)", () => {
  const r = retrieveCandidates({ text: "توثيق فعاليات ومبادرات فريق السعادة" });
  assert.equal(r.kind, "MATCH");
  assert.deepEqual(r.candidateIds, ["HAJ-EXP-05"]);
});

test("canonical title embedded in a full question → single MATCH (HAJ-EXP-05)", () => {
  const r = retrieveCandidates({
    text: "اشرح لي باختصار متطلب توثيق فعاليات ومبادرات فريق السعادة، وما مصدره الرسمي؟",
  });
  assert.equal(r.kind, "MATCH");
  assert.deepEqual(r.candidateIds, ["HAJ-EXP-05"]);
});

test("legacy alias resolves to the canonical requirement", () => {
  assert.deepEqual(retrieveCandidates({ requirementId: "CR-005" }).candidateIds, ["HAJ-EXP-05"]);
  assert.deepEqual(retrieveCandidates({ requirementId: "CR-001" }).candidateIds, ["HAJ-EXP-01"]);
  assert.equal(retrieveCandidates({ requirementId: "CR-005" }).kind, "MATCH");
});

test("canonical id passes straight through", () => {
  assert.deepEqual(retrieveCandidates({ requirementId: "HAJ-NUSUK-01" }).candidateIds, [
    "HAJ-NUSUK-01",
  ]);
});

test("authority filter narrows the pool", () => {
  const civ = retrieveCandidates({
    text: "جاهزية وسائل وأنظمة الإطفاء",
    authorityId: "CIVIL_DEFENSE",
  });
  assert.equal(civ.kind, "MATCH");
  assert.deepEqual(civ.candidateIds, ["CIV-01"]);

  // Same text, wrong authority → nothing in that authority matches.
  const moh = retrieveCandidates({ text: "جاهزية وسائل وأنظمة الإطفاء", authorityId: "MOH" });
  assert.equal(moh.kind, "NONE");
  assert.deepEqual(moh.candidateIds, []);
});

test("a canonical id under the wrong authority filter → NONE", () => {
  const r = retrieveCandidates({ requirementId: "CIV-01", authorityId: "MOHU" });
  assert.equal(r.kind, "NONE");
});

test("unknown authority id → NONE", () => {
  assert.equal(retrieveCandidates({ text: "أي شيء", authorityId: "NASA" }).kind, "NONE");
});

test("unknown topic → NONE (agent will return OUT_OF_CORPUS, no LLM)", () => {
  const r = retrieveCandidates({ text: "ما هي شروط ترخيص وكالة سياحية للسفر الخارجي؟" });
  assert.equal(r.kind, "NONE");
  assert.deepEqual(r.candidateIds, []);
});

test("unknown identifier → NONE", () => {
  assert.equal(retrieveCandidates({ requirementId: "NOPE-99" }).kind, "NONE");
});

test("ambiguous retrieval returns multiple candidates, never a silent single pick", () => {
  const r = retrieveCandidates({ text: "جاهزية" });
  assert.equal(r.kind, "AMBIGUOUS");
  assert.ok(r.candidateIds.length >= 2, `expected ≥2 candidates, got ${r.candidateIds.length}`);
  // deterministic ordering
  assert.deepEqual(r.candidateIds, [...r.candidateIds].sort());
});

test("season lock: a non-1447H season is a SEASON_MISMATCH, not an extrapolation", () => {
  const r = retrieveCandidates({ requirementId: "HAJ-EXP-05", season: "1446H" });
  assert.equal(r.kind, "SEASON_MISMATCH");
  assert.deepEqual(r.candidateIds, []);
  assert.equal(r.requestedSeason, "1446H");
});

test("explicit 1447H season is accepted", () => {
  const r = retrieveCandidates({ requirementId: "HAJ-EXP-05", season: "1447H" });
  assert.equal(r.kind, "MATCH");
  assert.deepEqual(r.candidateIds, ["HAJ-EXP-05"]);
});

test("empty query → NONE", () => {
  assert.equal(retrieveCandidates({}).kind, "NONE");
  assert.equal(retrieveCandidates({ text: "   " }).kind, "NONE");
});
