// =============================================================================
// One-off live Research Knowledge Agent check (Phase 8).
//
//   node --env-file=.env.local --import tsx src/lib/ai/scripts/liveResearchAgent.ts
//
// Runs ONE real AI research call ONLY when the production corpus is genuinely
// CORPUS_LOADED from a verified local official source (here: the UQU web
// snapshot). It restricts retrieval to SOURCE A (the Institute's Modelling &
// Simulation Unit page) and checks the answer stays decision-support only:
// OFFICIAL_WEB_PAGE + WEB_SECTION provenance, no page number, canonical URL
// reattached by code, no regulatory / compliance claim. Never prints the API
// key. Uses no company data. Corpus pending / missing creds → NOT_RUN.
// =============================================================================

import { readAIConfig } from "@/lib/ai/client/config";
import { __resetAIClientForTests } from "@/lib/ai/client";
import { answerResearchQuestion } from "@/lib/ai/agents";
import {
  RESEARCH_CORPUS_PENDING_CODE,
  WEB_SNAPSHOT_SHA256,
  WEB_SOURCE_SIMULATION_UNIT,
  researchCorpusState,
} from "@/lib/research";

const QUESTION_AR =
  "هل يدعم المصدر الرسمي للمعهد استخدام النمذجة والمحاكاة لتقييم البدائل ودعم اتخاذ القرار؟";
const SOURCE_A_ID = WEB_SOURCE_SIMULATION_UNIT.researchId; // UQU-HAJJ-INSTITUTE-SIMULATION-UNIT
const SOURCE_A_URL = "https://uqu.edu.sa/hajj/70777";

async function main() {
  if (researchCorpusState() === "CORPUS_PENDING") {
    console.log(`LIVE_RESEARCH_AGENT_TEST = NOT_RUN_CORPUS_PENDING (${RESEARCH_CORPUS_PENDING_CODE})`);
    return;
  }

  const cfg = readAIConfig();
  if (!cfg.present) {
    const detail = cfg.unknownProvider
      ? `unknown AI_PROVIDER '${cfg.unknownProvider}'`
      : `missing ${cfg.missing.join(", ")}`;
    console.log(`LIVE_RESEARCH_AGENT_TEST = NOT_RUN_MISSING_CREDENTIALS (${detail})`);
    return;
  }

  __resetAIClientForTests();
  const r = await answerResearchQuestion({
    questionAr: QUESTION_AR,
    restrictToResearchIds: [SOURCE_A_ID],
  });

  const ins = r.insights[0];
  const locators = (ins?.citedPassages ?? []).map((p) =>
    p.locator.type === "WEB_SECTION" ? `web:${p.locator.section}` : `p${p.locator.page}`,
  );
  const pagelessWeb =
    (ins?.citedPassages ?? []).length > 0 &&
    (ins?.citedPassages ?? []).every((p) => p.locator.type === "WEB_SECTION");

  const base =
    `provider=${cfg.provider} model=${cfg.model} ` +
    `corpusState=${r.corpusState} retrieval=${r.retrievalOutcome} ` +
    `research=${r.candidateResearchIds.join(",") || "-"} ` +
    `sourceKind=${ins?.sourceKind ?? "-"} status=${ins?.publicationStatus ?? "-"} ` +
    `officialUrl=${ins?.officialUrl ?? "-"} ` +
    `snapshotHash=${ins?.snapshotHash ? `${ins.snapshotHash.slice(0, 12)}…` : "-"} ` +
    `locators=[${locators.join(" | ")}] ` +
    `needsHumanReview=${r.needsHumanReview} containsRegulatoryClaim=${r.containsRegulatoryClaim}`;

  const ok =
    r.ok &&
    r.insights.length > 0 &&
    r.candidateResearchIds.length === 1 &&
    r.candidateResearchIds[0] === SOURCE_A_ID &&
    ins.researchId === SOURCE_A_ID &&
    ins.sourceKind === "OFFICIAL_WEB_PAGE" &&
    pagelessWeb &&
    ins.officialUrl === SOURCE_A_URL &&
    ins.snapshotHash === WEB_SNAPSHOT_SHA256 &&
    r.containsRegulatoryClaim === false;

  if (ok) {
    console.log(`LIVE_RESEARCH_AGENT_TEST = PASSED ${base} ms=${r.meta?.durationMs ?? "?"}`);
  } else {
    console.log(`LIVE_RESEARCH_AGENT_TEST = FAILED code=${r.failureCode ?? "INCOMPLETE"} ${base}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.log(`LIVE_RESEARCH_AGENT_TEST = FAILED code=UNEXPECTED reason=${String(err).slice(0, 200)}`);
  process.exitCode = 1;
});
