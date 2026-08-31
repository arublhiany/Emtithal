// =============================================================================
// Phase 6 tests — evidence ingestion orchestrator: validation, provenance,
// controlled failure codes, and the "parsed ≠ verified" invariant.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { ingestEvidence, DEFAULT_MAX_EVIDENCE_BYTES } from "@/lib/evidence";
import type { EvidenceInput } from "@/lib/evidence";
import {
  SAMPLE_PDF_BYTES,
  SAMPLE_XLSX_BYTES,
  MALFORMED_PDF_BYTES,
  MALFORMED_XLSX_BYTES,
  EMPTY_BYTES,
} from "./fixtures";

const baseInput = (over: Partial<EvidenceInput>): EvidenceInput => ({
  evidenceId: "ev-1",
  companyId: "demo-company-01",
  fileName: "file",
  extension: "pdf",
  bytes: EMPTY_BYTES(),
  uploadedAt: "2026-08-31T00:00:00.000Z",
  ...over,
});

test("PDF ingest → EXTRACTED with page-level provenance; never VERIFIED", async () => {
  const r = await ingestEvidence(
    baseInput({ fileName: "log.pdf", extension: "pdf", bytes: SAMPLE_PDF_BYTES() }),
  );
  assert.equal(r.ok, true);
  assert.equal(r.state, "EXTRACTED");
  assert.notEqual(r.state, "VERIFIED");
  assert.equal(r.extension, "pdf");
  assert.equal(r.pageCount, 1);
  assert.equal(r.facts.length, 1);
  assert.equal(r.facts[0].extractionMethod, "PDF_TEXT");
  assert.equal(r.facts[0].sourceLocator.kind, "PDF_PAGE");
  assert.equal(r.facts[0].sourceLocator.page, 1);
  assert.equal(r.facts[0].evidenceId, "ev-1");
  assert.equal(r.facts[0].fileName, "log.pdf");
  assert.match(r.facts[0].text, /Documented events and initiatives count: 3/);
  assert.equal(r.facts[0].factId, "ev-1#p1");
});

test("XLSX ingest → EXTRACTED with sheet + row + cell provenance; never VERIFIED", async () => {
  const r = await ingestEvidence(
    baseInput({ fileName: "log.xlsx", extension: "xlsx", bytes: SAMPLE_XLSX_BYTES() }),
  );
  assert.equal(r.ok, true);
  assert.equal(r.state, "EXTRACTED");
  assert.deepEqual(r.sheetNames, ["Sheet1"]);
  const c4 = r.facts.find((f) => f.sourceLocator.cellRef === "C4");
  assert.ok(c4);
  assert.equal(c4.extractionMethod, "XLSX_CELL");
  assert.equal(c4.sourceLocator.sheet, "Sheet1");
  assert.equal(c4.sourceLocator.row, 4);
  assert.equal(c4.sourceLocator.column, "C");
  assert.equal(c4.value, 3);
  assert.equal(c4.factId, "ev-1#Sheet1!C4");
});

test("unsupported file type → UNSUPPORTED_FILE_TYPE, state UPLOADED, no facts", async () => {
  const r = await ingestEvidence(
    baseInput({ fileName: "notes.docx", extension: "docx", bytes: new Uint8Array([1, 2, 3, 4]) }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "UNSUPPORTED_FILE_TYPE");
  assert.equal(r.state, "UPLOADED");
  assert.deepEqual(r.facts, []);
});

test("empty file → EMPTY_FILE", async () => {
  const r = await ingestEvidence(baseInput({ fileName: "x.pdf", extension: "pdf", bytes: EMPTY_BYTES() }));
  assert.equal(r.failureCode, "EMPTY_FILE");
  assert.equal(r.ok, false);
});

test("oversize file → FILE_TOO_LARGE (limit is enforced and configurable)", async () => {
  const big = new Uint8Array(20);
  big.set([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
  const r = await ingestEvidence(
    baseInput({ fileName: "x.pdf", extension: "pdf", bytes: big }),
    { maxBytes: 8 },
  );
  assert.equal(r.failureCode, "FILE_TOO_LARGE");
  assert.ok(DEFAULT_MAX_EVIDENCE_BYTES > 1024 * 1024);
});

test("wrong signature for the declared type → controlled PARSE_FAILED (no raw error)", async () => {
  const r = await ingestEvidence(
    baseInput({ fileName: "x.pdf", extension: "pdf", bytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]) }),
  );
  assert.equal(r.failureCode, "PARSE_FAILED");
  assert.equal(typeof r.message, "string");
});

test("malformed PDF (valid signature, junk body) → controlled PARSE_FAILED", async () => {
  const r = await ingestEvidence(
    baseInput({ fileName: "x.pdf", extension: "pdf", bytes: MALFORMED_PDF_BYTES() }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "PARSE_FAILED");
  assert.equal(r.state, "UPLOADED");
});

test("malformed XLSX (valid zip signature, junk body) → controlled PARSE_FAILED", async () => {
  const r = await ingestEvidence(
    baseInput({ fileName: "x.xlsx", extension: "xlsx", bytes: MALFORMED_XLSX_BYTES() }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.failureCode, "PARSE_FAILED");
});

test("MIME type is accepted when the extension is absent", async () => {
  const r = await ingestEvidence(
    baseInput({
      fileName: "log",
      extension: "",
      mimeType: "application/pdf",
      bytes: SAMPLE_PDF_BYTES(),
    }),
  );
  assert.equal(r.ok, true);
  assert.equal(r.extension, "pdf");
});
