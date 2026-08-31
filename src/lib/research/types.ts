// =============================================================================
// Research corpus — shared types (Phase 8). Server-side.
//
// Research is DECISION SUPPORT ONLY. Nothing here can create a regulatory
// requirement, change applicability / compliance status / readiness / coverage /
// blockers, create an official weight / penalty / integration, resolve an
// UNRESOLVED_REQUIREMENT, mark evidence VERIFIED, or be presented as Ministry
// regulation. Research findings and regulatory truth stay completely separate.
// =============================================================================

/** Explicit, STORED publication status — never derived from title wording at runtime. */
export type ResearchPublicationStatus =
  | "INTERIM_REPORT"
  | "FINAL_REPORT"
  | "EXECUTIVE_SUMMARY"
  | "OTHER_APPROVED";

/**
 * How an approved source is published / captured. Provenance is NOT PDF-only.
 *  - PDF_REPORT        — a downloadable official PDF report (page-level provenance)
 *  - OFFICIAL_WEB_PAGE — an official UQU/Institute web page (section-level provenance)
 *  - OFFICIAL_STUDY_PAGE — an official study/project page (NOT a final report)
 */
export type ResearchSourceKind = "PDF_REPORT" | "OFFICIAL_WEB_PAGE" | "OFFICIAL_STUDY_PAGE";

/**
 * Where a passage lives in its source. A PDF passage has a real 1-based page; a
 * web passage has a section label and NEVER a page number — a PDF page is never
 * invented for a web source.
 */
export type ResearchLocator =
  | { type: "PDF_PAGE"; page: number; section: string | null }
  | { type: "WEB_SECTION"; section: string };

/**
 * Local provenance state of a source:
 *  - OFFICIAL_SOURCE_VERIFIED_LOCAL       — a real official PDF ingested locally with page provenance
 *  - OFFICIAL_WEB_SNAPSHOT_VERIFIED_LOCAL — a real official web page captured in a locally hashed snapshot
 *  - PENDING_LOCAL_INGESTION              — bibliographic metadata only; nothing ingested
 */
export type ResearchSourceVerificationStatus =
  | "OFFICIAL_SOURCE_VERIFIED_LOCAL"
  | "OFFICIAL_WEB_SNAPSHOT_VERIFIED_LOCAL"
  | "PENDING_LOCAL_INGESTION";

/** Reuses the Phase 1/4 concept. `CORPUS_LOADED` only when a real source is ingested. */
export type ResearchCorpusState = "CORPUS_PENDING" | "CORPUS_LOADED";

/** Machine code for the "official source not yet ingested locally" state. */
export const RESEARCH_CORPUS_PENDING_CODE = "CORPUS_PENDING_NEEDS_APPROVED_SOURCE" as const;

/** Approved research theme(s). Curated — not model-derived. */
export type ResearchTheme = "OPERATIONAL_SIMULATION_AND_DECISION_SUPPORT";

/**
 * One real extracted passage from an approved source, with real provenance.
 * `locator` is the single source of truth for where it came from — a PDF page
 * (`PDF_PAGE`) or an official-web section (`WEB_SECTION`). A `WEB_SECTION`
 * passage never carries a page number.
 */
export interface ResearchPassage {
  passageId: string; // `${researchId}#p${page}` (PDF) or `${researchId}#web-N` (web)
  locator: ResearchLocator;
  textAr: string; // verbatim extracted / captured text — never paraphrased
  extractionMethod: "PDF_TEXT" | "WEB_SNAPSHOT_TEXT";
}

export interface ResearchCorpusEntry {
  researchId: string;
  titleAr: string;
  publisherAr: string;
  institutionAr: string;
  /** e.g. "1447H", or null when the source is not tied to a Hajj/Umrah season. */
  researchSeason: string | null;
  /**
   * The year the source was PUBLISHED, e.g. "2026". `null` when no explicit
   * publication date is established. NEVER inferred from a page "last modified"
   * date — that is not evidence of a publication year.
   */
  publicationYear: string | null;
  /** STORED explicitly. Never inferred from the title at runtime. */
  publicationStatus: ResearchPublicationStatus;
  /** How the source is published / captured — PDF report vs official web/study page. */
  sourceKind: ResearchSourceKind;
  theme: ResearchTheme;
  /** Curated approved topic tags — the deterministic retrieval matches on these. */
  topicTags: string[];
  /** Exact citation string for the official publication. */
  officialSourceReference: string;
  /** Official URL under uqu.edu.sa (web) / drive.uqu.edu.sa (PDF) only, or null when not established. */
  officialUrl: string | null;
  /** Human description of where the official document lives (for local ingestion). */
  approvedSourceLocator: string;
  /** sha256 of the ingested PDF bytes — set only when a real PDF was ingested. */
  documentHash: string | null;
  /** sha256 of the local official-web snapshot file — set only for a verified web snapshot. */
  snapshotHash: string | null;
  /**
   * ISO 8601 — when a real PDF / source was actually INGESTED locally. Reserved
   * for PDF (or equivalent) ingestion; `null` for a web-snapshot-only source.
   */
  ingestedAt: string | null;
  /**
   * ISO 8601 — when the local official-web snapshot was VERIFIED inside this
   * repository (a re-hash matching `snapshotHash`). It is NOT a UQU publication
   * date and NOT the page's last-modified date. `null` for non-web-snapshot sources.
   */
  snapshotVerifiedAt: string | null;
  sourceVerificationStatus: ResearchSourceVerificationStatus;
  scopeAr: string;
  limitationsAr: string[];
  /** Real extracted passages. EMPTY until the source is ingested / snapshot-verified locally. */
  passages: ResearchPassage[];
}
