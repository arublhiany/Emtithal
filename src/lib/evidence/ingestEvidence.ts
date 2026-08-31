// =============================================================================
// Evidence ingestion orchestrator (Phase 6). Server-side only.
//
//   validate (deterministic) → parse (pdf | xlsx) → ExtractedEvidenceFact[]
//
// Output is UPLOADED (on any failure) or EXTRACTED (on success) — NEVER VERIFIED.
// A successfully parsed document is not compliance and not verified. Raw parser
// errors are caught and returned as a controlled PARSE_FAILED.
// =============================================================================

import type {
  EvidenceExtractionResult,
  EvidenceInput,
  ExtractedEvidenceFact,
} from "./types";
import { DEFAULT_MAX_EVIDENCE_BYTES, validateEvidenceFile } from "./validate";
import { parsePdf } from "./parsePdf";
import { parseXlsx } from "./parseXlsx";

if (typeof window !== "undefined") {
  throw new Error("ingestEvidence is server-only and must not run in the browser.");
}

export { DEFAULT_MAX_EVIDENCE_BYTES };

export interface IngestOptions {
  maxBytes?: number;
}

function fail(
  input: EvidenceInput,
  extension: EvidenceExtractionResult["extension"],
  failureCode: NonNullable<EvidenceExtractionResult["failureCode"]>,
  message: string,
): EvidenceExtractionResult {
  return {
    ok: false,
    evidenceId: input.evidenceId,
    companyId: input.companyId,
    fileName: input.fileName,
    extension,
    state: "UPLOADED",
    facts: [],
    pageCount: null,
    sheetNames: null,
    failureCode,
    message,
    notes: [],
  };
}

export async function ingestEvidence(
  input: EvidenceInput,
  opts: IngestOptions = {},
): Promise<EvidenceExtractionResult> {
  const v = validateEvidenceFile(
    { extension: input.extension, mimeType: input.mimeType, fileName: input.fileName, bytes: input.bytes },
    { maxBytes: opts.maxBytes ?? DEFAULT_MAX_EVIDENCE_BYTES },
  );
  if (!v.ok) return fail(input, v.extension, v.failureCode!, v.message!);

  const notes: string[] = [];
  const facts: ExtractedEvidenceFact[] = [];

  try {
    if (v.extension === "pdf") {
      const parsed = await parsePdf(input.bytes);
      for (const p of parsed.pages) {
        facts.push({
          factId: `${input.evidenceId}#p${p.page}`,
          text: p.text,
          value: p.text,
          evidenceId: input.evidenceId,
          fileName: input.fileName,
          sourceLocator: { kind: "PDF_PAGE", page: p.page },
          extractionMethod: "PDF_TEXT",
        });
        if (p.truncated) notes.push(`page ${p.page} text truncated at the per-page limit`);
      }
      if (facts.length === 0) notes.push("no extractable text found (the PDF may be image-only; no OCR in this version)");
      return {
        ok: true,
        evidenceId: input.evidenceId,
        companyId: input.companyId,
        fileName: input.fileName,
        extension: "pdf",
        state: "EXTRACTED",
        facts,
        pageCount: parsed.pageCount,
        sheetNames: null,
        failureCode: null,
        message: null,
        notes,
      };
    }

    // xlsx
    const parsed = await parseXlsx(input.bytes);
    for (const cell of parsed.cells) {
      facts.push({
        factId: `${input.evidenceId}#${cell.sheet}!${cell.cellRef}`,
        text: cell.text,
        value: cell.value,
        evidenceId: input.evidenceId,
        fileName: input.fileName,
        sourceLocator: {
          kind: "XLSX_CELL",
          sheet: cell.sheet,
          row: cell.row,
          column: cell.column,
          cellRef: cell.cellRef,
        },
        extractionMethod: "XLSX_CELL",
      });
    }
    if (parsed.truncated) notes.push("cell extraction stopped at the workbook cell limit");
    if (facts.length === 0) notes.push("the workbook contains no usable data cells");
    return {
      ok: true,
      evidenceId: input.evidenceId,
      companyId: input.companyId,
      fileName: input.fileName,
      extension: "xlsx",
      state: "EXTRACTED",
      facts,
      pageCount: null,
      sheetNames: parsed.sheetNames,
      failureCode: null,
      message: null,
      notes,
    };
  } catch (err) {
    const ext = v.extension ?? "file";
    return fail(
      input,
      v.extension,
      "PARSE_FAILED",
      `The ${ext.toUpperCase()} could not be parsed.` +
        (err instanceof Error ? ` (${err.name})` : ""),
    );
  }
}
