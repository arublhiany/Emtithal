// =============================================================================
// AI client entrypoint — server-side ONLY (Phase 4).
//
// `getAIClient()` selects the provider from AI_PROVIDER:
//   "anthropic" → Anthropic transport
//   "gemini"    → Gemini transport
// A missing / unknown provider, or a missing key/model, yields an
// `UnavailableAIClient` that returns a controlled AI_UNAVAILABLE for every call.
// It never throws and never fabricates output.
//
// Do NOT import this module (or either transport) from a client component.
// =============================================================================

import type { AIClient } from "./types";
import { readAIConfig } from "./config";
import { StructuredAIClient, UnavailableAIClient } from "./aiClient";
import { createAnthropicTransport } from "./anthropicTransport";
import { createGeminiTransport } from "./geminiTransport";
import type { AITransport } from "./types";

if (typeof window !== "undefined") {
  throw new Error("@/lib/ai/client is server-only and must not run in the browser.");
}

let cached: AIClient | null = null;

function buildAIClient(): AIClient {
  const config = readAIConfig();

  if (!config.present) {
    const reason = config.unknownProvider
      ? `AI provider '${config.unknownProvider}' is not supported (use 'anthropic' or 'gemini').`
      : `AI provider not configured: missing ${config.missing.join(", ")}.`;
    return new UnavailableAIClient(reason);
  }

  const transport: AITransport =
    config.provider === "gemini"
      ? createGeminiTransport({ apiKey: config.apiKey, model: config.model })
      : createAnthropicTransport({ apiKey: config.apiKey, model: config.model });

  return new StructuredAIClient(transport);
}

export function getAIClient(): AIClient {
  if (!cached) cached = buildAIClient();
  return cached;
}

/** Test hook — clears the cached client so a later `getAIClient()` re-reads env. */
export function __resetAIClientForTests(): void {
  cached = null;
}

export * from "./types";
