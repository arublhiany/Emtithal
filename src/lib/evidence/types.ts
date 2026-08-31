// =============================================================================
// Evidence ingestion — shared types (Phase 6). Server-side only.
//
// Evidence is NOT compliance. This layer extracts facts and their provenance
// from a PDF or an .xlsx file; it never decides a compliance status, a
// readiness value, or verification coverage. Downstream (the deterministic
// verification engine + human review) owns those.
// =============================================================================

/** Phase 6 supported evidence file types. No Word / CSV / images / OCR. */
export type EvidenceExtension = "pdf" | "xlsx";

export type EvidenceExtractionMethod = "PDF_TEXT" | "XLSX_CELL";

/** Controlled ingestion failure codes — raw parser errors never reach a consumer. */
export type EvidenceIngestFailureCode =
  | "UNSUPPORTED_FILE_TYPE"
  | "EMPTY_FILE"
  | "FILE_TOO_LARGE"
  | "PARSE_FAILED";

/**
 * Evidence lifecycle. Phase 6 produces only UPLOADED / EXTRACTED (ingest) and
 * AI_INTERPRETED (evidence agent). VERIFIED is set ONLY by a later deterministic
 * / human-approved process — a successfully parsed document is never VERIFIED.
 */
export type EvidenceState = "UPLOADED" | "EXTRACTED" | "AI_INTERPRETED" | "VERIFIED";

export interface EvidenceInput {
  evidenceId: string;
  companyId: string;
  fileName: string;
  /** Lowercase extension without a dot (e.g. "pdf"), or a MIME type we can map. */
  extension: string;
  mimeType?: string;
  /** The file contents held server-side. Never a URL — this layer fetches nothing. */
  bytes: Uint8Array;
  /** ISO 8601. */
  uploadedAt: string;
  /** Optional company-declared document type (Arabic label). */
  declaredDocTypeAr?: string;
}

/** Where in the source file an extracted fact came from. Never fabricated. */
export interface EvidenceSourceLocator {
  kind: "PDF_PAGE" | "XLSX_CELL";
  /** PDF: 1-based page number. */
  page?: number;
  /** XLSX: sheet name. */
  sheet?: string;
  /** XLSX: 1-based row number. */
  row?: number;
  /** XLSX: column letters (A, B, …, AA). */
  column?: string;
  /** XLSX: A1-style cell reference (e.g. "C3"). */
  cellRef?: string;
}

/**
 * One deterministically extracted fact. Produced by the parser, NOT the LLM.
 * Carries no interpretation / confidence — it is raw content plus provenance.
 */
export interface ExtractedEvidenceFact {
  /** Deterministic, stable: `${evidenceId}#<locator key>`. */
  factId: string;
  /** Verbatim extracted text for this segment. */
  text: string;
  /** The typed value where available (XLSX numbers), else the text. */
  value: string | number;
  evidenceId: string;
  fileName: string;
  sourceLocator: EvidenceSourceLocator;
  extractionMethod: EvidenceExtractionMethod;
}

export interface EvidenceExtractionResult {
  ok: boolean;
  evidenceId: string;
  companyId: string;
  fileName: string;
  extension: EvidenceExtension | null;
  /** UPLOADED on failure (nothing was read), EXTRACTED on success. Never VERIFIED. */
  state: "UPLOADED" | "EXTRACTED";
  facts: ExtractedEvidenceFact[];
  /** PDF only. */
  pageCount: number | null;
  /** XLSX only. */
  sheetNames: string[] | null;
  failureCode: EvidenceIngestFailureCode | null;
  /** Non-secret, consumer-safe message. */
  message: string | null;
  notes: string[];
}
