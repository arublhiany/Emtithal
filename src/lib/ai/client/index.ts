// =============================================================================
// AI client entrypoint — server-side ONLY (Phase 4).
//
// `getAIClient()` returns a real Anthropic-backed client when
// AI_PROVIDER_API_KEY + AI_MODEL are configured, otherwise an
// `UnavailableAIClient` that returns a controlled AI_UNAVAILABLE for every call.
// It never throws and never fabricates output.
//
// Do NOT import this module (or `anthropicTransport`) from a client component.
// =============================================================================

import type { AIClient } from "./types";
import { readAIConfig } from "./config";
import { StructuredAIClient, UnavailableAIClient } from "./aiClient";
import { createAnthropicTransport } from "./anthropicTransport";

if (typeof window !== "undefined") {
  throw new Error("@/lib/ai/client is server-only and must not run in the browser.");
}

let cached: AIClient | null = null;

export function getAIClient(): AIClient {
  if (cached) return cached;

  const config = readAIConfig();
  if (!config.present) {
    cached = new UnavailableAIClient(
      `AI provider not configured: missing ${config.missing.join(", ")}.`,
    );
    return cached;
  }

  cached = new StructuredAIClient(
    createAnthropicTransport({ apiKey: config.apiKey, model: config.model }),
  );
  return cached;
}

/** Test hook — clears the cached client so a later `getAIClient()` re-reads env. */
export function __resetAIClientForTests(): void {
  cached = null;
}

export * from "./types";
