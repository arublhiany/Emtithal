// =============================================================================
// Shared Zod primitives for AI output schemas (Phase 4).
// Mirror the canonical types in `@/lib/model/ai.ts`.
// =============================================================================

import { z } from "zod";

export const aiConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const agentResultStateSchema = z.enum([
  "ANALYZING",
  "COMPLETED",
  "FAILED",
  "NEEDS_REVIEW",
]);

export const agentFailureCodeSchema = z.enum([
  "AI_UNAVAILABLE",
  "SOURCE_NOT_FOUND",
  "INSUFFICIENT_DATA",
  "SCHEMA_VALIDATION_FAILED",
  "UNRESOLVED_REQUIREMENT",
  "HUMAN_REVIEW_REQUIRED",
]);

export const modeSchema = z.enum(["REAL_AI", "DETERMINISTIC_FALLBACK", "DEMO_DATA"]);

export const stringArray = z.array(z.string());
