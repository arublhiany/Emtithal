// =============================================================================
// One-off live Emtithal Orchestrator check (Phase 9) — either provider.
//
//   node --env-file=.env.local --import tsx src/lib/ai/scripts/liveOrchestrator.ts
//
// Runs ONE orchestration of a safe COMBINED_ANALYSIS request against the
// canonical demo company only. A regulatory+research combined request needs the
// minimum of two child LLM calls (regulatory interpretation + research support);
// deterministic engines run without any AI call. Never prints the API key. Uses
// no real company data. Missing / unknown provider → NOT_RUN_MISSING_CREDENTIALS.
// =============================================================================

import { readAIConfig } from "@/lib/ai/client/config";
import { __resetAIClientForTests } from "@/lib/ai/client";
import { runOrchestration } from "@/lib/orchestrator";
import { WEB_SOURCE_SIMULATION_UNIT } from "@/lib/research";

const REQUEST_AR =
  "اشرح متطلب توثيق فعاليات ومبادرات فريق السعادة، وهل توجد دلالة بحثية عامة تدعم استخدام النمذجة والمحاكاة عند تقييم البدائل التشغيلية؟";

const CANONICAL_TITLE = "توثيق فعاليات ومبادرات فريق السعادة";

async function main() {
  const cfg = readAIConfig();
  if (!cfg.present) {
    const detail = cfg.unknownProvider
      ? `unknown AI_PROVIDER '${cfg.unknownProvider}'`
      : `missing ${cfg.missing.join(", ")}`;
    console.log(`LIVE_ORCHESTRATOR_TEST = NOT_RUN_MISSING_CREDENTIALS (${detail})`);
    return;
  }

  __resetAIClientForTests();
  const r = await runOrchestration({ textAr: REQUEST_AR });

  const reg = r.regulatoryResult;
  const regTitle = reg?.sources[0]?.titleAr ?? "-";
  const research = r.researchResult;
  const ins = research?.insights[0];
  const locKinds = [
    ...new Set((ins?.citedPassages ?? []).map((p) => p.locator.type)),
  ];

  const ranVerification = r.capabilitiesUsed.some(
    (c) => c.capability === "DETERMINISTIC_VERIFICATION",
  );

  const base =
    `provider=${cfg.provider} model=${cfg.model} intent=${r.intent} ` +
    `caps=[${r.capabilitiesUsed.map((c) => `${c.capability}:${c.status}`).join(" | ")}] ` +
    `aiCalls=${r.meta.aiCallsMade} ` +
    `ranDeterministicVerification=${ranVerification} ` +
    `regReq=${reg?.requirementIds.join(",") || "-"} regTitle="${regTitle}" regState=${reg?.regulatoryState ?? "-"} ` +
    `applicability=${r.deterministicResults.applicability?.outcome ?? "-"} ` +
    `research=${r.provenance.research?.researchIds.join(",") || "-"} ` +
    `researchKind=${r.provenance.research?.sourceKinds.join(",") || "-"} ` +
    `researchStatus=${r.provenance.research?.publicationStatuses.join(",") || "-"} ` +
    `researchLocators=[${locKinds.join(",")}] ` +
    `snapshotHash=${(r.provenance.research?.snapshotHashes[0] ?? "-")?.toString().slice(0, 12)}… ` +
    `needsHumanReview=${r.needsHumanReview} reasons=[${r.needsHumanReviewReasons.join(",")}] ` +
    `researchContainsRegClaim=${research?.containsRegulatoryClaim}`;

  const noPageForWeb = (ins?.citedPassages ?? []).every((p) => p.locator.type === "WEB_SECTION");

  // request-scoped: this combined request must NOT trigger a company-wide
  // verification snapshot, and must NOT leak unrelated company-wide review reasons.
  const LEAKY_REASONS = [
    "critical-blocker-present",
    "pending-verification",
    "regulatory-pending-requirement",
    "ambiguous-applicability",
    "provisional-research-source",
  ];
  const noLeak = LEAKY_REASONS.every((x) => !r.needsHumanReviewReasons.includes(x));

  const ok =
    r.intent === "COMBINED_ANALYSIS" &&
    ranVerification === false &&
    reg?.ok === true &&
    reg.requirementIds.join(",") === "HAJ-EXP-05" &&
    regTitle === CANONICAL_TITLE &&
    reg.regulatoryState !== "UNRESOLVED_REQUIREMENT" &&
    r.deterministicResults.applicability?.outcome === "APPLICABLE" &&
    research?.ok === true &&
    research.retrievalOutcome === "MATCH" &&
    (research.containsRegulatoryClaim as boolean) === false &&
    r.provenance.research?.researchIds[0] === WEB_SOURCE_SIMULATION_UNIT.researchId &&
    noPageForWeb &&
    r.provenance.research?.snapshotHashes[0] === WEB_SOURCE_SIMULATION_UNIT.snapshotHash &&
    noLeak;

  if (ok) {
    console.log(`LIVE_ORCHESTRATOR_TEST = PASSED ${base} ms=${r.meta.durationMs}`);
  } else {
    console.log(`LIVE_ORCHESTRATOR_TEST = FAILED ${base}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.log(`LIVE_ORCHESTRATOR_TEST = FAILED code=UNEXPECTED reason=${String(err).slice(0, 200)}`);
  process.exitCode = 1;
});
