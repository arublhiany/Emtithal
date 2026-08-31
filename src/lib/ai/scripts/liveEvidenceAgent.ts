// =============================================================================
// One-off live Evidence Intelligence Agent check (Phase 6) — either provider.
//
//   node --env-file=.env.local --import tsx src/lib/ai/scripts/liveEvidenceAgent.ts
//
// Sends ONE minimal real call using ONLY synthetic extracted text (no real
// company/user file). Candidate requirements are restricted to HAJ-EXP-05.
// Prints a machine-readable line. Never prints the API key. Missing / unknown
// provider or missing key/model → NOT_RUN_MISSING_CREDENTIALS.
// =============================================================================

import { readAIConfig } from "@/lib/ai/client/config";
import { __resetAIClientForTests } from "@/lib/ai/client";
import { analyzeEvidence } from "@/lib/ai/agents";
import type { ExtractedEvidenceFact } from "@/lib/evidence/types";

const SYNTHETIC_AR =
  "تم تنفيذ وتوثيق ثلاث فعاليات لفريق السعادة خلال موسم 1447هـ، ويتضمن السجل أسماء الفعاليات وتواريخ التنفيذ.";

const facts: ExtractedEvidenceFact[] = [
  {
    factId: "live-ev#p1",
    text: SYNTHETIC_AR,
    value: SYNTHETIC_AR,
    evidenceId: "live-ev",
    fileName: "synthetic.txt",
    sourceLocator: { kind: "PDF_PAGE", page: 1 },
    extractionMethod: "PDF_TEXT",
  },
];

async function main() {
  const cfg = readAIConfig();
  if (!cfg.present) {
    const detail = cfg.unknownProvider
      ? `unknown AI_PROVIDER '${cfg.unknownProvider}'`
      : `missing ${cfg.missing.join(", ")}`;
    console.log(`LIVE_EVIDENCE_AGENT_TEST = NOT_RUN_MISSING_CREDENTIALS (${detail})`);
    return;
  }

  __resetAIClientForTests();
  const r = await analyzeEvidence({
    extraction: {
      ok: true,
      state: "EXTRACTED",
      evidenceId: "live-ev",
      companyId: "synthetic",
      fileName: "synthetic.txt",
      facts,
    },
    candidateRequirementIds: ["HAJ-EXP-05"],
  });

  const mapped = r.mappings.map((m) => m.requirementId).join(",") || "-";
  const title = r.mappings[0]?.titleAr ?? "-";
  const support = (r.mappings[0]?.appearsToSupportAr ?? "-").slice(0, 160);
  const base =
    `provider=${r.meta?.provider ?? cfg.provider} model=${r.meta?.model ?? "?"} ` +
    `state=${r.state} mappedRequirements=${mapped} titleAr="${title}" ` +
    `complianceAsserted=${r.complianceAsserted} needsHumanReview=${r.needsHumanReview} ` +
    `appearsToSupport="${support}"`;

  if (r.ok && r.mappings.length > 0 && !r.complianceAsserted) {
    console.log(`LIVE_EVIDENCE_AGENT_TEST = PASSED ${base} ms=${r.meta?.durationMs ?? "?"}`);
  } else {
    console.log(`LIVE_EVIDENCE_AGENT_TEST = FAILED code=${r.failureCode ?? "NO_MAPPING"} ${base}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.log(`LIVE_EVIDENCE_AGENT_TEST = FAILED code=UNEXPECTED reason=${String(err).slice(0, 200)}`);
  process.exitCode = 1;
});
