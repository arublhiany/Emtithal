// =============================================================================
// Shared Zod primitives for AI output schemas (Phase 4).
// Mirror the canonical types in `@/lib/model/ai.ts`.
// =============================================================================

import { z } from "zod";

export const aiConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

/**
 * Shape-tolerant string-array input (Phase 5). Accepts a real `string[]`, a lone
 * string (→ one-element array), or null/undefined (→ empty). Any other shape is
 * passed through so `z.array(z.string())` rejects it. Use ONLY for
 * non-authoritative explanatory lists — never for a field the canonical result
 * depends on (see the Regulatory Agent's deterministic `missingInformation`).
 *
 * The `as` cast keeps the effect schema presenting a plain `output === input`
 * surface so generic `ZodType<TData>` inference in `generateStructured` still
 * resolves. Runtime behaviour is the full preprocess pipeline; callers only ever
 * feed it `unknown` parsed JSON via `safeParse`.
 */
export const lenientStringArray = z.preprocess((v) => {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  if (typeof v === "string") return v.trim() ? [v] : [];
  return v;
}, z.array(z.string())) as unknown as z.ZodType<string[]>;

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
