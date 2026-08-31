// =============================================================================
// Research Knowledge Agent output schema (Phase 4 — schema only).
// Mirrors `ResearchStudy` / `ResearchQueryResult` in `@/lib/model/ai.ts`.
//
// Research is advisory: it never changes a score, creates an obligation, or
// proves a violation. `corpusState` gates whether any study may be returned.
// =============================================================================

import { z } from "zod";
import { aiConfidenceSchema } from "./common";

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
