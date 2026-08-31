// =============================================================================
// Evidence ingestion — server-side entrypoints (Phase 6).
//
// Do NOT import from a client component: this pulls in the PDF / XLSX parsers.
// =============================================================================

export type {
  EvidenceExtension,
  EvidenceExtractionMethod,
  EvidenceIngestFailureCode,
  EvidenceState,
  EvidenceInput,
  EvidenceSourceLocator,
  ExtractedEvidenceFact,
  EvidenceExtractionResult,
} from "./types";
export {
  ingestEvidence,
  DEFAULT_MAX_EVIDENCE_BYTES,
  type IngestOptions,
} from "./ingestEvidence";
export {
  validateEvidenceFile,
  resolveEvidenceExtension,
  type EvidenceValidation,
} from "./validate";
export { parsePdf, type ParsedPdf, type ParsedPdfPage } from "./parsePdf";
export { parseXlsx, columnLetters, type ParsedXlsx, type ParsedXlsxCell } from "./parseXlsx";
