// =============================================================================
// One-off live Regulatory Intelligence Agent check (Phase 5) — either provider.
//
//   node --env-file=.env.local --import tsx src/lib/ai/scripts/liveRegulatoryAgent.ts
//
// Makes ONE real server-side call through the agent for a single already-approved,
// non-ambiguous 1447H requirement (HAJ-EXP-05). Prints a machine-readable line.
// Never prints the API key. Never sends company-sensitive data. Missing / unknown
// provider or missing key/model → LIVE_REGULATORY_AGENT_TEST = NOT_RUN_MISSING_CREDENTIALS.
// =============================================================================

import { readAIConfig } from "@/lib/ai/client/config";
import { __resetAIClientForTests } from "@/lib/ai/client";
import { explainRequirement } from "@/lib/ai/agents";

const INTENT_AR =
  "اشرح لي باختصار متطلب توثيق فعاليات ومبادرات فريق السعادة، وما مصدره الرسمي؟";

async function main() {
  const cfg = readAIConfig();
  if (!cfg.present) {
    const detail = cfg.unknownProvider
      ? `unknown AI_PROVIDER '${cfg.unknownProvider}'`
      : `missing ${cfg.missing.join(", ")}`;
    console.log(`LIVE_REGULATORY_AGENT_TEST = NOT_RUN_MISSING_CREDENTIALS (${detail})`);
    return;
  }

  __resetAIClientForTests();
  // Retrieval maps the approved intent deterministically to HAJ-EXP-05; we call
  // by canonical id so the live check is stable and non-ambiguous.
  const r = await explainRequirement("HAJ-EXP-05");

  const src = r.sources[0];
  const base =
    `provider=${r.meta?.provider ?? cfg.provider} model=${r.meta?.model ?? "?"} ` +
    `requirement=${r.requirementIds.join(",") || "-"} ` +
    `regulatoryState=${r.regulatoryState} confidence=${r.confidence} ` +
    `needsHumanReview=${r.needsHumanReview} ` +
    `sourceRef="${(src?.officialSourceReference ?? "-").slice(0, 120)}" ` +
    `locatorComplete=${src?.locatorComplete ?? "-"} ` +
    `titleAr="${src?.titleAr ?? "-"}" intent="${INTENT_AR}"`;

  if (r.ok) {
    console.log(`LIVE_REGULATORY_AGENT_TEST = PASSED ${base} ms=${r.meta?.durationMs ?? "?"}`);
  } else {
    console.log(`LIVE_REGULATORY_AGENT_TEST = FAILED code=${r.failureCode} ${base}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.log(`LIVE_REGULATORY_AGENT_TEST = FAILED code=UNEXPECTED reason=${String(err).slice(0, 200)}`);
  process.exitCode = 1;
});
