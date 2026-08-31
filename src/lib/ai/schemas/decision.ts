// =============================================================================
// Decision Intelligence Agent output schemas (Phase 4 — schema only).
// Mirrors `DecisionObject` / `Scenario` / `ScenarioComparisonResult` in
// `@/lib/model/ai.ts`.
//
// IMPORTANT: the Phase 1 `ScenarioComparisonResult` type carries
// `affectedStatuses: Record<string, ComplianceStatus>`. AI must NOT populate a
// compliance status (shared guardrail rejects it), so this schema OMITS that
// field — the deterministic Verification Engine fills it downstream. The Phase 1
// type is revisited in Phase 7.
// =============================================================================

import { z } from "zod";
import { aiConfidenceSchema, lenientStringArray, stringArray } from "./common";

export const decisionObjectSchema = z
  .object({
    decisionType: z.string(),
    action: z.string(),
    value: z.number().nullable(),
    unit: z.string().nullable(),
    domain: z.string(),
    confidence: aiConfidenceSchema,
  })
  .strict();

export const scenarioSchema = z
  .object({
    scenarioId: z.string(),
    titleAr: z.string(),
    descriptionAr: z.string(),
    changes: stringArray,
    assumptions: stringArray,
    affectedRequirements: stringArray,
    operationalEffects: stringArray,
    regulatoryEffects: stringArray,
    researchInsights: stringArray,
    confidence: aiConfidenceSchema,
    dataUsed: stringArray,
    sources: stringArray,
    unresolved: stringArray,
  })
  .strict();

export const scenarioComparisonResultSchema = z
  .object({
    decision: decisionObjectSchema,
    currentReadiness: z.number().nullable(),
    scenarios: z.array(scenarioSchema),
    recommendedScenarioId: z.string().nullable(),
    // `affectedStatuses` intentionally omitted — see file header.
  })
  .strict();

export type DecisionObjectParsed = z.infer<typeof decisionObjectSchema>;
export type ScenarioParsed = z.infer<typeof scenarioSchema>;
export type ScenarioComparisonResultParsed = z.infer<typeof scenarioComparisonResultSchema>;

// -----------------------------------------------------------------------------
// Phase 7 — Decision Intelligence Agent. INTERPRETATION and RECOMMENDATION only.
//
// The model converts natural language into requested operational changes and,
// later, explains / recommends among ALREADY-COMPUTED deterministic scenarios.
// It never computes compliance / readiness / coverage / a status, never invents
// a requirement / weight / penalty / integration, never resolves an
// UNRESOLVED_REQUIREMENT. `fieldPath` is post-validated against the closed
// canonical operational-variable catalog; `recommendedScenarioId` is
// post-validated against the actually-computed scenario IDs.
// -----------------------------------------------------------------------------

export const decisionRequestedChangeSchema = z
  .object({
    /** Must be a canonical company-profile field path in the approved catalog. */
    fieldPath: z.string(),
    /** The proposed value as a string — the orchestrator parses + domain-validates it. */
    toValue: z.string(),
    /** Short Arabic statement of what the user wants for this field. */
    intentAr: z.string(),
  })
  .strict();

/** A value the user wants held FIXED ("keep X at N") — a constraint, not a change. */
export const decisionConstraintSchema = z
  .object({
    fieldPath: z.string(),
    /** The value the user wants kept, as a string — post-validated against the catalog. */
    expectedValue: z.string(),
    intentAr: z.string(),
  })
  .strict();

export const decisionInterpretationSchema = z
  .object({
    decisionTitleAr: z.string(),
    decisionSummaryAr: z.string(),
    requestedChanges: z.array(decisionRequestedChangeSchema),
    /** User-stated "keep/same" constraints. Same closed catalog + type validation. */
    constraints: z.array(decisionConstraintSchema),
    assumptionsAr: lenientStringArray,
    ambiguitiesAr: lenientStringArray,
    missingInfoAr: lenientStringArray,
    interpretationConfidence: aiConfidenceSchema,
    needsHumanReview: z.boolean(),
  })
  .strict();

export const decisionScenarioExplanationSchema = z
  .object({
    scenarioId: z.string(),
    /** Why the result changed — grounded ONLY in the deterministic diff supplied. */
    whyChangedAr: z.string(),
  })
  .strict();

export const decisionRecommendationSchema = z
  .object({
    /** Must be one of the computed scenario IDs, or null. Post-validated. */
    recommendedScenarioId: z.string().nullable(),
    recommendationAr: z.string(),
    tradeoffsAr: lenientStringArray,
    assumptionsAr: lenientStringArray,
    scenarioExplanations: z.array(decisionScenarioExplanationSchema),
    needsHumanReview: z.boolean(),
  })
  .strict();

export type DecisionRequestedChangeParsed = z.infer<typeof decisionRequestedChangeSchema>;
export type DecisionInterpretationParsed = z.infer<typeof decisionInterpretationSchema>;
export type DecisionRecommendationParsed = z.infer<typeof decisionRecommendationSchema>;
