// =============================================================================
// AI output schema registry (Phase 4). Schemas only — no agent behaviour yet.
// =============================================================================

export * from "./common";
export * from "./regulatory";
export * from "./evidence";
export * from "./decision";
export * from "./research";
export * from "./agentResult";

import { regulatoryAgentOutputSchema } from "./regulatory";
import { evidenceAgentOutputSchema } from "./evidence";
import { decisionObjectSchema, scenarioComparisonResultSchema, scenarioSchema } from "./decision";
import { researchQueryResultSchema } from "./research";

/** Named lookup for the canonical agent output schemas. */
export const AI_OUTPUT_SCHEMAS = {
  regulatoryAgentOutput: regulatoryAgentOutputSchema,
  evidenceAgentOutput: evidenceAgentOutputSchema,
  decisionObject: decisionObjectSchema,
  scenario: scenarioSchema,
  scenarioComparisonResult: scenarioComparisonResultSchema,
  researchQueryResult: researchQueryResultSchema,
} as const;

export type AIOutputSchemaName = keyof typeof AI_OUTPUT_SCHEMAS;
