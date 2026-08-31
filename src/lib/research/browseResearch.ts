// =============================================================================
// Research support — client-safe browse/search over the APPROVED research
// corpus (Phase 8). Pure, no LLM, no PDF parser, no network. Imports only the
// corpus data module (never the `./index` barrel, which pulls in the ingester).
//
// This powers the visible "دعم بحثي" product feature. It exposes ONLY display
// fields already present in the approved corpus — verbatim passages, curated
// scope, stored provenance. It never fabricates an insight for a source whose
// official document has not been ingested locally.
// =============================================================================

import { getResearchCorpus, isEntryLoaded } from "./corpus";
import type {
  ResearchCorpusEntry,
  ResearchPublicationStatus,
  ResearchSourceKind,
} from "./types";

const SOURCE_KIND_AR: Record<ResearchSourceKind, string> = {
  PDF_REPORT: "تقرير بحثي",
  OFFICIAL_WEB_PAGE: "صفحة رسمية",
  OFFICIAL_STUDY_PAGE: "صفحة دراسة رسمية",
};

const PUBLICATION_STATUS_AR: Record<ResearchPublicationStatus, string> = {
  INTERIM_REPORT: "تقرير مرحلي",
  FINAL_REPORT: "تقرير نهائي",
  EXECUTIVE_SUMMARY: "ملخص تنفيذي",
  OTHER_APPROVED: "مصدر معتمد",
};

/** One searchable research result — display fields only. */
export interface ResearchResultView {
  researchId: string;
  titleAr: string;
  /** Organization / source (the publishing institute). */
  publisherAr: string;
  institutionAr: string;
  sourceKindAr: string;
  publicationStatusAr: string;
  publicationYear: string | null;
  seasonAr: string | null;
  /** Concise, verbatim insight from the source — null when none is available. */
  insightAr: string | null;
  insightLocatorAr: string | null;
  /** How the source may support a decision (curated scope). */
  decisionSupportAr: string;
  topicTags: string[];
  limitationsAr: string[];
  /** Provenance. */
  officialSourceReference: string;
  officialUrl: string | null;
  provenanceNoteAr: string;
}

/** A source that exists in the corpus but whose official document is not yet available. */
export interface PendingResearchView {
  researchId: string;
  titleAr: string;
  publisherAr: string;
  statusAr: string;
  officialSourceReference: string;
}

export interface ResearchSearchResponse {
  query: string;
  results: ResearchResultView[];
  /** Approved sources awaiting their official document — shown, never fabricated. */
  pending: PendingResearchView[];
}

// -- text matching (self-contained; no dependency on the AI retrieval module) --

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, "") // Arabic diacritics
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set(
  [
    "في", "من", "الى", "على", "عن", "مع", "او", "لا", "له", "لها", "ما", "هذا",
    "هذه", "التي", "الذي", "هو", "هي", "ثم", "قد", "كل", "بعض", "بين", "عند",
    "دون", "غير", "اي", "اذا", "كما", "حيث", "بها", "به", "الحج", "العمره",
    "الحجاج", "المعتمرين", "موضوع", "علاقه",
  ].map(norm),
);

/** Query terms worth matching on: normalised, >= 3 chars, not a stopword. */
function terms(s: string): string[] {
  return norm(s)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function haystackWords(e: ResearchCorpusEntry): string[] {
  return norm(
    [e.titleAr, e.publisherAr, e.institutionAr, e.scopeAr, ...e.topicTags].join(" "),
  )
    .split(" ")
    .filter(Boolean);
}

function toView(e: ResearchCorpusEntry): ResearchResultView {
  const p = e.passages[0];
  return {
    researchId: e.researchId,
    titleAr: e.titleAr,
    publisherAr: e.publisherAr,
    institutionAr: e.institutionAr,
    sourceKindAr: SOURCE_KIND_AR[e.sourceKind],
    publicationStatusAr: PUBLICATION_STATUS_AR[e.publicationStatus],
    publicationYear: e.publicationYear,
    seasonAr: e.researchSeason,
    insightAr: p ? p.textAr : null,
    insightLocatorAr: p
      ? p.locator.type === "WEB_SECTION"
        ? "مقتطف من المصدر الرسمي"
        : `صفحة ${p.locator.page}`
      : null,
    decisionSupportAr: e.scopeAr,
    topicTags: [...e.topicTags],
    limitationsAr: [...e.limitationsAr],
    officialSourceReference: e.officialSourceReference,
    officialUrl: e.officialUrl,
    provenanceNoteAr:
      e.snapshotVerifiedAt != null
        ? "مصدر رسمي موثّق محليًا من صفحة المعهد الرسمية."
        : "مصدر رسمي معتمد.",
  };
}

/**
 * Free-text search over the approved corpus. Matches title, organization/source,
 * topic and keyword. An empty query returns every available source.
 */
export function searchResearchCorpus(rawQuery: string): ResearchSearchResponse {
  const query = rawQuery.trim();
  const corpus = getResearchCorpus();
  const available = corpus.filter(isEntryLoaded);
  const pendingEntries = corpus.filter((e) => !isEntryLoaded(e));

  const qTerms = terms(query);
  const match = (e: ResearchCorpusEntry): number => {
    if (qTerms.length === 0) return 1;
    const words = haystackWords(e);
    return qTerms.reduce((n, t) => (words.some((w) => w.includes(t)) ? n + 1 : n), 0);
  };

  const results = available
    .map((e) => ({ e, score: match(e) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.e.researchId.localeCompare(b.e.researchId))
    .map((x) => toView(x.e));

  const pending: PendingResearchView[] = pendingEntries
    .filter((e) => match(e) > 0)
    .map((e) => ({
      researchId: e.researchId,
      titleAr: e.titleAr,
      publisherAr: e.publisherAr,
      statusAr: "بانتظار إتاحة المصدر الرسمي",
      officialSourceReference: e.officialSourceReference,
    }));

  return { query, results, pending };
}

/** Every distinct publishing organization/source in the approved corpus. */
export function researchSources(): string[] {
  return [...new Set(getResearchCorpus().map((e) => e.institutionAr))];
}
