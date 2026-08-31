// =============================================================================
// Research Knowledge Agent output schema (Phase 4 — schema only).
// Mirrors `ResearchStudy` / `ResearchQueryResult` in `@/lib/model/ai.ts`.
//
// Research is advisory: it never changes a score, creates an obligation, or
// proves a violation. `corpusState` gates whether any study may be returned.
// =============================================================================

import { z } from "zod";
import { aiConfidenceSchema, lenientStringArray } from "./common";

export const researchCorpusStateSchema = z.enum(["CORPUS_PENDING", "CORPUS_LOADED"]);

export const researchStudySchema = z
  .object({
    title: z.string(),
    year: z.string(),
    source: z.string(),
    summary: z.string(),
    operationalInsight: z.string(),
  })
  .strict();

export const researchQueryResultSchema = z
  .object({
    corpusState: researchCorpusStateSchema,
    query: z.string(),
    studies: z.array(researchStudySchema),
    confidence: aiConfidenceSchema,
  })
  .strict()
  .refine(
    (v) => v.corpusState === "CORPUS_LOADED" || v.studies.length === 0,
    { message: "studies must be empty while corpusState is CORPUS_PENDING", path: ["studies"] },
  );

export type ResearchQueryResultParsed = z.infer<typeof researchQueryResultSchema>;

// -----------------------------------------------------------------------------
// Phase 8 — Research Knowledge Agent answer. DECISION SUPPORT ONLY.
//
// The model returns ONLY claim / relevance / cited-passage-id text against an
// APPROVED retrieved research record. It never reproduces the title, publisher,
// URL, page metadata, or publication status as truth (the orchestrator
// reattaches those from the canonical corpus), never creates a regulatory
// requirement / weight / penalty / integration, never a compliance verdict,
// never resolves an UNRESOLVED_REQUIREMENT. `claimAr` is SOURCE_DIRECT (must be
// anchored to a real cited passage); `relevanceAr` is a SEPARATE
// AI_INTERPRETATION and must not be presented as the paper's own words.
// -----------------------------------------------------------------------------
export const researchInsightSchema = z
  .object({
    /** Must be an approved researchId in the retrieved candidate set. */
    researchId: z.string(),
    /** What the approved source directly states (SOURCE_DIRECT). Anchored to citedPassageIds. */
    claimAr: z.string(),
    /** Why it MAY be relevant — the model's own interpretation (AI_INTERPRETATION). */
    relevanceAr: z.string(),
    /** Real passage IDs from the retrieved record — validated by the orchestrator. */
    citedPassageIds: lenientStringArray,
    interpretationConfidence: aiConfidenceSchema,
  })
  .strict();

export const researchAgentAnswerSchema = z
  .object({
    summaryAr: z.string(),
    insights: z.array(researchInsightSchema),
    /** The model believes no approved research applies. */
    noRelevantResearch: z.boolean(),
    needsHumanReview: z.boolean(),
  })
  .strict();

export type ResearchInsightParsed = z.infer<typeof researchInsightSchema>;
export type ResearchAgentAnswerParsed = z.infer<typeof researchAgentAnswerSchema>;
