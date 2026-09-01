// =============================================================================
// Research support — client-safe browse/search over the APPROVED research from
// معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة (جامعة أم القرى).
//
// Pure, no LLM, no PDF parser, no network. Imports only the corpus data module
// (never the `./index` barrel, which pulls in the ingester) and the browse-only
// institute reference index.
//
// A match is one of:
//  - FULL           — an ingested source with a verbatim official excerpt
//  - METADATA_ONLY  — an official study listing / an official research-area page
//                     (title + source + link only; NO summary, NO findings)
//
// It never fabricates an insight or a finding for a source whose detailed
// content has not been ingested locally, and never presents research as
// regulation.
// =============================================================================

import { getResearchCorpus, isEntryLoaded } from "./corpus";
import { INSTITUTE_REFERENCES, type InstituteReference } from "./instituteIndex";
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

export type ResearchContentAvailability = "FULL" | "METADATA_ONLY";

/** One searchable result — display fields only. */
export interface ResearchResultView {
  researchId: string;
  titleAr: string;
  /** Organization / source (the publishing institute). */
  publisherAr: string;
  institutionAr: string;
  /** e.g. "صفحة رسمية" / "قائمة رسمية" / "وحدة بحثية". */
  sourceKindAr: string;
  publicationStatusAr: string | null;
  publicationYear: string | null;
  seasonAr: string | null;
  contentAvailability: ResearchContentAvailability;
  /** Verbatim official excerpt — only for FULL results. */
  insightAr: string | null;
  insightLocatorAr: string | null;
  /** What the source covers / how it may support a decision (curated scope). */
  decisionSupportAr: string;
  topicTags: string[];
  limitationsAr: string[];
  /** Shown for METADATA_ONLY results. */
  unavailableNoteAr: string | null;
  /** Provenance. */
  officialSourceReference: string;
  officialUrl: string | null;
  provenanceNoteAr: string;
}

export interface ResearchSearchResponse {
  query: string;
  /** Ingested sources with a verbatim official excerpt. */
  results: ResearchResultView[];
  /** Official study metadata / research-area pages — no findings shown. */
  references: ResearchResultView[];
}

// -- Arabic text matching (self-contained) -----------------------------------

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, "") // diacritics
    .replace(/[إأآ]/g, "ا") // hamza forms → ا  ("الإسكان" ≡ "الاسكان")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Drop a leading definite article so "الاسكان" and "اسكان" share a stem. */
function stem(w: string): string {
  return w.length > 4 && w.startsWith("ال") ? w.slice(2) : w;
}

/** Small, obvious, safe synonym groups (stems). No semantic expansion. */
const SYNONYM_GROUPS: string[][] = [
  ["اسكان", "مساكن", "ايواء", "سكن"],
  ["نقل", "مواصلات"],
  ["حشود", "الحشد", "تفويج"],
  ["محاكاه", "نمذجه"],
];
const SYNONYMS: Record<string, string[]> = {};
for (const g of SYNONYM_GROUPS) {
  for (const w of g) SYNONYMS[w] = g.filter((x) => x !== w);
}

const STOPWORDS = new Set(
  [
    "في", "من", "الى", "على", "عن", "مع", "او", "لا", "له", "لها", "ما", "هذا",
    "هذه", "التي", "الذي", "هو", "هي", "ثم", "قد", "كل", "بعض", "بين", "عند",
    "دون", "غير", "اي", "اذا", "كما", "حيث", "بها", "به", "الحج", "العمره",
    "الحجاج", "المعتمرين", "موضوع", "علاقه",
  ].map(norm),
);

/** Query terms (stems) worth matching on: >= 3 chars, not a stopword, + synonyms. */
function queryStems(s: string): string[] {
  const out = new Set<string>();
  for (const raw of norm(s).split(" ")) {
    if (raw.length < 3 || STOPWORDS.has(raw)) continue;
    const st = stem(raw);
    if (st.length < 3) continue;
    out.add(st);
    for (const syn of SYNONYMS[st] ?? []) out.add(syn);
  }
  return [...out];
}

function haystackStems(parts: string[]): string[] {
  return norm(parts.join(" "))
    .split(" ")
    .filter(Boolean)
    .map(stem);
}

function scoreAgainst(qStems: string[], hay: string[]): number {
  if (qStems.length === 0) return 1;
  return qStems.reduce((n, t) => (hay.some((w) => w.includes(t) || t.includes(w)) ? n + 1 : n), 0);
}

// -- views ----------------------------------------------------------------

function fullView(e: ResearchCorpusEntry): ResearchResultView {
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
    contentAvailability: "FULL",
    insightAr: p ? p.textAr : null,
    insightLocatorAr: p
      ? p.locator.type === "WEB_SECTION"
        ? "مقتطف من المصدر الرسمي"
        : `صفحة ${p.locator.page}`
      : null,
    decisionSupportAr: e.scopeAr,
    topicTags: [...e.topicTags],
    limitationsAr: [...e.limitationsAr],
    unavailableNoteAr: null,
    officialSourceReference: e.officialSourceReference,
    officialUrl: e.officialUrl,
    provenanceNoteAr:
      e.snapshotVerifiedAt != null
        ? "مصدر رسمي موثّق محليًا من صفحة المعهد الرسمية."
        : "مصدر رسمي معتمد.",
  };
}

const UNAVAILABLE_NOTE_AR =
  "المحتوى التفصيلي غير متاح بعد؛ لا تُعرض نتائج أو ملخصات — يُكتفى بالعنوان والمصدر والرابط الرسمي.";

/** A corpus entry that is not (yet) ingested → metadata only, no fabricated content. */
function metadataViewFromCorpus(e: ResearchCorpusEntry): ResearchResultView {
  return {
    researchId: e.researchId,
    titleAr: e.titleAr,
    publisherAr: e.publisherAr,
    institutionAr: e.institutionAr,
    sourceKindAr: "تقرير رسمي",
    publicationStatusAr: PUBLICATION_STATUS_AR[e.publicationStatus],
    publicationYear: e.publicationYear,
    seasonAr: e.researchSeason,
    contentAvailability: "METADATA_ONLY",
    insightAr: null,
    insightLocatorAr: null,
    decisionSupportAr: e.scopeAr,
    topicTags: [...e.topicTags],
    limitationsAr: [...e.limitationsAr],
    unavailableNoteAr: UNAVAILABLE_NOTE_AR,
    officialSourceReference: e.officialSourceReference,
    officialUrl: e.officialUrl,
    provenanceNoteAr: "مرجع رسمي معتمد.",
  };
}

function metadataViewFromInstitute(r: InstituteReference): ResearchResultView {
  return {
    researchId: r.refId,
    titleAr: r.titleAr,
    publisherAr: r.publisherAr,
    institutionAr: r.institutionAr,
    sourceKindAr: r.kind === "AREA_PAGE" ? "وحدة بحثية رسمية" : "دراسة ضمن قائمة رسمية",
    publicationStatusAr: null,
    publicationYear: null,
    seasonAr: r.seasonAr,
    contentAvailability: "METADATA_ONLY",
    insightAr: null,
    insightLocatorAr: null,
    decisionSupportAr: r.coverageAr,
    topicTags: [...r.topicTags],
    limitationsAr: [],
    unavailableNoteAr: UNAVAILABLE_NOTE_AR,
    officialSourceReference: r.officialSourceReference,
    officialUrl: r.officialUrl,
    provenanceNoteAr: "مرجع رسمي من صفحات المعهد الرسمية.",
  };
}

/**
 * Free-text search across the Institute's approved research: ingested sources
 * (with a verbatim excerpt) and official metadata / research-area references
 * (title + source + link only). An empty query returns everything.
 */
export function searchResearchCorpus(rawQuery: string): ResearchSearchResponse {
  const query = rawQuery.trim();
  const qs = queryStems(query);

  const corpus = getResearchCorpus();

  const results = corpus
    .filter(isEntryLoaded)
    .map((e) => ({ e, s: scoreAgainst(qs, haystackStems([e.titleAr, e.publisherAr, e.institutionAr, e.scopeAr, ...e.topicTags])) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.e.researchId.localeCompare(b.e.researchId))
    .map((x) => fullView(x.e));

  const corpusMeta = corpus
    .filter((e) => !isEntryLoaded(e))
    .map((e) => ({ e, s: scoreAgainst(qs, haystackStems([e.titleAr, e.publisherAr, e.institutionAr, e.scopeAr, ...e.topicTags])) }))
    .filter((x) => x.s > 0)
    .map((x) => metadataViewFromCorpus(x.e));

  const instituteMeta = INSTITUTE_REFERENCES.map((r) => ({
    r,
    s: scoreAgainst(qs, haystackStems([r.titleAr, r.unitAr, r.publisherAr, r.institutionAr, r.coverageAr, ...r.topicTags])),
  }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.r.refId.localeCompare(b.r.refId))
    .map((x) => metadataViewFromInstitute(x.r));

  return { query, results, references: [...instituteMeta, ...corpusMeta] };
}

/** Every distinct publishing organization/source in the approved research set. */
export function researchSources(): string[] {
  return [
    ...new Set([
      ...getResearchCorpus().map((e) => e.institutionAr),
      ...INSTITUTE_REFERENCES.map((r) => r.institutionAr),
    ]),
  ];
}
