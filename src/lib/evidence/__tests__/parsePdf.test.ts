// =============================================================================
// Phase 6 tests — real PDF parsing (unpdf) against a synthetic fixture.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { parsePdf } from "@/lib/evidence/parsePdf";
import {
  SAMPLE_PDF_BYTES,
  SAMPLE_ARABIC_PDF_BYTES,
  SAMPLE_ARABIC_PDF_PHRASE,
  MALFORMED_PDF_BYTES,
  EMPTY_BYTES,
} from "./fixtures";

test("valid PDF is parsed and page provenance is preserved", async () => {
  const parsed = await parsePdf(SAMPLE_PDF_BYTES());
  assert.equal(parsed.pageCount, 1);
  assert.equal(parsed.pages.length, 1);
  assert.equal(parsed.pages[0].page, 1);
  assert.match(parsed.pages[0].text, /Happiness Team Activities Log/);
  assert.match(parsed.pages[0].text, /Documented events and initiatives count: 3/);
  assert.equal(parsed.pages[0].truncated, false);
});

test("Arabic PDF: the real unpdf path extracts usable Arabic text + page provenance (no OCR)", async () => {
  const parsed = await parsePdf(SAMPLE_ARABIC_PDF_BYTES());
  assert.equal(parsed.pageCount, 1);
  assert.equal(parsed.pages[0].page, 1);
  const text = parsed.pages[0].text;
  // real Arabic script came through
  assert.match(text, /[ء-ي]/);
  // every character of the phrase was extracted, none fabricated (order-independent)
  const chars = (s: string) => [...s.replace(/\s/g, "")].sort().join("");
  assert.equal(chars(text), chars(SAMPLE_ARABIC_PDF_PHRASE));
  // at least one whole word survives (as-is or reversed — synthetic PDF has no shaping/bidi)
  const rev = (w: string) => [...w].reverse().join("");
  const words = SAMPLE_ARABIC_PDF_PHRASE.split(" ");
  assert.ok(
    words.some((w) => text.includes(w) || text.includes(rev(w))),
    `expected a recognisable Arabic word in: ${text}`,
  );
});

test("malformed PDF throws (caller maps to PARSE_FAILED)", async () => {
  await assert.rejects(() => parsePdf(MALFORMED_PDF_BYTES()));
});

test("empty bytes throw (caller rejects EMPTY_FILE before this is reached)", async () => {
  await assert.rejects(() => parsePdf(EMPTY_BYTES()));
});
