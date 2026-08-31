// =============================================================================
// Research corpus — server-side entrypoints (Phase 8).
//
// Do NOT import from a client component: `ingestResearch` pulls in the PDF parser.
// =============================================================================

export type {
  ResearchPublicationStatus,
  ResearchSourceKind,
  ResearchLocator,
  ResearchSourceVerificationStatus,
  ResearchCorpusState,
  ResearchTheme,
  ResearchPassage,
  ResearchCorpusEntry,
} from "./types";
export { RESEARCH_CORPUS_PENDING_CODE } from "./types";
export {
  SEED_RESEARCH_ENTRY,
  WEB_SOURCE_SIMULATION_UNIT,
  WEB_SOURCE_BRT_STUDY,
  WEB_SNAPSHOT_SOURCE_FILE,
  WEB_SNAPSHOT_SHA256,
  WEB_SNAPSHOT_VERIFIED_AT,
  getResearchCorpus,
  getResearchEntryById,
  isEntryLoaded,
  researchCorpusState,
} from "./corpus";
export {
  verifyWebSnapshot,
  hashSnapshotBytes,
  type WebSnapshotVerification,
} from "./verifyWebSnapshot";
export {
  matchResearch,
  retrieveResearch,
  type ResearchRetrievalKind,
  type ResearchRetrievalResult,
  type ResearchRetrievalQuery,
} from "./retrieval";
export {
  ingestResearchPdf,
  MAX_RESEARCH_PDF_BYTES,
  OFFICIAL_RESEARCH_URL_PREFIXES,
  type ResearchIngestResult,
  type ResearchIngestFailureCode,
} from "./ingestResearch";
