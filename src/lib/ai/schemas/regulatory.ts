// =============================================================================
// Regulatory Intelligence Agent output schema (Phase 4 — schema only).
// Mirrors `RegulatoryAgentOutput` in `@/lib/model/ai.ts`.
//
// Note: `authorityId` and `requirementIds` are retrieval references, NOT
// authoritative regulatory truth. The shared guardrail additionally rejects any
// value not in the approved corpus when one is supplied.
// =============================================================================

import { z } from "zod";
import { aiConfidenceSchema, lenientStringArray, stringArray } from "./common";

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

// -----------------------------------------------------------------------------
// Phase 5 — Regulatory Intelligence Agent structured answer.
//
// This is ONLY the non-authoritative interpretation the LLM is asked for.
// Everything authoritative is derived deterministically by the orchestrator and
// NEVER parsed here:
//   - confidence + its reason  → deterministic from retrieval / regulatory state
//                                / source-lineage conditions (locked rules)
//   - requirementIds / authorityId / sources / regulatoryState / applicability
//                                outcome / needsHumanReview
//
// There is deliberately NO `confidence` field: the model must not be able to
// raise (or lower) the canonical confidence. `applicabilityExplanationAr` is
// explanatory detail only — the model may not state whether a requirement
// applies; a contradictory claim is dropped by the orchestrator.
// -----------------------------------------------------------------------------
export const regulatoryAgentAnswerSchema = z
  .object({
    /** Short Arabic explanation of what the requirement means / why it applies. */
    answerAr: z.string(),
    /** Claimed cited requirement IDs — must be within the approved candidate set. */
    requirementIds: lenientStringArray,
    /** Claimed authority — must be an approved authority id. */
    authorityId: z.string().nullable(),
    /**
     * Extra regulatory / company facts the model believes are missing. ADDITIVE
     * only: the canonical `missingInformation` always contains the deterministic
     * engine fields regardless of what the model returns here.
     */
    missingInformation: lenientStringArray,
    /**
     * For a company-specific applicability question only: explanatory detail
     * that sits UNDER the deterministic canonical statement. `null` otherwise.
     * The model may not assert an applicability outcome — a contradictory claim
     * is discarded by the orchestrator.
     */
    applicabilityExplanationAr: z.string().nullable(),
  })
  .strict();

export type RegulatoryAgentAnswerParsed = z.infer<typeof regulatoryAgentAnswerSchema>;
