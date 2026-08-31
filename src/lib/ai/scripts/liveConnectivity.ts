// =============================================================================
// One-off live AI connectivity check (Phase 4) — works with either provider.
//
//   node --env-file=.env.local --import tsx src/lib/ai/scripts/liveConnectivity.ts
//
// Selects the provider from AI_PROVIDER (anthropic | gemini) and makes ONE
// minimal real server-side call through AIClient with a harmless, non-regulatory
// structured-output prompt. Prints a machine-readable result line. Never prints
// the API key. Missing / unknown provider or missing key/model → it prints
// LIVE_AI_TEST = NOT_RUN_MISSING_CREDENTIALS and exits 0.
// =============================================================================

import { z } from "zod";
import { readAIConfig } from "@/lib/ai/client/config";
import { getAIClient, __resetAIClientForTests } from "@/lib/ai/client";

const connectivitySchema = z
  .object({ ok: z.literal(true), message: z.string() })
  .strict();

async function main() {
  const cfg = readAIConfig();
  if (!cfg.present) {
    const detail = cfg.unknownProvider
      ? `unknown AI_PROVIDER '${cfg.unknownProvider}'`
      : `missing ${cfg.missing.join(", ")}`;
    console.log(`LIVE_AI_TEST = NOT_RUN_MISSING_CREDENTIALS (${detail})`);
    return;
  }

  __resetAIClientForTests();
  const client = getAIClient();
  const result = await client.generateStructured({
    purpose: "phase4-connectivity",
    schema: connectivitySchema,
    system: "You are a connectivity probe. Do not reason about anything.",
    input: 'Return exactly this JSON: {"ok": true, "message": "connected"}',
    // Leave maxTokens at the client default (1024) so adaptive thinking on
    // current models has room and the JSON is not truncated.
  });

  if (result.ok) {
    console.log(
      `LIVE_AI_TEST = PASSED (provider=${result.meta.provider}, model=${result.meta.model}, ms=${result.meta.durationMs})`,
    );
  } else {
    console.log(
      `LIVE_AI_TEST = FAILED provider=${cfg.provider} code=${result.failureCode} reason=${result.message.slice(0, 200)}`,
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.log(`LIVE_AI_TEST = FAILED code=UNEXPECTED reason=${String(err).slice(0, 200)}`);
  process.exitCode = 1;
});
