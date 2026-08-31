// =============================================================================
// AI client abstraction — provider-agnostic contract (Phase 4).
//
// Product code depends ONLY on `AIClient`. The Anthropic SDK is confined to
// `anthropicTransport.ts`. Every call returns a discriminated `AICallResult`:
// on failure `data` is never present and nothing is fabricated.
// =============================================================================

import type { ZodType } from "zod";

/** Controlled failure codes. No other outcome is possible on failure. */
export type AIFailureCode =
  | "AI_UNAVAILABLE" // credentials missing / provider not configured
  | "SCHEMA_VALIDATION_FAILED" // malformed output, after one retry
  | "GUARDRAIL_REJECTED" // output attempted a forbidden regulatory-authority field
  | "PROVIDER_ERROR"; // the provider call threw / errored

/** Safe, non-secret call metadata (also the shape passed to the logger). */
export interface AICallMeta {
  requestId: string;
  /** Agent / purpose label, e.g. "regulatory-agent". Never raw content. */
  purpose: string;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  schemaValid: boolean;
  failureCode: AIFailureCode | null;
  /** Extracted from a validated result's `confidence` field, if any. */
  confidence: "HIGH" | "MEDIUM" | "LOW" | null;
  /** Number of provider attempts made (1 or 2). */
  attempts: number;
}

export type AICallResult<TData> =
  | { ok: true; data: TData; meta: AICallMeta }
  | {
      ok: false;
      failureCode: AIFailureCode;
      message: string;
      /** Present only for GUARDRAIL_REJECTED. */
      violations?: { path: string; kind: string; detail: string }[];
      meta: AICallMeta;
    };

export interface GuardrailContext {
  /** When supplied, requirement IDs in the output not in this set are rejected. */
  approvedRequirementIds?: string[];
  /** When supplied, authority IDs in the output not in this set are rejected. */
  approvedAuthorityIds?: string[];
}

export interface GenerateStructuredOptions<TData> {
  /** Logging label only. */
  purpose: string;
  /** Zod schema the provider output must satisfy (use `.strict()`). */
  schema: ZodType<TData>;
  /** Agent-specific system instruction. Shared guardrail rules are prepended by the client. */
  system: string;
  /** User content for the model. */
  input: string;
  maxTokens?: number;
  guardrail?: GuardrailContext;
}

export interface GenerateTextOptions {
  purpose: string;
  system: string;
  input: string;
  maxTokens?: number;
  guardrail?: GuardrailContext;
}

export interface AIClient {
  generateStructured<TData>(
    options: GenerateStructuredOptions<TData>,
  ): Promise<AICallResult<TData>>;
  generateText(options: GenerateTextOptions): Promise<AICallResult<string>>;
}

/**
 * The single seam the Anthropic SDK sits behind. Implemented once
 * (`anthropicTransport.ts`); faked in tests.
 */
export interface AITransport {
  readonly provider: string;
  readonly model: string;
  complete(input: { system: string; user: string; maxTokens: number }): Promise<{ text: string }>;
}
