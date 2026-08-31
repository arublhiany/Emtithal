// =============================================================================
// Research PDF ingestion (Phase 8) — reuses the Phase 6 PDF parser.
//
// Given the bytes of an APPROVED official publication (Institute / UQU), this
// validates + parses it and returns a corpus entry with REAL page provenance.
// It never invents a page, section, author, result, sample size, percentage, or
// recommendation. Server-side only.
// =============================================================================

import { createHash } from "node:crypto";
import { parsePdf, validateEvidenceFile } from "@/lib/evidence";
import type { ResearchCorpusEntry, ResearchPassage } from "./types";

if (typeof window !== "undefined") {
  throw new Error("ingestResearch is server-only and must not run in the browser.");
}

export type ResearchIngestFailureCode =
  | "UNSUPPORTED_FILE_TYPE"
  | "EMPTY_FILE"
  | "FILE_TOO_LARGE"
  | "PARSE_FAILED"
  | "NO_EXTRACTABLE_TEXT";

export interface ResearchIngestResult {
  ok: boolean;
  researchId: string;
  entry: ResearchCorpusEntry | null;
  pageCount: number | null;
  failureCode: ResearchIngestFailureCode | null;
  message: string | null;
}

export const MAX_RESEARCH_PDF_BYTES = 60 * 1024 * 1024;

/** The only URL prefixes accepted as an official approved research locator. */
export const OFFICIAL_RESEARCH_URL_PREFIXES = [
  "https://uqu.edu.sa/",
  "https://drive.uqu.edu.sa/",
] as const;

function isOfficialResearchUrl(url: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => url.toLowerCase().startsWith(p));
}

/**
 * Ingests an approved publication's PDF into `base` (its bibliographic metadata),
 * populating real `passages`, `documentHash`, `ingestedAt`, and flipping
 * `sourceVerificationStatus` to `OFFICIAL_SOURCE_VERIFIED_LOCAL`.
 * `officialUrl` must be an official uqu.edu.sa / drive.uqu.edu.sa locator (the
 * default). `opts.allowedUrlPrefixes` is a testing seam ONLY — production callers
 * must not override it.
 */
export async function ingestResearchPdf(
  base: ResearchCorpusEntry,
  bytes: Uint8Array,
  officialUrl: string,
  opts: { maxBytes?: number; allowedUrlPrefixes?: readonly string[] } = {},
): Promise<ResearchIngestResult> {
  const fail = (
    failureCode: ResearchIngestFailureCode,
    message: string,
  ): ResearchIngestResult => ({
    ok: false,
    researchId: base.researchId,
    entry: null,
    pageCount: null,
    failureCode,
    message,
  });

  const prefixes = opts.allowedUrlPrefixes ?? OFFICIAL_RESEARCH_URL_PREFIXES;
  if (!isOfficialResearchUrl(officialUrl, prefixes)) {
    return fail("UNSUPPORTED_FILE_TYPE", "officialUrl must be an official uqu.edu.sa locator.");
  }

  const v = validateEvidenceFile(
    { extension: "pdf", fileName: "research.pdf", bytes },
    { maxBytes: opts.maxBytes ?? MAX_RESEARCH_PDF_BYTES },
  );
  if (!v.ok) {
    return fail(v.failureCode as ResearchIngestFailureCode, v.message ?? "Invalid research PDF.");
  }

  let parsed;
  try {
    parsed = await parsePdf(bytes);
  } catch (err) {
    return fail("PARSE_FAILED", `The research PDF could not be parsed.${err instanceof Error ? ` (${err.name})` : ""}`);
  }

  if (parsed.pages.length === 0) {
    return fail("NO_EXTRACTABLE_TEXT", "No extractable text found (image-only PDF; no OCR in this version).");
  }

  const passages: ResearchPassage[] = parsed.pages.map((p) => ({
    passageId: `${base.researchId}#p${p.page}`,
    locator: { type: "PDF_PAGE", page: p.page, section: null },
    textAr: p.text,
    extractionMethod: "PDF_TEXT",
  }));

  const entry: ResearchCorpusEntry = {
    ...base,
    officialUrl,
    documentHash: createHash("sha256").update(bytes).digest("hex"),
    ingestedAt: new Date().toISOString(),
    sourceVerificationStatus: "OFFICIAL_SOURCE_VERIFIED_LOCAL",
    // publicationStatus is carried through from `base` — NEVER changed on ingestion.
    passages,
  };

  return {
    ok: true,
    researchId: base.researchId,
    entry,
    pageCount: parsed.pageCount,
    failureCode: null,
    message: null,
  };
}
