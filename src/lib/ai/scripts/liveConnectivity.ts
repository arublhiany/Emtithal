// =============================================================================
// One-off live Claude connectivity check (Phase 4).
//
//   npx tsx src/lib/ai/scripts/liveConnectivity.ts
//
// Makes ONE minimal real server-side call through AIClient with a harmless,
// non-regulatory structured-output prompt. Prints a machine-readable result
// line. Never prints the API key. If credentials are missing it prints
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
    console.log(`LIVE_AI_TEST = NOT_RUN_MISSING_CREDENTIALS (missing ${cfg.missing.join(", ")})`);
    return;
  }

  __resetAIClientForTests();
  const client = getAIClient();
  const result = await client.generateStructured({
    purpose: "phase4-connectivity",
    schema: connectivitySchema,
    system: "You are a connectivity probe. Do not reason about anything.",
    input: 'Return exactly this JSON: {"ok": true, "message": "connected"}',
    maxTokens: 64,
  });

  if (result.ok) {
    console.log(`LIVE_AI_TEST = PASSED (model=${result.meta.model}, ms=${result.meta.durationMs})`);
  } else {
    console.log(
      `LIVE_AI_TEST = FAILED code=${result.failureCode} reason=${result.message.slice(0, 200)}`,
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.log(`LIVE_AI_TEST = FAILED code=UNEXPECTED reason=${String(err).slice(0, 200)}`);
  process.exitCode = 1;
});
