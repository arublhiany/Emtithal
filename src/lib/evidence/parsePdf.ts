// =============================================================================
// PDF text extraction — the ONLY module that imports `unpdf` (Phase 6).
//
// Server-side only. `unpdf` bundles a serverless build of PDF.js; it runs no
// scripts, fetches nothing, and only reads text. Page provenance is preserved:
// one segment per page, `page` is the 1-based page number from the parser.
// Never fabricates a page.
// =============================================================================

import { extractText } from "unpdf";

if (typeof window !== "undefined") {
  throw new Error("parsePdf is server-only and must not run in the browser.");
}

/** Longest text kept per page — guards against a pathological page. */
export const MAX_PDF_PAGE_CHARS = 20_000;

export interface ParsedPdfPage {
  page: number;
  text: string;
  truncated: boolean;
}

export interface ParsedPdf {
  pageCount: number;
  pages: ParsedPdfPage[];
}

function normalisePageText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t  ]+/g, " ").trim())
    .join("\n")
    .trim();
}

/** Extracts per-page text. Throws on a malformed PDF — the caller maps that to PARSE_FAILED. */
export async function parsePdf(bytes: Uint8Array): Promise<ParsedPdf> {
  const { totalPages, text } = await extractText(new Uint8Array(bytes), { mergePages: false });
  const pages: ParsedPdfPage[] = [];
  for (let i = 0; i < text.length; i++) {
    const raw = normalisePageText(text[i] ?? "");
    if (raw === "") continue;
    const truncated = raw.length > MAX_PDF_PAGE_CHARS;
    pages.push({
      page: i + 1,
      text: truncated ? raw.slice(0, MAX_PDF_PAGE_CHARS) : raw,
      truncated,
    });
  }
  return { pageCount: totalPages, pages };
}
