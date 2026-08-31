// =============================================================================
// Deterministic file validation — runs BEFORE any parsing (Phase 6).
//
// Rejects, with a controlled code, anything that is not a small well-formed PDF
// or .xlsx. No macro execution, no external fetch, no dynamic code — this module
// only inspects the leading bytes and the size.
// =============================================================================

import type { EvidenceExtension, EvidenceIngestFailureCode } from "./types";

/** 10 MB. Callers may override per ingest. */
export const DEFAULT_MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

const EXT_BY_MIME: Record<string, EvidenceExtension> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

/** Normalises the declared extension / MIME to a supported `EvidenceExtension`, or null. */
export function resolveEvidenceExtension(input: {
  extension?: string;
  mimeType?: string;
  fileName?: string;
}): EvidenceExtension | null {
  const ext = input.extension?.trim().toLowerCase().replace(/^\./, "");
  if (ext === "pdf" || ext === "xlsx") return ext;
  const mime = input.mimeType?.trim().toLowerCase();
  if (mime && EXT_BY_MIME[mime]) return EXT_BY_MIME[mime];
  const fromName = input.fileName?.toLowerCase().match(/\.(pdf|xlsx)$/)?.[1];
  return fromName === "pdf" || fromName === "xlsx" ? fromName : null;
}

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  return sig.every((b, i) => bytes[i] === b);
}

const PDF_SIG = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
const ZIP_SIG = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04" (xlsx is a zip)

export interface EvidenceValidation {
  ok: boolean;
  extension: EvidenceExtension | null;
  failureCode: EvidenceIngestFailureCode | null;
  message: string | null;
}

export function validateEvidenceFile(
  input: { extension?: string; mimeType?: string; fileName?: string; bytes: Uint8Array },
  opts: { maxBytes?: number } = {},
): EvidenceValidation {
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_EVIDENCE_BYTES;
  const extension = resolveEvidenceExtension(input);

  if (!extension) {
    return {
      ok: false,
      extension: null,
      failureCode: "UNSUPPORTED_FILE_TYPE",
      message: "Only .pdf and .xlsx are supported in this version.",
    };
  }
  if (input.bytes.length === 0) {
    return { ok: false, extension, failureCode: "EMPTY_FILE", message: "The file is empty." };
  }
  if (input.bytes.length > maxBytes) {
    return {
      ok: false,
      extension,
      failureCode: "FILE_TOO_LARGE",
      message: `The file exceeds the ${Math.floor(maxBytes / (1024 * 1024))} MB limit.`,
    };
  }

  const sigOk =
    extension === "pdf" ? startsWith(input.bytes, PDF_SIG) : startsWith(input.bytes, ZIP_SIG);
  if (!sigOk) {
    return {
      ok: false,
      extension,
      failureCode: "PARSE_FAILED",
      message: `The file signature does not match a .${extension}.`,
    };
  }

  return { ok: true, extension, failureCode: null, message: null };
}
