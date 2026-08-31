// =============================================================================
// Phase 8 tests — research PDF ingestion plumbing (reuses the Phase 6 parser).
//
// The REAL official Institute PDF is NOT available in this environment. These
// tests exercise the ingestion PATH (validate → parse → hash → page provenance)
// against the synthetic Phase 6 Arabic PDF fixture and a CLEARLY SYNTHETIC base
// entry + a synthetic `example.invalid` URL. Nothing here is a real page,
// statistic, finding, or the real publication. The live approved corpus stays
// CORPUS_PENDING.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  OFFICIAL_RESEARCH_URL_PREFIXES,
  ingestResearchPdf,
  type ResearchCorpusEntry,
} from "@/lib/research";
import {
  SAMPLE_ARABIC_PDF_BYTES,
  SAMPLE_ARABIC_PDF_PHRASE,
  MALFORMED_PDF_BYTES,
  EMPTY_BYTES,
} from "@/lib/evidence/__tests__/fixtures";

/** A clearly SYNTHETIC base entry — NOT the real pending seed publication. */
const SYNTHETIC_BASE: ResearchCorpusEntry = {
  researchId: "TEST-RESEARCH-INGEST-FIXTURE",
  titleAr: "[نص اختباري تركيبي] سجل بحثي وهمي لاختبار مسار الإدخال فقط",
  publisherAr: "[نص اختباري] ناشر تجريبي",
  institutionAr: "[نص اختباري] مؤسسة تجريبية",
  researchSeason: "1447H",
  publicationYear: "2026",
  publicationStatus: "INTERIM_REPORT",
  sourceKind: "PDF_REPORT",
  theme: "OPERATIONAL_SIMULATION_AND_DECISION_SUPPORT",
  topicTags: ["اختبار"],
  officialSourceReference: "[نص اختباري] مرجع تجريبي",
  officialUrl: null,
  approvedSourceLocator: "[نص اختباري] موضع تجريبي",
  documentHash: null,
  snapshotHash: null,
  ingestedAt: null,
  snapshotVerifiedAt: null,
  sourceVerificationStatus: "PENDING_LOCAL_INGESTION",
  scopeAr: "[نص اختباري] نطاق تجريبي",
  limitationsAr: ["[نص اختباري] قيد تجريبي"],
  passages: [],
};

// Synthetic URL — the ingest guard is a testing seam here (production keeps the uqu-only default).
const SYNTHETIC_URL = "https://example.invalid/synthetic-research-fixture.pdf";
const SYNTHETIC_OPTS = { allowedUrlPrefixes: ["https://example.invalid/"] };

test("the default official-URL guard accepts only uqu.edu.sa / drive.uqu.edu.sa", async () => {
  assert.deepEqual(OFFICIAL_RESEARCH_URL_PREFIXES, [
    "https://uqu.edu.sa/",
    "https://drive.uqu.edu.sa/",
  ]);
  // default guard rejects a synthetic / non-official URL
  const r = await ingestResearchPdf(SYNTHETIC_BASE, SAMPLE_ARABIC_PDF_BYTES(), SYNTHETIC_URL);
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "UNSUPPORTED_FILE_TYPE");
  assert.equal(r.entry, null);
});

test("ingestion plumbing preserves real page provenance and sets a document hash (synthetic inputs)", async () => {
  const r = await ingestResearchPdf(
    SYNTHETIC_BASE,
    SAMPLE_ARABIC_PDF_BYTES(),
    SYNTHETIC_URL,
    SYNTHETIC_OPTS,
  );
  assert.equal(r.ok, true);
  assert.equal(r.pageCount, 1);
  const e = r.entry!;
  assert.equal(e.researchId, "TEST-RESEARCH-INGEST-FIXTURE");
  assert.equal(e.sourceVerificationStatus, "OFFICIAL_SOURCE_VERIFIED_LOCAL");
  assert.equal(e.publicationStatus, "INTERIM_REPORT"); // carried through — never changed on ingestion
  assert.equal(e.passages.length, 1);
  assert.deepEqual(e.passages[0].locator, { type: "PDF_PAGE", page: 1, section: null });
  assert.equal(e.passages[0].passageId, "TEST-RESEARCH-INGEST-FIXTURE#p1");
  assert.equal(e.passages[0].extractionMethod, "PDF_TEXT");
  // real Arabic characters extracted from the SYNTHETIC fixture (order-independent)
  const chars = (s: string) => [...s.replace(/\s/g, "")].sort().join("");
  assert.equal(chars(e.passages[0].textAr), chars(SAMPLE_ARABIC_PDF_PHRASE));
  assert.match(e.documentHash ?? "", /^[0-9a-f]{64}$/);
  assert.match(e.ingestedAt ?? "", /^\d{4}-\d\d-\d\dT/);
  assert.equal(e.officialUrl, SYNTHETIC_URL);
});

test("an empty file → EMPTY_FILE; a malformed PDF → controlled PARSE_FAILED", async () => {
  const empty = await ingestResearchPdf(SYNTHETIC_BASE, EMPTY_BYTES(), SYNTHETIC_URL, SYNTHETIC_OPTS);
  assert.equal(empty.failureCode, "EMPTY_FILE");
  const bad = await ingestResearchPdf(
    SYNTHETIC_BASE,
    MALFORMED_PDF_BYTES(),
    SYNTHETIC_URL,
    SYNTHETIC_OPTS,
  );
  assert.equal(bad.failureCode, "PARSE_FAILED");
  assert.equal(bad.entry, null);
});
