// =============================================================================
// Phase 12B — "البحث في أبحاث معهد خادم الحرمين الشريفين": searches the
// Institute's approved research (ingested excerpts + official metadata / area
// pages), with real Arabic normalization. Never fabricates findings.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  searchResearchCorpus,
  researchSources,
  type ResearchResultView,
} from "@/lib/research/browseResearch";
import { getResearchCorpus } from "@/lib/research/corpus";
import { INSTITUTE_REFERENCES } from "@/lib/research/instituteIndex";
import { LANDING_HEADLINE_AR } from "@/lib/ui/landing";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");
const nav = read("src/components/layout/navConfig.ts");
const page = read("src/app/company/research/page.tsx");
const all = (r: { results: ResearchResultView[]; references: ResearchResultView[] }) => [
  ...r.results,
  ...r.references,
];

// -- discoverability + framing -----------------------------------------

test("company navigation still exposes the research capability", () => {
  const companyBlock = nav.slice(nav.indexOf("COMPANY_NAV"), nav.indexOf("MINISTRY_NAV"));
  assert.match(companyBlock, /href:\s*"\/company\/research",\s*label:\s*"دعم بحثي"/);
});

test("the page states clearly that it searches the Institute's research", () => {
  assert.ok(statSync(path.join(ROOT, "src/app/company/research/page.tsx")).isFile());
  assert.match(page, /title="البحث في الأبحاث الرسمية للمعهد"/);
  assert.match(page, /subtitle="ابحث في المصادر الرسمية المتاحة داخل امتثال لدعم القرار\."/);
  assert.match(page, /ابحث في أبحاث المعهد/);
  assert.match(page, /يشمل البحث المصادر الرسمية المضافة حاليًا إلى المنصة\./);
  assert.match(page, /placeholder="مثال: الإسكان، النقل، إدارة الحشود، المحاكاة"/);
  // research / regulation boundary kept, concise
  assert.match(page, /الدراسات تدعم القرار ولا تُعد اشتراطات تنظيمية\./);
  // no internal vocabulary
  for (const bad of ["corpus", "RAG", "retrieval", "embedding", "agent", "PENDING_LOCAL_INGESTION"]) {
    assert.equal(page.includes(bad), false, `page contains "${bad}"`);
  }
});

test("reference cards drop the awkward limitation / provenance copy", () => {
  // the "detailed content not yet available" warning box is gone entirely
  assert.equal(page.includes("المحتوى التفصيلي غير متاح بعد"), false);
  assert.equal(page.includes("unavailableNoteAr"), false);
  // the redundant provenance line is gone
  assert.equal(page.includes("provenanceNoteAr"), false);
  // the reference section is reframed and its explanatory sentence removed
  assert.match(page, /مراجع مرتبطة بالبحث/);
  assert.equal(page.includes("مراجع رسمية للمعهد"), false);
  assert.equal(
    page.includes("صفحات وحدات ودراسات رسمية للمعهد؛ المحتوى التفصيلي غير متاح بعد"),
    false,
  );
  // the metadata-card scope label is reworded, the most-direct official link stays
  assert.match(page, /"عن المصدر"/);
  assert.equal(page.includes("نطاق التغطية"), false);
  assert.match(page, /فتح المصدر الرسمي/);
});

// -- housing: the reported gap is fixed ------------------------------

test("searching 'الاسكان' returns approved official institute housing material", () => {
  const r = searchResearchCorpus("الاسكان");
  const ids = all(r).map((x) => x.researchId);
  assert.ok(ids.includes("UQU-HAJJ-UNIT-ARCHITECTURE-HOUSING"), "the architecture & housing unit page");
  assert.ok(
    ids.includes("UQU-HAJJ-1447-STUDY-HOUSING-QUALITY-CENTRAL-MAKKAH"),
    "the 1447H housing-quality study metadata",
  );
});

test("Arabic hamza-normalization: 'الاسكان' and 'الإسكان' return the same institute material", () => {
  const a = searchResearchCorpus("الاسكان").references.map((x) => x.researchId).sort();
  const b = searchResearchCorpus("الإسكان").references.map((x) => x.researchId).sort();
  assert.deepEqual(a, b);
  assert.ok(a.length >= 2);
  // the controlled synonym also works
  assert.ok(
    searchResearchCorpus("مساكن").references.some(
      (x) => x.researchId === "UQU-HAJJ-1447-STUDY-HOUSING-QUALITY-CENTRAL-MAKKAH",
    ),
  );
});

// -- metadata-only never fabricates -------------------------------

test("official metadata / area-page references carry NO insight or findings", () => {
  const meta = searchResearchCorpus("").references;
  assert.ok(meta.length >= INSTITUTE_REFERENCES.length);
  for (const m of meta) {
    assert.equal(m.contentAvailability, "METADATA_ONLY");
    assert.equal(m.insightAr, null);
    assert.equal(m.insightLocatorAr, null);
    // no fabricated study summary / conclusion / statistic in the curated scope line
    assert.equal(/خلص إلى|أظهرت النتائج|نتيجة الدراسة|أثبتت|بنسبة \d/.test(m.decisionSupportAr), false);
    assert.ok(m.officialSourceReference.length > 0, "provenance visible");
    // where a link exists it is an official uqu.edu.sa link (the pending PDF has none)
    if (m.officialUrl) assert.match(m.officialUrl, /^https:\/\/uqu\.edu\.sa\//);
  }
  // the two housing references specifically DO carry their official links
  const housing = meta.filter((m) => /^UQU-HAJJ-(UNIT-ARCHITECTURE-HOUSING|1447-STUDY-HOUSING)/.test(m.researchId));
  assert.equal(housing.length, 2);
  for (const h of housing) assert.match(h.officialUrl ?? "", /^https:\/\/uqu\.edu\.sa\//);
});

test("the institute index itself stores no summary / findings fields", () => {
  const src = read("src/lib/research/instituteIndex.ts")
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)) // ignore comments
    .join("\n");
  assert.equal(/summary|finding|:\s*"[^"]*نتيجة الدراسة|خلص إلى|أظهرت النتائج/i.test(src), false);
  for (const ref of INSTITUTE_REFERENCES) {
    assert.match(ref.publisherAr, /معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة/);
    assert.match(ref.officialUrl, /^https:\/\/uqu\.edu\.sa\//);
  }
});

// -- ingested full results still work + provenance ------------------

test("ingested sources still return as FULL results with a verbatim excerpt", () => {
  const r = searchResearchCorpus("النمذجة والمحاكاة");
  assert.ok(r.results.length >= 1);
  for (const x of r.results) {
    assert.equal(x.contentAvailability, "FULL");
    assert.ok(x.insightAr && x.insightAr.length > 0);
    assert.ok(x.officialSourceReference.length > 0);
  }
  // an ingested passage is verbatim from the corpus
  const byId = new Map(getResearchCorpus().map((e) => [e.researchId, e]));
  for (const x of r.results) {
    const e = byId.get(x.researchId);
    if (e) assert.equal(x.insightAr, e.passages[0].textAr);
  }
});

test("BRT / transport and simulation queries still hit the ingested sources", () => {
  assert.ok(searchResearchCorpus("الحافلات السريعة").results.length >= 1);
  assert.ok(searchResearchCorpus("الكفاءة التشغيلية").results.length >= 1);
  assert.ok(searchResearchCorpus("النمذجة").results.length >= 1);
});

test("everything returned belongs to the approved institute set; nonsense returns nothing", () => {
  const approved = new Set([
    ...getResearchCorpus().map((e) => e.researchId),
    ...INSTITUTE_REFERENCES.map((r) => r.refId),
  ]);
  for (const q of ["الاسكان", "النقل", "BRT", "أم القرى", "المحاكاة"]) {
    for (const x of all(searchResearchCorpus(q))) {
      assert.ok(approved.has(x.researchId), `${q} → ${x.researchId} is outside the approved set`);
    }
  }
  const none = searchResearchCorpus("سيارات كهربائية طائرة");
  assert.equal(none.results.length + none.references.length, 0);
});

test("the only publishing institution is UQU / the Institute", () => {
  assert.deepEqual(researchSources(), ["جامعة أم القرى"]);
  for (const e of getResearchCorpus()) {
    assert.match(e.publisherAr, /معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة/);
  }
});

test("no internal vocabulary leaks into the rendered search output", () => {
  const rendered = JSON.stringify(searchResearchCorpus(""));
  for (const bad of ["PENDING_LOCAL_INGESTION", "RAG", "embedding", "retrieval", "\"corpus\""]) {
    assert.equal(rendered.includes(bad), false, `output contains ${bad}`);
  }
});

// -- landing copy stays exact (owner-approved) --------------------

test("landing headline constant is the owner-approved string", () => {
  assert.equal(
    LANDING_HEADLINE_AR,
    "يكشف مخاطر عدم الامتثال مبكرًا ويحاكي أثر القرارات قبل تنفيذها.",
  );
});
