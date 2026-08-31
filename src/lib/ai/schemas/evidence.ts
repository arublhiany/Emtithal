// =============================================================================
// Evidence Intelligence Agent output schema (Phase 4 — schema only).
// Mirrors `EvidenceFact` / `EvidenceAgentOutput` in `@/lib/model/ai.ts`.
//
// The Evidence Agent extracts facts. It never decides COMPLIANT — the
// Verification Engine consumes these facts.
// =============================================================================

import { z } from "zod";
import { aiConfidenceSchema, stringArray } from "./common";

export const evidenceFactSchema = z
  .object({
    field: z.string(),
    value: z.union([z.string(), z.number()]),
    evidenceReference: z.string(),
    confidence: aiConfidenceSchema,
  })
  .strict();

export const evidenceAgentOutputSchema = z
  .object({
    facts: z.array(evidenceFactSchema),
    missingFields: stringArray,
    contradictions: stringArray,
    confidence: aiConfidenceSchema,
  })
  .strict();

export type EvidenceAgentOutputParsed = z.infer<typeof evidenceAgentOutputSchema>;
