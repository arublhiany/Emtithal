// =============================================================================
// Phase 6 tests — real XLSX parsing (read-excel-file) against a synthetic fixture.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseXlsx, columnLetters } from "@/lib/evidence/parseXlsx";
import { SAMPLE_XLSX_BYTES, MALFORMED_XLSX_BYTES } from "./fixtures";

test("columnLetters converts 0-based indices to spreadsheet letters", () => {
  assert.equal(columnLetters(0), "A");
  assert.equal(columnLetters(2), "C");
  assert.equal(columnLetters(25), "Z");
  assert.equal(columnLetters(26), "AA");
});

test("valid .xlsx is parsed with sheet + row + cell provenance", async () => {
  const parsed = await parseXlsx(SAMPLE_XLSX_BYTES());
  assert.deepEqual(parsed.sheetNames, ["Sheet1"]);
  assert.equal(parsed.truncated, false);

  const a1 = parsed.cells.find((c) => c.cellRef === "A1");
  assert.equal(a1?.sheet, "Sheet1");
  assert.equal(a1?.row, 1);
  assert.equal(a1?.column, "A");
  assert.equal(a1?.value, "Activity");

  // numeric cell keeps its type + exact position
  const c4 = parsed.cells.find((c) => c.cellRef === "C4");
  assert.equal(c4?.value, 3);
  assert.equal(typeof c4?.value, "number");
  assert.equal(c4?.row, 4);
  assert.equal(c4?.column, "C");
});

test("malformed workbook throws (caller maps to PARSE_FAILED)", async () => {
  await assert.rejects(() => parseXlsx(MALFORMED_XLSX_BYTES()));
});
