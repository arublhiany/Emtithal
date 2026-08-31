// =============================================================================
// Phase 12B — "دعم بحثي" is a real, visible product feature.
//
// The research support page searches ONLY the approved Phase 8 corpus, shows
// provenance, keeps research separate from regulation, and never fabricates
// content for a source whose official document is not yet available.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

import { searchResearchCorpus, researchSources } from "@/lib/research/browseResearch";
import { getResearchCorpus, isEntryLoaded } from "@/lib/research/corpus";
import {
  GOVERNMENT_CTA_AR,
  LANDING_HEADLINE_AR,
} from "@/lib/ui/landing";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const nav = readFileSync(path.join(ROOT, "src/components/layout/navConfig.ts"), "utf8");
const pagePath = path.join(ROOT, "src/app/company/research/page.tsx");
const page = readFileSync(pagePath, "utf8");
const browseSrc = readFileSync(path.join(ROOT, "src/lib/research/browseResearch.ts"), "utf8");

// -- 1. discoverable: company nav + dedicated route -----------------------

test("company navigation visibly includes 'دعم بحثي' → /company/research", () => {
  // the item sits inside COMPANY_NAV, not MINISTRY_NAV
  const companyBlock = nav.slice(nav.indexOf("COMPANY_NAV"), nav.indexOf("MINISTRY_NAV"));
  assert.match(
    companyBlock,
    /href:\s*"\/company\/research",\s*label:\s*"دعم بحثي"/,
  );
  const ministryBlock = nav.slice(nav.indexOf("MINISTRY_NAV"));
  assert.equal(ministryBlock.includes("/company/research"), false);
});

test("/company/research route exists with the required copy", () => {
  assert.ok(statSync(pagePath).isFile());
  assert.match(page, /eyebrow="دعم بحثي"|title="دعم بحثي"/);
  assert.match(page, /ابحث في الأبحاث والدراسات/);
  assert.match(page, /الدراسات تدعم القرار ولا تُعد اشتراطات تنظيمية\./);
  assert.match(page, /BoundaryChip kind="RESEARCH"/); // research visually separated from regulation
});

test("a concise research entry point is on the company dashboard", () => {
  const dash = readFileSync(path.join(ROOT, "src/app/company/dashboard/page.tsx"), "utf8");
  assert.match(dash, /\/company\/research/);
  assert.match(dash, /دعم بحثي/);
});

// -- 2. search runs ONLY over the approved corpus ----------------------

test("empty query returns exactly the loaded approved sources as results", () => {
  const { results, pending } = searchResearchCorpus("");
  const loadedIds = getResearchCorpus().filter(isEntryLoaded).map((e) => e.researchId).sort();
  assert.deepEqual(results.map((r) => r.researchId).sort(), loadedIds);
  assert.ok(results.length >= 2, "at least the two verified official web sources");
  // a source without an ingested official document is NOT a result …
  const pendingIds = getResearchCorpus().filter((e) => !isEntryLoaded(e)).map((e) => e.researchId);
  for (const id of pendingIds) {
    assert.equal(results.some((r) => r.researchId === id), false, `${id} must not be a result`);
  }
  // … it is surfaced separately, with no fabricated insight
  assert.deepEqual(pending.map((p) => p.researchId).sort(), pendingIds.sort());
});

test("every returned result carries its own real content only", () => {
  const { results } = searchResearchCorpus("");
  const byId = new Map(getResearchCorpus().map((e) => [e.researchId, e]));
  for (const r of results) {
    const src = byId.get(r.researchId)!;
    assert.ok(r.officialSourceReference.length > 0, "provenance visible");
    assert.equal(r.officialSourceReference, src.officialSourceReference);
    if (r.insightAr != null) {
      // the insight is a verbatim passage from the approved corpus, never invented
      assert.equal(r.insightAr, src.passages[0].textAr);
    }
    assert.ok(r.decisionSupportAr.length > 0, "how it may support a decision");
  }
});

test("a query never matches anything outside the approved corpus", () => {
  const approvedIds = new Set(getResearchCorpus().map((e) => e.researchId));
  for (const q of ["النمذجة والمحاكاة", "BRT", "الحافلات السريعة", "أم القرى", "شيء غير موجود إطلاقًا"]) {
    const { results, pending } = searchResearchCorpus(q);
    for (const r of [...results, ...pending]) {
      assert.ok(approvedIds.has(r.researchId), `${q} → ${r.researchId} is outside the corpus`);
    }
  }
});

// -- 3. searchable by topic / title / organization / keyword ----------

test("search matches by keyword, study title, organization/source and topic", () => {
  // keyword
  assert.ok(searchResearchCorpus("النمذجة").results.length >= 1);
  // topic
  assert.ok(searchResearchCorpus("الكفاءة التشغيلية").results.length >= 1);
  // organization / source name
  assert.ok(searchResearchCorpus("معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة").results.length >= 1);
  assert.ok(searchResearchCorpus("جامعة أم القرى").results.length >= 1);
  // study title fragment
  assert.ok(searchResearchCorpus("الحافلات السريعة").results.length >= 1);
  // no match
  assert.equal(searchResearchCorpus("موضوع لا علاقة له بالحج").results.length, 0);
});

test("the approved corpus is published by the Custodian's Institute", () => {
  for (const e of getResearchCorpus()) {
    assert.match(e.publisherAr, /معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة/);
  }
  assert.deepEqual(researchSources(), ["جامعة أم القرى"]);
});

// -- 4. no internal / engineering vocabulary in user-facing output ----

test("browse module exposes no internal terms (corpus/retrieval/RAG/embedding/agent/PENDING_LOCAL_INGESTION)", () => {
  const { results, pending } = searchResearchCorpus("");
  const rendered = JSON.stringify([results, pending]);
  for (const bad of ["PENDING_LOCAL_INGESTION", "RAG", "embedding", "retrieval", "corpus"]) {
    assert.equal(rendered.includes(bad), false, `rendered output contains "${bad}"`);
  }
  // and the page/component text
  for (const bad of ["PENDING_LOCAL_INGESTION", "RAG", "embedding", "retrieval", "corpus", "agent"]) {
    assert.equal(page.includes(bad), false, `page contains "${bad}"`);
  }
  // the browse module's user-facing STRING LITERALS carry none either
  const literals = (browseSrc.match(/"[^"]*"/g) ?? []).join(" ");
  assert.equal(/PENDING_LOCAL_INGESTION|\bRAG\b|embedding/.test(literals), false);
});

// -- 5. landing copy untouched --------------------------------------

test("landing copy is still the exact approved copy (unchanged this phase)", () => {
  assert.equal(GOVERNMENT_CTA_AR, "دخول الجهات الحكومية");
  assert.equal(
    LANDING_HEADLINE_AR,
    "يكشف مخاطر عدم الامتثال مبكرًا ويحاكي أثر القرارات قبل تنفيذها",
  );
  const landing = readFileSync(path.join(ROOT, "src/app/page.tsx"), "utf8");
  assert.equal(landing.includes("/company/research"), false, "no research search on the public landing");
  assert.equal(landing.includes("سجل الآن"), false);
});
