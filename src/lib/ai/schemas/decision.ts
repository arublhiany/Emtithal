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
import { aiConfidenceSchema, stringArray } from "./common";

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
