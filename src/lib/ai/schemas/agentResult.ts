// =============================================================================
// Agent result envelope schema (Phase 4 — schema only).
// Mirrors `AgentResult<TData>` in `@/lib/model/ai.ts`.
//
// This envelope is ASSEMBLED by the orchestration layer (Phase 9), not returned
// verbatim by the model. The schema is provided for validation completeness.
// =============================================================================

import { z } from "zod";
import type { ZodType } from "zod";
import {
  agentFailureCodeSchema,
  agentResultStateSchema,
  aiConfidenceSchema,
  modeSchema,
  stringArray,
} from "./common";

export function agentResultSchema<TData>(dataSchema: ZodType<TData>) {
  return z
    .object({
      data: dataSchema.nullable(),
      mode: modeSchema,
      state: agentResultStateSchema,
      failureCode: agentFailureCodeSchema.nullable(),
      reason: z.string(),
      requirementsUsed: stringArray,
      dataUsed: stringArray,
      assumptions: stringArray,
      sources: stringArray,
      confidence: aiConfidenceSchema,
      unresolved: stringArray,
      humanReviewRequired: z.boolean(),
      resultVersion: z.number().int().nonnegative(),
    })
    .strict();
}
