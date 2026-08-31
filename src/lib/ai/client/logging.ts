// =============================================================================
// AI call logging — safe metadata only (Phase 4).
//
// NEVER logs: API keys, secrets, full uploaded evidence content, or raw prompts.
// =============================================================================

import type { AICallMeta } from "./types";

export function logAICall(meta: AICallMeta): void {
  // Structured single-line record. `meta` is already sanitised (see AICallMeta).
  const line = {
    tag: "ai.call",
    requestId: meta.requestId,
    purpose: meta.purpose,
    provider: meta.provider,
    model: meta.model,
    durationMs: meta.durationMs,
    success: meta.success,
    schemaValid: meta.schemaValid,
    failureCode: meta.failureCode,
    confidence: meta.confidence,
    attempts: meta.attempts,
  };
  console.info(JSON.stringify(line));
}
