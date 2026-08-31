// =============================================================================
// Phase 4 tests — AIClient failure model, retry, guardrail integration.
// Uses a fake AITransport; the real Anthropic SDK is never touched here.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import { readAIConfig } from "@/lib/ai/client/config";
import { StructuredAIClient, UnavailableAIClient } from "@/lib/ai/client/aiClient";
import type { AITransport } from "@/lib/ai/client/types";

const okSchema = z.object({ ok: z.literal(true), message: z.string() }).strict();

/** Fake transport: each call consumes the next entry (string → text, Error → throw). */
function fakeTransport(queue: (string | Error)[]): AITransport {
  const q = [...queue];
  return {
    provider: "fake",
    model: "fake-model",
    async complete() {
      const next = q.shift();
      if (next === undefined) throw new Error("fake transport queue exhausted");
      if (next instanceof Error) throw next;
      return { text: next };
    },
  };
}

const call = <T>(client: StructuredAIClient, schema: z.ZodType<T>) =>
  client.generateStructured({
    purpose: "test",
    schema,
    system: "system",
    input: "input",
  });

// -- config → AI_UNAVAILABLE --------------------------------------------------

test("missing API key → readAIConfig reports it; UnavailableAIClient → AI_UNAVAILABLE", async () => {
  const cfg = readAIConfig({ AI_PROVIDER: "anthropic", AI_MODEL: "m" });
  assert.equal(cfg.present, false);
  assert.deepEqual((cfg as { missing: string[] }).missing, ["AI_PROVIDER_API_KEY"]);

  const r = await new UnavailableAIClient("no creds").generateStructured({
    purpose: "test",
    schema: okSchema,
    system: "s",
    input: "i",
  });
  assert.equal(r.ok, false);
  assert.equal((r as { failureCode: string }).failureCode, "AI_UNAVAILABLE");
  assert.equal("data" in r, false);
});

test("missing AI_MODEL → readAIConfig reports it", () => {
  const cfg = readAIConfig({ AI_PROVIDER: "gemini", AI_PROVIDER_API_KEY: "k" });
  assert.equal(cfg.present, false);
  assert.deepEqual((cfg as { missing: string[] }).missing, ["AI_MODEL"]);
});

test("missing AI_PROVIDER → readAIConfig reports it (→ AI_UNAVAILABLE)", () => {
  const cfg = readAIConfig({ AI_PROVIDER_API_KEY: "k", AI_MODEL: "m" });
  assert.equal(cfg.present, false);
  assert.deepEqual((cfg as { missing: string[] }).missing, ["AI_PROVIDER"]);
});

test("unknown AI_PROVIDER → not present (→ AI_UNAVAILABLE), reports the bad value", () => {
  const cfg = readAIConfig({ AI_PROVIDER: "openai", AI_PROVIDER_API_KEY: "k", AI_MODEL: "m" });
  assert.equal(cfg.present, false);
  assert.deepEqual((cfg as { missing: string[] }).missing, []);
  assert.equal((cfg as { unknownProvider: string }).unknownProvider, "openai");
});

test("both providers: all present → readAIConfig is present with provider + values", () => {
  assert.deepEqual(readAIConfig({ AI_PROVIDER: "anthropic", AI_PROVIDER_API_KEY: " k ", AI_MODEL: " m " }), {
    present: true,
    provider: "anthropic",
    apiKey: "k",
    model: "m",
  });
  assert.deepEqual(readAIConfig({ AI_PROVIDER: " gemini ", AI_PROVIDER_API_KEY: "k2", AI_MODEL: "m2" }), {
    present: true,
    provider: "gemini",
    apiKey: "k2",
    model: "m2",
  });
});

// -- success / retry / schema ----------------------------------------------

test("schema-valid structured result succeeds on the first attempt", async () => {
  const client = new StructuredAIClient(fakeTransport(['{"ok": true, "message": "hi"}']));
  const r = await call(client, okSchema);
  assert.equal(r.ok, true);
  assert.deepEqual((r as { data: unknown }).data, { ok: true, message: "hi" });
  assert.equal(r.meta.attempts, 1);
  assert.equal(r.meta.schemaValid, true);
  assert.equal(r.meta.success, true);
});

test("code-fenced JSON is still parsed", async () => {
  const client = new StructuredAIClient(fakeTransport(['```json\n{"ok": true, "message": "x"}\n```']));
  const r = await call(client, okSchema);
  assert.equal(r.ok, true);
});

test("malformed output → retry once → controlled SCHEMA_VALIDATION_FAILED, no data", async () => {
  const client = new StructuredAIClient(fakeTransport(["not json at all", "still not json"]));
  const r = await call(client, okSchema);
  assert.equal(r.ok, false);
  assert.equal((r as { failureCode: string }).failureCode, "SCHEMA_VALIDATION_FAILED");
  assert.equal(r.meta.attempts, 2);
  assert.equal("data" in r, false);
});

test("malformed then valid → succeeds on the single retry", async () => {
  const client = new StructuredAIClient(fakeTransport(["nope", '{"ok": true, "message": "ok"}']));
  const r = await call(client, okSchema);
  assert.equal(r.ok, true);
  assert.equal(r.meta.attempts, 2);
});

test("schema-invalid shape → retry once → SCHEMA_VALIDATION_FAILED", async () => {
  const client = new StructuredAIClient(
    fakeTransport(['{"ok": true}', '{"ok": true}']), // missing `message`
  );
  const r = await call(client, okSchema);
  assert.equal(r.ok, false);
  assert.equal((r as { failureCode: string }).failureCode, "SCHEMA_VALIDATION_FAILED");
  assert.equal(r.meta.attempts, 2);
});

// -- provider failure -----------------------------------------------------

test("provider throws → controlled PROVIDER_ERROR, no retry, no data", async () => {
  const client = new StructuredAIClient(fakeTransport([new Error("network down")]));
  const r = await call(client, okSchema);
  assert.equal(r.ok, false);
  assert.equal((r as { failureCode: string }).failureCode, "PROVIDER_ERROR");
  assert.equal(r.meta.attempts, 1);
  assert.equal("data" in r, false);
});

// -- guardrail integration (reject, no retry, no data) --------------------

const rejects = async (payload: string, guardrail?: Record<string, unknown>) => {
  const client = new StructuredAIClient(fakeTransport([payload, payload]));
  const r = await client.generateStructured({
    purpose: "test",
    schema: z.record(z.string(), z.unknown()),
    system: "s",
    input: "i",
    guardrail: guardrail as never,
  });
  assert.equal(r.ok, false, `expected rejection for ${payload}`);
  assert.equal((r as { failureCode: string }).failureCode, "GUARDRAIL_REJECTED");
  assert.equal(r.meta.attempts, 1, "guardrail rejection must not retry");
  assert.equal("data" in r, false);
  assert.ok(Array.isArray((r as { violations?: unknown[] }).violations));
};

test("attempted compliance status → GUARDRAIL_REJECTED", () => rejects('{"complianceStatus":"COMPLIANT"}'));
test("attempted officialWeight → GUARDRAIL_REJECTED", () => rejects('{"officialWeight":20}'));
test("attempted penalty → GUARDRAIL_REJECTED", () => rejects('{"penalty":"1000 SAR"}'));
test("attempted internalCriticality → GUARDRAIL_REJECTED", () => rejects('{"internalCriticality":"CRITICAL"}'));
test("attempted numeric target → GUARDRAIL_REJECTED", () => rejects('{"targetPopulation":320}'));
test("attempted integration state → GUARDRAIL_REJECTED", () => rejects('{"isConnected":true}'));
test("attempted invented authority → GUARDRAIL_REJECTED", () =>
  rejects('{"authorityId":"FAKE_MINISTRY"}', { approvedAuthorityIds: ["MOHU"] }));

// -- generateText guardrail ---------------------------------------------

test("generateText: forbidden field assertion in text → GUARDRAIL_REJECTED", async () => {
  const client = new StructuredAIClient(fakeTransport(['the "officialWeight": 20 applies']));
  const r = await client.generateText({ purpose: "t", system: "s", input: "i" });
  assert.equal(r.ok, false);
  assert.equal((r as { failureCode: string }).failureCode, "GUARDRAIL_REJECTED");
});

test("generateText: clean text passes", async () => {
  const client = new StructuredAIClient(fakeTransport(["This requirement needs more verified evidence."]));
  const r = await client.generateText({ purpose: "t", system: "s", input: "i" });
  assert.equal(r.ok, true);
  assert.equal((r as { data: string }).data, "This requirement needs more verified evidence.");
});

// -- no fabricated output anywhere on failure --------------------------

test("no failure path ever returns a data field", async () => {
  const cases: Promise<{ ok: boolean } & Record<string, unknown>>[] = [
    call(new StructuredAIClient(fakeTransport([new Error("x")])), okSchema),
    call(new StructuredAIClient(fakeTransport(["bad", "bad"])), okSchema),
    call(new StructuredAIClient(fakeTransport(['{"officialWeight":1}', '{"officialWeight":1}'])), okSchema),
    new UnavailableAIClient("n").generateStructured({ purpose: "t", schema: okSchema, system: "s", input: "i" }),
  ];
  for (const p of cases) {
    const r = await p;
    assert.equal(r.ok, false);
    assert.equal("data" in r, false);
  }
});
