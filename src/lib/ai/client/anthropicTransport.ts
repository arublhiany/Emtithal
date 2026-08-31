// =============================================================================
// Anthropic transport — the ONLY module that imports @anthropic-ai/sdk (Phase 4).
//
// Server-side only. A runtime guard throws if this is ever evaluated in a
// browser bundle; a static test also asserts no client component imports this
// file or the SDK.
// =============================================================================

import Anthropic from "@anthropic-ai/sdk";
import type { AITransport } from "./types";

if (typeof window !== "undefined") {
  throw new Error("anthropicTransport is server-only and must not run in the browser.");
}

export interface AnthropicTransportConfig {
  apiKey: string;
  model: string;
}

/** Builds the single Anthropic seam. `apiKey` is held only in this closure. */
export function createAnthropicTransport(config: AnthropicTransportConfig): AITransport {
  const client = new Anthropic({ apiKey: config.apiKey });

  return {
    provider: "anthropic",
    model: config.model,
    async complete({ system, user, maxTokens }) {
      // `responseFormat` is intentionally ignored: the Anthropic Messages API has
      // no native JSON-mode switch. Structured output is steered by the shared
      // guardrail prompt and enforced by the client's Zod validation. Only the
      // Gemini transport acts on `responseFormat` (native `responseMimeType`).
      //
      // NOTE: `temperature` / `top_p` / `top_k` are rejected (HTTP 400) by the
      // current Claude models (Opus 5 / Sonnet 5 / 4.6+ family), so no sampling
      // param is sent. Determinism is handled at the prompt/schema level.
      const response = await client.messages.create({
        model: config.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");

      return { text };
    },
  };
}
