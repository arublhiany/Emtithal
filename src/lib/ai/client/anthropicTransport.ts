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
      const response = await client.messages.create({
        model: config.model,
        max_tokens: maxTokens,
        temperature: 0,
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
