// =============================================================================
// One-off live Decision Intelligence Agent check (Phase 7) — either provider.
//
//   node --env-file=.env.local --import tsx src/lib/ai/scripts/liveDecisionAgent.ts
//
// Runs ONE full simulation (interpret + recommend) on SYNTHETIC demo company
// data only. All numbers come from the deterministic Phase 2/3 engines; the AI
// only interprets/explains/recommends. Never prints the API key. Missing /
// unknown provider or missing key/model → NOT_RUN_MISSING_CREDENTIALS.
// =============================================================================

import { readAIConfig } from "@/lib/ai/client/config";
import { __resetAIClientForTests } from "@/lib/ai/client";
import { simulateDecisionScenarios } from "@/lib/ai/agents";

const DECISION_AR =
  "نفكر في زيادة عدد الحجاج المخدومين من 4200 إلى 5200 مع بقاء عدد القوى العاملة 180.";

async function main() {
  const cfg = readAIConfig();
  if (!cfg.present) {
    const detail = cfg.unknownProvider
      ? `unknown AI_PROVIDER '${cfg.unknownProvider}'`
      : `missing ${cfg.missing.join(", ")}`;
    console.log(`LIVE_DECISION_AGENT_TEST = NOT_RUN_MISSING_CREDENTIALS (${detail})`);
    return;
  }

  __resetAIClientForTests();
  const out = await simulateDecisionScenarios({ textAr: DECISION_AR });

  const fields = out.interpretation.requestedChanges.map((m) => m.fieldPath).join(",") || "-";
  const constraints =
    out.interpretation.constraints.map((c) => `${c.fieldPath}=${String(c.expectedValue)}`).join(",") ||
    "-";
  const scenarioIds = out.scenarios.map((s) => s.scenarioId).join(",") || "-";
  const regLineage =
    out.scenarios.flatMap((s) => s.diff.sourceLineage.map((l) => l.requirementId)).join(",") || "-";
  const opCur = out.current.operationalMetrics.pilgrimsPerWorkforceMember.display ?? "—";
  const opA =
    out.scenarios[0]?.state.operationalMetrics.pilgrimsPerWorkforceMember.display ?? "—";
  const base =
    `provider=${cfg.provider} model=${cfg.model} ` +
    `mappedFields=${fields} constraints=${constraints} scenarios=[${scenarioIds}] ` +
    `currentReadiness=${out.current.kpis.readiness ?? "—"} ` +
    `opMetric[current→A]=${opCur}→${opA} ` +
    `officialScoreComputed=${out.officialScoreComputed} ` +
    `recAvailable=${out.recommendation.available} ` +
    `recommendedScenarioId=${out.recommendation.recommendedScenarioId ?? "null"} ` +
    `recNeedsReview=${out.recommendation.needsHumanReview} ` +
    `regLineage=[${regLineage}]`;

  const fieldsAllCanonical =
    out.interpretation.requestedChanges.length > 0 &&
    out.interpretation.rejectedChanges.length === 0;

  if (out.ok && fieldsAllCanonical && out.scenarios.length >= 1 && !out.officialScoreComputed) {
    console.log(`LIVE_DECISION_AGENT_TEST = PASSED ${base}`);
  } else {
    console.log(`LIVE_DECISION_AGENT_TEST = FAILED code=${out.failureCode ?? "INCOMPLETE"} ${base}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.log(`LIVE_DECISION_AGENT_TEST = FAILED code=UNEXPECTED reason=${String(err).slice(0, 200)}`);
  process.exitCode = 1;
});
