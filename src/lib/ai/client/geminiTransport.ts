// =============================================================================
// Google Gemini transport — the ONLY module that imports @google/genai (Phase 4).
//
// Server-side only (runtime browser guard + static test). Implements the same
// `AITransport` seam as `anthropicTransport.ts`, so `StructuredAIClient` runs
// the identical retry / guardrail / Zod / logging pipeline for either provider.
//
// Structured calls use Gemini's native JSON mode (`responseMimeType:
// "application/json"`) so we don't depend on prompt wording alone; text calls
// do not. We do NOT pass a `responseSchema` — the existing Zod schema stays the
// single source of truth after `JSON.parse`, so no schema-conversion dependency
// is added. No sampling params are sent (symmetric with the Anthropic transport).
// =============================================================================

import { GoogleGenAI } from "@google/genai";
import type { GenerateContentParameters } from "@google/genai";
import type { AIResponseFormat, AITransport } from "./types";

if (typeof window !== "undefined") {
  throw new Error("geminiTransport is server-only and must not run in the browser.");
}

export interface GeminiTransportConfig {
  apiKey: string;
  model: string;
}

/**
 * Pure builder for the `generateContent` params. Exported so a test can assert
 * that structured calls request JSON mode and text calls do not — without a
 * live API call.
 */
export function buildGeminiGenerateParams(args: {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  responseFormat: AIResponseFormat;
}): GenerateContentParameters {
  return {
    model: args.model,
    contents: args.user,
    config: {
      systemInstruction: args.system,
      maxOutputTokens: args.maxTokens,
      // Gemini's native structured-output mode — applied ONLY to structured calls.
      ...(args.responseFormat === "json" ? { responseMimeType: "application/json" } : {}),
    },
  };
}

/** Builds the single Gemini seam. `apiKey` is held only in this closure. */
export function createGeminiTransport(config: GeminiTransportConfig): AITransport {
  const genai = new GoogleGenAI({ apiKey: config.apiKey });

  return {
    provider: "gemini",
    model: config.model,
    async complete({ system, user, maxTokens, responseFormat }) {
      const response = await genai.models.generateContent(
        buildGeminiGenerateParams({ model: config.model, system, user, maxTokens, responseFormat }),
      );
      return { text: response.text ?? "" };
    },
  };
}
