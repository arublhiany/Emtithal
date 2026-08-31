// =============================================================================
// XLSX data extraction — the ONLY module that imports `read-excel-file` (Phase 6).
//
// Server-side only. `read-excel-file` is a SAX XML reader: it never evaluates a
// macro, a formula result beyond the stored value, or an external reference.
// Provenance is preserved per cell: sheet name + 1-based row + column letters +
// A1 reference. Never fabricates a sheet, row, or cell.
// =============================================================================

import readXlsxFile from "read-excel-file/node";

if (typeof window !== "undefined") {
  throw new Error("parseXlsx is server-only and must not run in the browser.");
}

/** Cap on emitted cells across the whole workbook — guards against a huge sheet. */
export const MAX_XLSX_CELLS = 2_000;

export interface ParsedXlsxCell {
  sheet: string;
  /** 1-based. */
  row: number;
  /** Column letters, e.g. "A", "B", "AA". */
  column: string;
  /** A1-style reference, e.g. "C3". */
  cellRef: string;
  value: string | number;
  text: string;
}

export interface ParsedXlsx {
  sheetNames: string[];
  cells: ParsedXlsxCell[];
  truncated: boolean;
}

/** 0-based column index → letters (0 → "A", 26 → "AA"). */
export function columnLetters(index: number): string {
  let n = index;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/** Reads every non-empty cell with provenance. Throws on a malformed workbook. */
export async function parseXlsx(bytes: Uint8Array): Promise<ParsedXlsx> {
  const sheets = await readXlsxFile(Buffer.from(bytes));
  const sheetNames = sheets.map((s) => s.sheet);
  const cells: ParsedXlsxCell[] = [];
  let truncated = false;

  outer: for (const { sheet, data } of sheets) {
    for (let r = 0; r < data.length; r++) {
      const row = data[r] ?? [];
      for (let c = 0; c < row.length; c++) {
        const raw = row[c];
        if (raw == null || raw === "") continue;
        if (cells.length >= MAX_XLSX_CELLS) {
          truncated = true;
          break outer;
        }
        const column = columnLetters(c);
        const rowNo = r + 1;
        const value: string | number = typeof raw === "number" ? raw : cellText(raw);
        cells.push({
          sheet,
          row: rowNo,
          column,
          cellRef: `${column}${rowNo}`,
          value,
          text: cellText(raw),
        });
      }
    }
  }

  return { sheetNames, cells, truncated };
}
