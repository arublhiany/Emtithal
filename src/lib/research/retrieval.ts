// =============================================================================
// Deterministic research retrieval (Phase 8) — NO LLM.
//
// Closed-world over the approved research corpus. The LLM is never allowed to
// search arbitrary research. When the corpus has no locally-ingested source the
// outcome is CORPUS_PENDING and no LLM call is made.
// =============================================================================

import { normalizeText, meaningfulTokens } from "@/lib/ai/agents/regulatoryRetrieval";
import { getResearchCorpus, isEntryLoaded, researchCorpusState } from "./corpus";
import type { ResearchCorpusEntry } from "./types";

export type ResearchRetrievalKind =
  | "MATCH"
  | "AMBIGUOUS"
  | "NO_RELEVANT_RESEARCH"
  | "CORPUS_PENDING";

export interface ResearchRetrievalResult {
  kind: ResearchRetrievalKind;
  /** researchIds — exactly one for MATCH, ≥2 for AMBIGUOUS, empty otherwise. */
  researchIds: string[];
  reason: string;
}

export interface ResearchRetrievalQuery {
  researchId?: string;
  questionAr?: string;
  /** Restrict to these researchIds (must exist in the corpus). */
  restrictToResearchIds?: string[];
}

function corpusTokens(e: ResearchCorpusEntry): Set<string> {
  const parts = [e.titleAr, e.scopeAr, ...e.topicTags];
  const set = new Set<string>();
  for (const p of parts) for (const t of meaningfulTokens(normalizeText(p))) set.add(t);
  return set;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

/**
 * Pure matcher over an explicit corpus. Used by `retrieveResearch` for the live
 * corpus and by tests with a synthetic loaded corpus. Never gates on corpus state.
 */
export function matchResearch(
  corpus: ResearchCorpusEntry[],
  query: ResearchRetrievalQuery,
): ResearchRetrievalResult {
  let pool = corpus;
  if (query.restrictToResearchIds && query.restrictToResearchIds.length > 0) {
    const allowed = new Set(query.restrictToResearchIds);
    pool = pool.filter((e) => allowed.has(e.researchId));
    if (pool.length === 0) {
      return { kind: "NO_RELEVANT_RESEARCH", researchIds: [], reason: "No approved research in the restricted set." };
    }
  }

  const id = query.researchId?.trim();
  if (id) {
    const hit = pool.find((e) => e.researchId === id);
    return hit
      ? { kind: "MATCH", researchIds: [hit.researchId], reason: `Direct researchId '${id}'.` }
      : { kind: "NO_RELEVANT_RESEARCH", researchIds: [], reason: `researchId '${id}' is not in the approved corpus.` };
  }

  const text = query.questionAr?.trim();
  if (!text) {
    return { kind: "NO_RELEVANT_RESEARCH", researchIds: [], reason: "No researchId or question supplied." };
  }
  const normQuery = normalizeText(text);

  // exact / substring canonical title
  const titleHits = pool.filter((e) => {
    const nt = normalizeText(e.titleAr);
    return nt.length > 0 && (normQuery === nt || normQuery.includes(nt));
  });
  if (titleHits.length === 1)
    return { kind: "MATCH", researchIds: [titleHits[0].researchId], reason: "Query contains the canonical research title." };
  if (titleHits.length > 1)
    return {
      kind: "AMBIGUOUS",
      researchIds: titleHits.map((e) => e.researchId).sort(),
      reason: "More than one canonical title matched.",
    };

  // topic-tag / scope token overlap
  const qT = meaningfulTokens(normQuery);
  if (qT.size === 0)
    return { kind: "NO_RELEVANT_RESEARCH", researchIds: [], reason: "Query has no meaningful terms." };

  const scored = pool
    .map((e) => ({ id: e.researchId, score: overlap(qT, corpusTokens(e)) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  if (scored.length === 0)
    return {
      kind: "NO_RELEVANT_RESEARCH",
      researchIds: [],
      reason: "No approved research shares a meaningful term with the question.",
    };

  const top = scored[0];
  const rest = scored.slice(1);
  if (top.score >= 2 && (rest.length === 0 || top.score >= rest[0].score + 2))
    return { kind: "MATCH", researchIds: [top.id], reason: `Dominant topic overlap (score ${top.score}).` };

  const band = scored.filter((s) => s.score >= 1 && s.score >= top.score - 1);
  if (band.length === 1 && top.score >= 2)
    return { kind: "MATCH", researchIds: [top.id], reason: `Single credible research match (score ${top.score}).` };
  if (band.length >= 2)
    return {
      kind: "AMBIGUOUS",
      researchIds: band.slice(0, 5).map((s) => s.id).sort(),
      reason: `${band.length} approved research records are comparably plausible.`,
    };

  return {
    kind: "NO_RELEVANT_RESEARCH",
    researchIds: [],
    reason: `Only a weak single term match (score ${top.score}); not a credible research candidate.`,
  };
}

/**
 * Live retrieval. When no approved source has been ingested locally the result
 * is CORPUS_PENDING and callers MUST NOT call the LLM.
 */
export function retrieveResearch(
  query: ResearchRetrievalQuery,
  opts: { corpus?: ResearchCorpusEntry[] } = {},
): ResearchRetrievalResult {
  const corpus = opts.corpus ?? getResearchCorpus();
  if (researchCorpusState(corpus) === "CORPUS_PENDING") {
    return {
      kind: "CORPUS_PENDING",
      researchIds: [],
      reason:
        "No approved research source has been ingested locally with page provenance yet (CORPUS_PENDING_NEEDS_APPROVED_SOURCE).",
    };
  }
  // Only match against entries that are actually loaded.
  return matchResearch(corpus.filter(isEntryLoaded), query);
}
