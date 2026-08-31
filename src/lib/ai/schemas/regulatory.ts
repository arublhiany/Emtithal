// =============================================================================
// Regulatory Intelligence Agent output schema (Phase 4 — schema only).
// Mirrors `RegulatoryAgentOutput` in `@/lib/model/ai.ts`.
//
// Note: `authorityId` and `requirementIds` are retrieval references, NOT
// authoritative regulatory truth. The shared guardrail additionally rejects any
// value not in the approved corpus when one is supplied.
// =============================================================================

import { z } from "zod";
import { aiConfidenceSchema, stringArray } from "./common";

export const regulatoryAgentOutputSchema = z
  .object({
    requirementIds: stringArray,
    authorityId: z.string().nullable(),
    reason: z.string(),
    sources: stringArray,
    confidence: aiConfidenceSchema,
    unresolved: stringArray,
  })
  .strict();

export type RegulatoryAgentOutputParsed = z.infer<typeof regulatoryAgentOutputSchema>;
