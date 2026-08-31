// =============================================================================
// Phase 8 tests — approved research corpus.
//
//  - The seeded Nawwariyah PDF source stays PENDING (its official PDF is not
//    ingested here) — it remains a future PDF source.
//  - Two REAL official UQU web sources are loaded from a locally hashed snapshot
//    (OFFICIAL_WEB_PAGE / OFFICIAL_STUDY_PAGE, WEB_SECTION provenance, no page).
//  - Because ≥1 real approved source has verified local provenance + grounded
//    passages, the production corpus is CORPUS_LOADED.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  SEED_RESEARCH_ENTRY,
  WEB_SOURCE_SIMULATION_UNIT,
  WEB_SOURCE_BRT_STUDY,
  WEB_SNAPSHOT_SOURCE_FILE,
  WEB_SNAPSHOT_SHA256,
  WEB_SNAPSHOT_VERIFIED_AT,
  getResearchCorpus,
  getResearchEntryById,
  isEntryLoaded,
  researchCorpusState,
  RESEARCH_CORPUS_PENDING_CODE,
} from "@/lib/research";

const ROOT = path.resolve(import.meta.dirname, "../../../..");

// -- seeded PDF source: STILL PENDING -----------------------------------------

test("the seeded Nawwariyah PDF source carries exact Institute / UQU metadata and is a PDF report", () => {
  const e = SEED_RESEARCH_ENTRY;
  assert.equal(
    e.titleAr,
    "تحسين كفاءة المرور بمحطة استقبال حافلات الحجاج والمعتمرين بالنوارية باستخدام النمذجة والمحاكاة",
  );
  assert.equal(e.publisherAr, "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة");
  assert.equal(e.institutionAr, "جامعة أم القرى");
  assert.equal(e.researchSeason, "1447H");
  assert.equal(e.publicationYear, "2026"); // established separately as bibliographic metadata
  assert.equal(e.publicationStatus, "INTERIM_REPORT");
  assert.equal(e.sourceKind, "PDF_REPORT");
  assert.equal(e.theme, "OPERATIONAL_SIMULATION_AND_DECISION_SUPPORT");
});

test("publicationYear semantics: SOURCE A null, SOURCE B '2026' (explicit publish date), seed '2026'", () => {
  assert.equal(WEB_SOURCE_SIMULATION_UNIT.publicationYear, null);
  assert.equal(WEB_SOURCE_BRT_STUDY.publicationYear, "2026");
  assert.equal(SEED_RESEARCH_ENTRY.publicationYear, "2026");
  // "2019" (a page last-modified date) must not appear as a publication year anywhere
  for (const e of [SEED_RESEARCH_ENTRY, WEB_SOURCE_SIMULATION_UNIT, WEB_SOURCE_BRT_STUDY]) {
    assert.notEqual(e.publicationYear, "2019");
  }
});

test("no runtime logic derives publicationYear from last-modified / snapshot metadata", async () => {
  const src = await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("../corpus.ts", import.meta.url), "utf8"),
  );
  // publicationYear is only ever an explicit literal or null — never computed
  assert.equal(/publicationYear\s*[:=]\s*[^,\n]*(?:Date|getFullYear|lastModified|mtime|slice|match|parse)/.test(src), false);
  const agentSrc = await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("../../ai/agents/researchAgent.ts", import.meta.url), "utf8"),
  );
  assert.equal(/publicationYear\s*=/.test(agentSrc), false); // agent never assigns it
});

test("publication status is STORED explicitly, not derived from the title", () => {
  const e = getResearchEntryById(SEED_RESEARCH_ENTRY.researchId)!;
  assert.equal(e.publicationStatus, "INTERIM_REPORT");
  assert.notEqual(e.publicationStatus, "FINAL_REPORT");
});

test("the seeded PDF source is NOT ingested locally → PENDING, no passages, no hashes, no url", () => {
  const e = getResearchEntryById(SEED_RESEARCH_ENTRY.researchId)!;
  assert.equal(e.sourceVerificationStatus, "PENDING_LOCAL_INGESTION");
  assert.deepEqual(e.passages, []);
  assert.equal(e.officialUrl, null);
  assert.equal(e.documentHash, null);
  assert.equal(e.snapshotHash, null);
  assert.equal(e.ingestedAt, null);
  assert.equal(e.snapshotVerifiedAt, null);
  assert.equal(isEntryLoaded(e), false);
});

test("every seed limitation keeps the interim-report caveat visible", () => {
  assert.ok(
    SEED_RESEARCH_ENTRY.limitationsAr.some((l) =>
      l.includes("المصدر تقرير مرحلي، وتبقى النتائج أو التوصيات قابلة للتحديث في التقرير النهائي"),
    ),
  );
  assert.ok(SEED_RESEARCH_ENTRY.limitationsAr.some((l) => l.includes("لا يمثل هذا المصدر متطلبًا تنظيميًا")));
});

// -- two REAL official UQU web sources ---------------------------------------

test("SOURCE A — Institute Modelling & Simulation Unit — is an OFFICIAL_WEB_PAGE with canonical lineage", () => {
  const e = WEB_SOURCE_SIMULATION_UNIT;
  assert.equal(e.researchId, "UQU-HAJJ-INSTITUTE-SIMULATION-UNIT");
  assert.equal(e.titleAr, "وحدة النمذجة والمحاكاة");
  assert.equal(e.publisherAr, "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة — جامعة أم القرى");
  assert.equal(e.institutionAr, "جامعة أم القرى");
  assert.equal(e.officialUrl, "https://uqu.edu.sa/hajj/70777");
  assert.equal(e.sourceKind, "OFFICIAL_WEB_PAGE");
  assert.equal(e.publicationStatus, "OTHER_APPROVED");
  assert.equal(e.theme, "OPERATIONAL_SIMULATION_AND_DECISION_SUPPORT");
  assert.equal(e.sourceVerificationStatus, "OFFICIAL_WEB_SNAPSHOT_VERIFIED_LOCAL");
  assert.equal(e.snapshotHash, WEB_SNAPSHOT_SHA256);
  // web snapshot: ingestedAt is reserved for PDF ingestion (null here);
  // snapshotVerifiedAt is the real local verification time
  assert.equal(e.ingestedAt, null);
  assert.equal(e.snapshotVerifiedAt, WEB_SNAPSHOT_VERIFIED_AT);
  assert.match(e.snapshotVerifiedAt ?? "", /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  assert.equal(e.publicationYear, null); // NOT inferred from the page's 2019 last-modified date
  assert.equal(e.documentHash, null);
});

test("SOURCE B — BRT study page — is an OFFICIAL_STUDY_PAGE, OTHER_APPROVED, never a final report", () => {
  const e = WEB_SOURCE_BRT_STUDY;
  assert.equal(e.researchId, "UQU-HAJJ-1447-BRT-SIMULATION-STUDY");
  assert.equal(
    e.titleAr,
    "معهد خادم الحرمين الشَّريفين لأبحاث الحجِّ والعمرة يقيِّم كفاءة نظام الحافلات السَّريعة (BRT)",
  );
  assert.equal(e.publisherAr, "جامعة أم القرى / معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة");
  assert.equal(e.officialUrl, "https://uqu.edu.sa/App/News/178082");
  assert.equal(e.sourceKind, "OFFICIAL_STUDY_PAGE");
  assert.equal(e.researchSeason, "1447H");
  assert.equal(e.publicationStatus, "OTHER_APPROVED");
  assert.notEqual(e.publicationStatus, "FINAL_REPORT");
  assert.equal(e.sourceVerificationStatus, "OFFICIAL_WEB_SNAPSHOT_VERIFIED_LOCAL");
  assert.equal(e.snapshotHash, WEB_SNAPSHOT_SHA256);
  assert.equal(e.ingestedAt, null);
  assert.equal(e.snapshotVerifiedAt, WEB_SNAPSHOT_VERIFIED_AT);
  assert.equal(e.publicationYear, "2026"); // snapshot says "Published by UQU: 2026-03-15"
  assert.ok(e.limitationsAr.some((l) => l.includes("ليست تقريرًا بحثيًا نهائيًا")));
});

test("web-source passages carry WEB_SECTION provenance and NEVER a PDF page number", () => {
  for (const e of [WEB_SOURCE_SIMULATION_UNIT, WEB_SOURCE_BRT_STUDY]) {
    assert.ok(e.passages.length > 0);
    for (const p of e.passages) {
      assert.equal(p.locator.type, "WEB_SECTION");
      assert.equal(p.extractionMethod, "WEB_SNAPSHOT_TEXT");
      assert.equal("page" in p.locator, false);
      assert.equal(typeof (p.locator as { section: string }).section, "string");
    }
  }
});

test("web-source passage text is the EXACT verbatim excerpt from the local snapshot", () => {
  const snapshot = readFileSync(path.join(ROOT, WEB_SNAPSHOT_SOURCE_FILE), "utf8");
  for (const e of [WEB_SOURCE_SIMULATION_UNIT, WEB_SOURCE_BRT_STUDY]) {
    for (const p of e.passages) {
      assert.ok(
        snapshot.includes(p.textAr),
        `${p.passageId} text must appear verbatim in ${WEB_SNAPSHOT_SOURCE_FILE}`,
      );
    }
  }
});

test("web sources assert no numeric research result (no digits in any passage)", () => {
  for (const e of [WEB_SOURCE_SIMULATION_UNIT, WEB_SOURCE_BRT_STUDY]) {
    for (const p of e.passages) {
      assert.equal(/[0-9٠-٩]/.test(p.textAr), false, `${p.passageId} must contain no digits`);
    }
  }
});

// -- corpus state ----------------------------------------------------------

test("production corpus is CORPUS_LOADED from the real approved web snapshot(s)", () => {
  assert.equal(researchCorpusState(), "CORPUS_LOADED");
  assert.equal(RESEARCH_CORPUS_PENDING_CODE, "CORPUS_PENDING_NEEDS_APPROVED_SOURCE");
  // the still-pending PDF seed does not count as loaded; the two web sources do
  assert.equal(isEntryLoaded(WEB_SOURCE_SIMULATION_UNIT), true);
  assert.equal(isEntryLoaded(WEB_SOURCE_BRT_STUDY), true);
  assert.equal(isEntryLoaded(SEED_RESEARCH_ENTRY), false);
});

test("the corpus contains exactly the three approved entries and no fake sources", () => {
  const c = getResearchCorpus();
  assert.equal(c.length, 3);
  assert.deepEqual(
    c.map((e) => e.researchId).sort(),
    [
      "UQU-HAJJ-1447-BRT-SIMULATION-STUDY",
      "UQU-HAJJ-INST-1447-NAWWARIYAH-SIM",
      "UQU-HAJJ-INSTITUTE-SIMULATION-UNIT",
    ],
  );
  for (const e of c) {
    assert.match(e.institutionAr, /جامعة أم القرى/);
    assert.match(e.publisherAr, /معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة/);
  }
});

test("getResearchCorpus returns copies — mutating the result cannot corrupt the corpus", () => {
  const c = getResearchCorpus();
  c[0].publicationStatus = "FINAL_REPORT";
  c[0].topicTags.push("مخترق");
  c[1].passages[0].locator.section = "hacked";
  assert.equal(getResearchEntryById(SEED_RESEARCH_ENTRY.researchId)!.publicationStatus, "INTERIM_REPORT");
  assert.equal(getResearchCorpus()[0].topicTags.includes("مخترق"), false);
  assert.equal(
    (getResearchCorpus()[1].passages[0].locator as { section: string }).section === "hacked",
    false,
  );
});
