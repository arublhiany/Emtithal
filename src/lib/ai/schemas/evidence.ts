// =============================================================================
// Evidence Intelligence Agent output schema (Phase 4 — schema only).
// Mirrors `EvidenceFact` / `EvidenceAgentOutput` in `@/lib/model/ai.ts`.
//
// The Evidence Agent extracts facts. It never decides COMPLIANT — the
// Verification Engine consumes these facts.
// =============================================================================

import { z } from "zod";
import { aiConfidenceSchema, lenientStringArray, stringArray } from "./common";

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

// -----------------------------------------------------------------------------
// Phase 6 — Evidence Intelligence Agent analysis (interpretation, NOT compliance).
//
// The model maps ALREADY-EXTRACTED facts to an APPROVED candidate requirement
// set. It may say the evidence "appears to support" something; it may NEVER say
// a requirement is COMPLIANT, set a status / weight / target / penalty, invent a
// requirement, or change applicability. `requirementId` must be in the approved
// candidate set (the shared guardrail rejects anything else). Provenance
// (page / sheet / row / cell) is deterministic and lives on the extracted facts,
// not here. `interpretationConfidence` is about mapping clarity only — never
// regulatory or compliance confidence.
// -----------------------------------------------------------------------------
export const evidenceRequirementMappingSchema = z
  .object({
    /** Must be one of the approved candidate requirement IDs. */
    requirementId: z.string(),
    /** Extracted fact IDs this mapping relies on (validated against real facts by the orchestrator). */
    evidenceFactIds: lenientStringArray,
    /** What the evidence APPEARS to support — not a compliance verdict. */
    appearsToSupportAr: z.string(),
    /** What is still missing for this requirement. */
    stillMissingAr: lenientStringArray,
    /** Which verificationTarget / area the evidence seems to relate to. `null` if unclear. */
    relatedVerificationTargetAr: z.string().nullable(),
    /** Mapping clarity only. HIGH | MEDIUM | LOW. */
    interpretationConfidence: aiConfidenceSchema,
  })
  .strict();

export const evidenceConflictSchema = z
  .object({
    factIdA: z.string(),
    factIdB: z.string(),
    descriptionAr: z.string(),
  })
  .strict();

export const evidenceAgentAnalysisSchema = z
  .object({
    summaryAr: z.string(),
    mappings: z.array(evidenceRequirementMappingSchema),
    /** Conflicting extracted facts — both are preserved; never silently resolved. */
    conflicts: z.array(evidenceConflictSchema),
    /** Extracted fact IDs the model could not relate to any candidate. */
    unmappedFactIds: lenientStringArray,
    /** The model's own review request. The orchestrator ORs deterministic conditions on top. */
    needsHumanReview: z.boolean(),
  })
  .strict();

export type EvidenceRequirementMappingParsed = z.infer<typeof evidenceRequirementMappingSchema>;
export type EvidenceAgentAnalysisParsed = z.infer<typeof evidenceAgentAnalysisSchema>;
