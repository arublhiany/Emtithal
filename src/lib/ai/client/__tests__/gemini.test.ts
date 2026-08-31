// =============================================================================
// Phase 4 (Gemini extension) tests — provider selection + shared pipeline.
//
// Provider-selection tests mutate process.env and reset the cached client; no
// network call is made (SDK constructors are pure). Pipeline tests use a fake
// transport whose `provider` is "gemini" to prove the SAME retry / guardrail /
// Zod pipeline serves either provider.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import { StructuredAIClient, UnavailableAIClient } from "@/lib/ai/client/aiClient";
import { getAIClient, __resetAIClientForTests } from "@/lib/ai/client";
import type { AITransport } from "@/lib/ai/client/types";

const okSchema = z.object({ ok: z.literal(true), message: z.string() }).strict();

function geminiFakeTransport(queue: (string | Error)[]): AITransport {
  const q = [...queue];
  return {
    provider: "gemini",
    model: "gemini-fake",
    async complete() {
      const next = q.shift();
      if (next === undefined) throw new Error("queue exhausted");
      if (next instanceof Error) throw next;
      return { text: next };
    },
  };
}

// -- provider selection via getAIClient() ----------------------------------

const ENV_KEYS = ["AI_PROVIDER", "AI_PROVIDER_API_KEY", "AI_MODEL"] as const;

function withEnv(vars: Partial<Record<(typeof ENV_KEYS)[number], string>>, fn: () => void) {
  const saved: Record<string, string | undefined> = {};
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  for (const [k, v] of Object.entries(vars)) process.env[k] = v;
  __resetAIClientForTests();
  try {
    fn();
  } finally {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    __resetAIClientForTests();
  }
}

test("AI_PROVIDER=gemini selects the Gemini transport", () => {
  withEnv({ AI_PROVIDER: "gemini", AI_PROVIDER_API_KEY: "fake", AI_MODEL: "gemini-2.5-flash" }, () => {
    const client = getAIClient();
    assert.ok(client instanceof StructuredAIClient);
    assert.equal((client as StructuredAIClient).providerName, "gemini");
  });
});

test("AI_PROVIDER=anthropic selects the Anthropic transport", () => {
  withEnv({ AI_PROVIDER: "anthropic", AI_PROVIDER_API_KEY: "fake", AI_MODEL: "claude-opus-5" }, () => {
    const client = getAIClient();
    assert.ok(client instanceof StructuredAIClient);
    assert.equal((client as StructuredAIClient).providerName, "anthropic");
  });
});

test("unknown AI_PROVIDER → UnavailableAIClient (AI_UNAVAILABLE)", async () => {
  await new Promise<void>((resolve) => {
    withEnv({ AI_PROVIDER: "openai", AI_PROVIDER_API_KEY: "fake", AI_MODEL: "x" }, () => {
      const client = getAIClient();
      assert.ok(client instanceof UnavailableAIClient);
      client
        .generateStructured({ purpose: "t", schema: okSchema, system: "s", input: "i" })
        .then((r) => {
          assert.equal(r.ok, false);
          assert.equal((r as { failureCode: string }).failureCode, "AI_UNAVAILABLE");
          assert.equal("data" in r, false);
          resolve();
        });
    });
  });
});

test("missing AI_PROVIDER / key / model → UnavailableAIClient (AI_UNAVAILABLE)", () => {
  for (const vars of [
    { AI_PROVIDER_API_KEY: "fake", AI_MODEL: "x" }, // no provider
    { AI_PROVIDER: "gemini", AI_MODEL: "x" }, // no key
    { AI_PROVIDER: "gemini", AI_PROVIDER_API_KEY: "fake" }, // no model
  ]) {
    withEnv(vars, () => {
      assert.ok(getAIClient() instanceof UnavailableAIClient);
    });
  }
});

// -- shared pipeline works identically for Gemini -------------------------

const call = <T>(client: StructuredAIClient, schema: z.ZodType<T>) =>
  client.generateStructured({ purpose: "gemini-test", schema, system: "s", input: "i" });

test("Gemini structured output validates through the existing Zod pipeline", async () => {
  const client = new StructuredAIClient(geminiFakeTransport(['{"ok": true, "message": "hi"}']));
  const r = await call(client, okSchema);
  assert.equal(r.ok, true);
  assert.deepEqual((r as { data: unknown }).data, { ok: true, message: "hi" });
  assert.equal(r.meta.provider, "gemini");
  assert.equal(r.meta.schemaValid, true);
  assert.equal(r.meta.attempts, 1);
});

test("Gemini malformed structured output → one retry → controlled SCHEMA_VALIDATION_FAILED, no data", async () => {
  const client = new StructuredAIClient(geminiFakeTransport(["not json", "still not json"]));
  const r = await call(client, okSchema);
  assert.equal(r.ok, false);
  assert.equal((r as { failureCode: string }).failureCode, "SCHEMA_VALIDATION_FAILED");
  assert.equal(r.meta.attempts, 2);
  assert.equal("data" in r, false);
});

test("Gemini provider error → controlled PROVIDER_ERROR, no fabricated content", async () => {
  const client = new StructuredAIClient(geminiFakeTransport([new Error("gemini 500")]));
  const r = await call(client, okSchema);
  assert.equal(r.ok, false);
  assert.equal((r as { failureCode: string }).failureCode, "PROVIDER_ERROR");
  assert.equal("data" in r, false);
});

test("shared guardrails reject forbidden regulatory-authority fields for Gemini, exactly as for Anthropic", async () => {
  const anySchema = z.record(z.string(), z.unknown());
  for (const payload of [
    '{"complianceStatus":"COMPLIANT"}',
    '{"officialWeight":20}',
    '{"penalty":"1000 SAR"}',
    '{"internalCriticality":"CRITICAL"}',
    '{"targetPopulation":320}',
    '{"isConnected":true}',
  ]) {
    const client = new StructuredAIClient(geminiFakeTransport([payload, payload]));
    const r = await client.generateStructured({ purpose: "g", schema: anySchema, system: "s", input: "i" });
    assert.equal(r.ok, false, payload);
    assert.equal((r as { failureCode: string }).failureCode, "GUARDRAIL_REJECTED");
    assert.equal(r.meta.attempts, 1, "guardrail rejection must not retry");
    assert.equal("data" in r, false);
  }
});

test("Gemini generateText: clean text passes, forbidden assertion → GUARDRAIL_REJECTED", async () => {
  const clean = new StructuredAIClient(geminiFakeTransport(["needs more verified evidence"]));
  const ok = await clean.generateText({ purpose: "g", system: "s", input: "i" });
  assert.equal(ok.ok, true);
  assert.equal(ok.meta.provider, "gemini");

  const bad = new StructuredAIClient(geminiFakeTransport(['"officialWeight": 20']));
  const rejected = await bad.generateText({ purpose: "g", system: "s", input: "i" });
  assert.equal(rejected.ok, false);
  assert.equal((rejected as { failureCode: string }).failureCode, "GUARDRAIL_REJECTED");
});
