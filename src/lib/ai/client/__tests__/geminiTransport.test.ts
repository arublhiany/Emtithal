// =============================================================================
// Phase 4 (Gemini extension) tests — structured-output (JSON) mode.
//
// Proves:
//  - Gemini `generateStructured` requests native JSON mode
//    (`responseMimeType: "application/json"`); `generateText` does NOT.
//  - the `responseFormat` flag is threaded end-to-end from the client to the
//    transport (structured → "json", text → "text").
//  - valid JSON still flows through the SAME Zod pipeline; a forbidden field is
//    still guardrail-rejected AFTER parsing even in JSON mode.
//  - the Anthropic transport does not act on JSON mode (behaviour unchanged).
//
// No live API call: `buildGeminiGenerateParams` is pure, and the pipeline tests
// use a spy transport.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

import { buildGeminiGenerateParams } from "@/lib/ai/client/geminiTransport";
import { StructuredAIClient } from "@/lib/ai/client/aiClient";
import type { AIResponseFormat, AITransport } from "@/lib/ai/client/types";

const okSchema = z.object({ ok: z.literal(true), message: z.string() }).strict();

// -- buildGeminiGenerateParams: JSON mode only for structured calls -------

test("buildGeminiGenerateParams('json') sets responseMimeType: application/json", () => {
  const params = buildGeminiGenerateParams({
    model: "gemini-x",
    system: "sys",
    user: "usr",
    maxTokens: 512,
    responseFormat: "json",
  });
  assert.equal(params.model, "gemini-x");
  assert.equal(params.contents, "usr");
  assert.equal(params.config?.systemInstruction, "sys");
  assert.equal(params.config?.maxOutputTokens, 512);
  assert.equal(params.config?.responseMimeType, "application/json");
});

test("buildGeminiGenerateParams('text') does NOT force JSON mode", () => {
  const params = buildGeminiGenerateParams({
    model: "gemini-x",
    system: "sys",
    user: "usr",
    maxTokens: 512,
    responseFormat: "text",
  });
  assert.equal(params.config?.responseMimeType, undefined);
  assert.equal("responseMimeType" in (params.config ?? {}), false);
  // still a normal generate call
  assert.equal(params.config?.systemInstruction, "sys");
  assert.equal(params.config?.maxOutputTokens, 512);
});

// -- responseFormat is threaded from the client to the transport ---------

function spyGeminiTransport(queue: (string | Error)[]) {
  const q = [...queue];
  const calls: AIResponseFormat[] = [];
  const transport: AITransport = {
    provider: "gemini",
    model: "gemini-spy",
    async complete({ responseFormat }) {
      calls.push(responseFormat);
      const next = q.shift();
      if (next === undefined) throw new Error("spy queue exhausted");
      if (next instanceof Error) throw next;
      return { text: next };
    },
  };
  return { transport, calls };
}

test("client.generateStructured asks the transport for responseFormat 'json'", async () => {
  const { transport, calls } = spyGeminiTransport(['{"ok": true, "message": "hi"}']);
  const client = new StructuredAIClient(transport);
  const r = await client.generateStructured({
    purpose: "gemini-json",
    schema: okSchema,
    system: "s",
    input: "i",
  });
  assert.equal(r.ok, true);
  assert.deepEqual(calls, ["json"]);
});

test("client.generateText asks the transport for responseFormat 'text' (never 'json')", async () => {
  const { transport, calls } = spyGeminiTransport(["a plain textual answer, no JSON"]);
  const client = new StructuredAIClient(transport);
  const r = await client.generateText({ purpose: "gemini-text", system: "s", input: "i" });
  assert.equal(r.ok, true);
  assert.deepEqual(calls, ["text"]);
});

test("a structured retry still requests 'json' on the second attempt", async () => {
  const { transport, calls } = spyGeminiTransport(["not json", '{"ok": true, "message": "ok"}']);
  const client = new StructuredAIClient(transport);
  const r = await client.generateStructured({
    purpose: "gemini-json-retry",
    schema: okSchema,
    system: "s",
    input: "i",
  });
  assert.equal(r.ok, true);
  assert.equal(r.meta.attempts, 2);
  assert.deepEqual(calls, ["json", "json"]);
});

// -- JSON mode does not bypass the shared pipeline ----------------------

test("JSON mode: valid JSON still validates through the existing Zod schema", async () => {
  const { transport } = spyGeminiTransport(['{"ok": true, "message": "hi"}']);
  const r = await new StructuredAIClient(transport).generateStructured({
    purpose: "g",
    schema: okSchema,
    system: "s",
    input: "i",
  });
  assert.equal(r.ok, true);
  assert.equal(r.meta.schemaValid, true);
});

test("JSON mode: malformed body still retries at most once → SCHEMA_VALIDATION_FAILED", async () => {
  const { transport, calls } = spyGeminiTransport(["<<garbage>>", "<<still garbage>>"]);
  const r = await new StructuredAIClient(transport).generateStructured({
    purpose: "g",
    schema: okSchema,
    system: "s",
    input: "i",
  });
  assert.equal(r.ok, false);
  assert.equal((r as { failureCode: string }).failureCode, "SCHEMA_VALIDATION_FAILED");
  assert.equal(r.meta.attempts, 2);
  assert.deepEqual(calls, ["json", "json"]);
  assert.equal("data" in r, false);
});

test("JSON mode: a forbidden regulatory-authority field is still guardrail-rejected AFTER parsing", async () => {
  const { transport, calls } = spyGeminiTransport([
    '{"officialWeight": 20}',
    '{"officialWeight": 20}',
  ]);
  const r = await new StructuredAIClient(transport).generateStructured({
    purpose: "g",
    schema: z.record(z.string(), z.unknown()),
    system: "s",
    input: "i",
  });
  assert.equal(r.ok, false);
  assert.equal((r as { failureCode: string }).failureCode, "GUARDRAIL_REJECTED");
  assert.equal(r.meta.attempts, 1, "guardrail rejection must not retry");
  assert.deepEqual(calls, ["json"], "only one transport call before rejection");
});

// -- Anthropic behaviour unchanged ------------------------------------

test("only the Gemini transport acts on JSON response mode; Anthropic does not", () => {
  const root = path.resolve(import.meta.dirname, "../../../../..");
  const gemini = readFileSync(path.join(root, "src/lib/ai/client/geminiTransport.ts"), "utf8");
  const anthropic = readFileSync(path.join(root, "src/lib/ai/client/anthropicTransport.ts"), "utf8");
  assert.match(gemini, /responseMimeType:\s*["']application\/json["']/);
  // The Anthropic transport must not pass a provider JSON-mode switch as a
  // request parameter (a bare mention in an explanatory comment is fine).
  const anthropicNoComments = anthropic
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  assert.equal(
    /responseMimeType|response_mime_type|response_format/.test(anthropicNoComments),
    false,
    "anthropicTransport must not set a provider JSON-mode switch",
  );
});
