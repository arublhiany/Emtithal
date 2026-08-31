// =============================================================================
// Deterministic regulatory retrieval — Phase 5. NO LLM here.
//
// The Regulatory Intelligence Agent never searches the corpus freely. This
// module resolves a query to a small, defensible candidate set using only
// canonical fields (id, legacy alias, source alias, title, authority, domain,
// track, verification areas). Its output drives whether the LLM is called at
// all:
//   MATCH          → hand these candidate(s) to the LLM as the closed world
//   AMBIGUOUS      → do NOT call the LLM; surface the options for clarification
//   NONE           → do NOT call the LLM; the agent returns OUT_OF_CORPUS
//   SEASON_MISMATCH→ do NOT call the LLM; the agent returns a season-mismatch
//
// Season lock: the corpus is 1447H only. A query naming any other season is a
// SEASON_MISMATCH — a 1446H requirement is never carried into 1447H.
// =============================================================================

import type { RegulatoryRequirement, Season } from "@/lib/model";
import {
  getAuthorities,
  getRegulatoryRequirements,
  getRequirementByCanonicalId,
  resolveRequirementId,
} from "@/lib/data/regulatory";

export const CORPUS_SEASON: Season = "1447H";

export interface RegulatoryRetrievalQuery {
  /** Canonical matrix ID or a legacy alias (e.g. "CR-005"). */
  requirementId?: string;
  /** Restrict to one authority (must be a known authority id). */
  authorityId?: string;
  /** Free-text question (Arabic or English). */
  text?: string;
  /** If present and not the corpus season → SEASON_MISMATCH. */
  season?: string;
}

export type RetrievalKind = "MATCH" | "AMBIGUOUS" | "NONE" | "SEASON_MISMATCH";

export interface RetrievalResult {
  kind: RetrievalKind;
  /** Canonical requirement IDs. Exactly one for MATCH, ≥2 for AMBIGUOUS, empty otherwise. */
  candidateIds: string[];
  /** Short, non-secret diagnostic of how the decision was reached. */
  reason: string;
  /** The season the query asked about, when it named one. */
  requestedSeason: string | null;
}

// -- text normalisation -------------------------------------------------------

const AR_DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭـ]/g;

/** Lowercase, strip Arabic diacritics/tatweel, fold alef/ya/ta-marbuta, de-punctuate. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(AR_DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا") // أ إ آ ٱ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const AR_STOPWORDS = new Set(
  [
    "و",
    "او",
    "ثم",
    "في",
    "من",
    "عن",
    "على",
    "الى",
    "مع",
    "ما",
    "هو",
    "هي",
    "هذا",
    "هذه",
    "الذي",
    "التي",
    "به",
    "له",
    "عند",
    "كل",
    "او",
    "ان",
    "اذا",
    "لي",
    "لك",
    "قد",
    "غير",
    "بين",
    "وما",
    "اشرح",
    "باختصار",
    "متطلب",
    "ماهي",
    "ماهو",
    "الرسمي",
    "مصدره",
    "مصدر",
  ].map(normalizeText),
);

/** Meaningful tokens: length ≥ 3, not a stopword, leading article stripped when long. */
export function meaningfulTokens(normalized: string): Set<string> {
  const out = new Set<string>();
  for (const raw of normalized.split(" ")) {
    if (raw.length < 3) continue;
    const t = raw.length >= 5 && raw.startsWith("ال") ? raw.slice(2) : raw;
    if (t.length < 3) continue;
    if (AR_STOPWORDS.has(t)) continue;
    out.add(t);
  }
  return out;
}

function corpusTokens(r: RegulatoryRequirement): Set<string> {
  const parts = [
    r.titleAr,
    ...r.sourceAliasesAr,
    r.domainAr,
    r.trackAr ?? "",
    ...r.verificationAreasAr,
  ];
  const set = new Set<string>();
  for (const p of parts) for (const t of meaningfulTokens(normalizeText(p))) set.add(t);
  return set;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

// -- retrieval --------------------------------------------------------------

function res(
  kind: RetrievalKind,
  candidateIds: string[],
  reason: string,
  requestedSeason: string | null,
): RetrievalResult {
  return { kind, candidateIds, reason, requestedSeason };
}

/** Resolves a query to a deterministic candidate set. Pure. */
export function retrieveCandidates(query: RegulatoryRetrievalQuery): RetrievalResult {
  const requestedSeason = query.season?.trim() ? query.season.trim() : null;

  // -- season lock -------------------------------------------------------
  if (requestedSeason && requestedSeason !== CORPUS_SEASON) {
    return res(
      "SEASON_MISMATCH",
      [],
      `Query asks about season ${requestedSeason}; the approved corpus covers ${CORPUS_SEASON} only. Not extrapolated.`,
      requestedSeason,
    );
  }

  const authorityId = query.authorityId?.trim() || null;
  if (authorityId && !getAuthorities().some((a) => a.id === authorityId)) {
    return res("NONE", [], `Unknown authority '${authorityId}'.`, requestedSeason);
  }

  const all = getRegulatoryRequirements();
  const pool = authorityId ? all.filter((r) => r.authorityId === authorityId) : all;

  // -- direct identifier (canonical or legacy alias) -------------------
  const idInput = query.requirementId?.trim();
  if (idInput) {
    const canonical = resolveRequirementId(idInput);
    if (canonical) {
      const req = getRequirementByCanonicalId(canonical)!;
      if (authorityId && req.authorityId !== authorityId) {
        return res(
          "NONE",
          [],
          `Requirement ${canonical} is not under authority ${authorityId}.`,
          requestedSeason,
        );
      }
      if (req.season !== CORPUS_SEASON) {
        return res(
          "SEASON_MISMATCH",
          [],
          `Requirement ${canonical} is season ${req.season}, not ${CORPUS_SEASON}.`,
          requestedSeason,
        );
      }
      return res("MATCH", [canonical], `Direct identifier '${idInput}' → ${canonical}.`, requestedSeason);
    }
    if (!query.text?.trim()) {
      return res(
        "NONE",
        [],
        `Identifier '${idInput}' is not in the approved corpus.`,
        requestedSeason,
      );
    }
    // fall through to text retrieval
  }

  const text = query.text?.trim();
  if (!text) {
    return res("NONE", [], "No requirement identifier or query text supplied.", requestedSeason);
  }
  const normQuery = normalizeText(text);

  // -- exact / substring title or long source-alias match --------------
  const substringHits = pool.filter((r) => {
    const nt = normalizeText(r.titleAr);
    if (nt && (normQuery === nt || normQuery.includes(nt))) return true;
    return r.sourceAliasesAr.some((a) => {
      const na = normalizeText(a);
      return na.length >= 6 && normQuery.includes(na);
    });
  });
  if (substringHits.length === 1) {
    return res("MATCH", [substringHits[0].id], "Query contains a canonical title / source alias verbatim.", requestedSeason);
  }
  if (substringHits.length > 1) {
    return res(
      "AMBIGUOUS",
      substringHits.map((r) => r.id).sort(),
      "Query contains more than one canonical title verbatim.",
      requestedSeason,
    );
  }

  // -- token-overlap scoring -----------------------------------------
  const qT = meaningfulTokens(normQuery);
  if (qT.size === 0) {
    return res("NONE", [], "Query has no meaningful terms after normalisation.", requestedSeason);
  }

  const scored = pool
    .map((r) => ({
      id: r.id,
      score: overlap(qT, corpusTokens(r)),
      titleScore: overlap(qT, meaningfulTokens(normalizeText(r.titleAr))),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.titleScore - a.titleScore || a.id.localeCompare(b.id));

  if (scored.length === 0) {
    return res("NONE", [], "No approved requirement shares a meaningful term with the query.", requestedSeason);
  }

  const top = scored[0];
  const rest = scored.slice(1);

  // Dominant single hit: clearly ahead of everything else.
  if (top.score >= 2 && (rest.length === 0 || top.score >= rest[0].score + 2)) {
    return res("MATCH", [top.id], `Dominant term overlap (score ${top.score}).`, requestedSeason);
  }

  // Close band — do not silently pick one.
  const band = scored.filter((s) => s.score >= 1 && s.score >= top.score - 1);
  if (band.length === 1 && top.score >= 2) {
    return res("MATCH", [top.id], `Single credible candidate (score ${top.score}).`, requestedSeason);
  }
  if (band.length >= 2) {
    return res(
      "AMBIGUOUS",
      band.slice(0, 5).map((s) => s.id).sort(),
      `${band.length} approved requirements are comparably plausible — clarification required.`,
      requestedSeason,
    );
  }

  // Only a weak lone hit (score 1) — not credible enough to answer.
  return res(
    "NONE",
    [],
    `Only a weak single term match (score ${top.score}); not a credible regulatory candidate.`,
    requestedSeason,
  );
}
