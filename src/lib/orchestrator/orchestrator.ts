// =============================================================================
// Emtithal AI Orchestrator — Phase 9. Server-side only. COORDINATION ONLY.
//
// Runs the MINIMUM approved capabilities a request needs, in the locked order
// (regulation → evidence → decision → research), combines their outputs WITHOUT
// changing any canonical result, and returns a structured response with explicit
// provenance and capability boundaries.
//
// It is NOT an autonomous agent loop: no recursive planning, no multi-agent
// conversation, no background actions, no browsing, no tools beyond the approved
// local/server capabilities. Every canonical input is read-only.
// =============================================================================

import { randomUUID } from "node:crypto";

import type { AIClient, AICallMeta } from "@/lib/ai/client/types";
import type { CanonicalCompanyProfile } from "@/lib/model";
import { getRegulatoryRequirements } from "@/lib/data/regulatory";
import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
import { DEMO_VERIFICATION_INPUTS } from "@/lib/data/demo/verificationInputs";
import { verifyAll, type RequirementVerificationInput } from "@/lib/engine/verificationEngine";

import {
  answerRegulatoryQuestion,
  explainApplicability,
  type RegulatoryAgentResult,
} from "@/lib/ai/agents/regulatoryAgent";
import { retrieveCandidates } from "@/lib/ai/agents/regulatoryRetrieval";
import {
  analyzeEvidence,
  type EvidenceAgentInput,
  type EvidenceAgentResult,
} from "@/lib/ai/agents/evidenceAgent";
import {
  simulateDecisionScenarios,
  type DecisionSimulationOutput,
} from "@/lib/ai/agents/decisionAgent";
import {
  answerResearchQuestion,
  getResearchInsightsForDecision,
  type ResearchAgentResult,
} from "@/lib/ai/agents/researchAgent";

import { classifyIntent, extractRequirementId, routingForForcedIntent } from "./routing";
import type {
  CapabilityStatus,
  CapabilityStatusEntry,
  DeterministicVerificationView,
  OrchestratorCapability,
  OrchestratorDeterministicResults,
  OrchestratorFailureCode,
  OrchestratorInsight,
  OrchestratorIntent,
  OrchestratorProvenance,
  OrchestratorResult,
  RoutingDecision,
} from "./types";

if (typeof window !== "undefined") {
  throw new Error("@/lib/orchestrator is server-only and must not run in the browser.");
}

// -- request / options ---------------------------------------------------------

export interface OrchestratorRequest {
  /** The user's request, natural language (Arabic or English). */
  textAr: string;
  /** Company profile. Defaults to the canonical demo company. NEVER mutated. */
  profile?: CanonicalCompanyProfile;
  /** Verification inputs. Defaults to the demo inputs. NEVER mutated. */
  verificationInputs?: RequirementVerificationInput[];
  /** A successful `ingestEvidence` result — makes EVIDENCE a live capability. */
  evidenceExtraction?: EvidenceAgentInput["extraction"];
  /** Skip routing and force an intent (explicit UI action / tests). */
  forceIntent?: OrchestratorIntent;
}

export interface OrchestratorOptions {
  /** Injected AI client passed to EVERY child agent (tests). Defaults to the shared client. */
  client?: AIClient;
}

// -- helpers -----------------------------------------------------------------

const REQUIREMENTS = getRegulatoryRequirements();

function has(caps: OrchestratorCapability[], c: OrchestratorCapability): boolean {
  return caps.includes(c);
}

function statusFromChildFailure(code: string | null, ok: boolean): CapabilityStatus {
  if (ok) return "SUCCESS";
  switch (code) {
    case "AI_UNAVAILABLE":
    case "PROVIDER_ERROR":
      return "UNAVAILABLE";
    case "OUT_OF_CORPUS":
    case "SEASON_MISMATCH":
    case "NO_RELEVANT_RESEARCH":
    case "CORPUS_PENDING":
    case "EXTRACTION_UNAVAILABLE":
    case "UNSUPPORTED_DECISION":
    case "INSUFFICIENT_DECISION_DATA":
      return "NO_RELEVANT_DATA";
    // SCHEMA_VALIDATION_FAILED | GUARDRAIL_REJECTED | AMBIGUOUS_* | anything else
    default:
      return "FAILED_SAFE";
  }
}

/** Read-only snapshot of the deterministic verification engine — never engine internals. */
function verificationSnapshot(
  profile: CanonicalCompanyProfile,
  inputs: RequirementVerificationInput[],
): DeterministicVerificationView {
  const run = verifyAll(REQUIREMENTS, profile, inputs);
  return {
    readiness: { ...run.readiness },
    coverage: { ...run.coverage },
    criticalBlockerIds: run.criticalBlockers.map((b) => b.requirementId),
    verificationGapIds: run.verificationGaps.map((g) => g.requirementId),
    pendingVerificationIds: [...run.pendingWarnings],
    regulatoryPendingIds: [...run.regulatoryPendingIds],
    applicabilityPendingIds: [...run.applicabilityPendingIds],
    statusCounts: { ...run.statusCounts },
    officialScoreComputed: false,
  };
}

// -- public API ------------------------------------------------------------

export async function runOrchestration(
  request: OrchestratorRequest,
  opts: OrchestratorOptions = {},
): Promise<OrchestratorResult> {
  const started = Date.now();
  const requestId = randomUUID();
  const profile = request.profile ?? DEMO_COMPANY_PROFILE;
  const verificationInputs = request.verificationInputs ?? DEMO_VERIFICATION_INPUTS;
  const evidenceAvailable = !!request.evidenceExtraction?.ok;

  const routing: RoutingDecision = request.forceIntent
    ? routingForForcedIntent(request.forceIntent)
    : classifyIntent(request.textAr, { evidenceAvailable });

  const caps = routing.capabilities;
  const capsUsed: CapabilityStatusEntry[] = [];
  const warnings: string[] = [];
  const reviewReasons: string[] = [];
  const llmMetas: AICallMeta[] = [];

  // -- UNSUPPORTED: invoke nothing -----------------------------------------
  if (routing.intent === "UNSUPPORTED") {
    return finalize({
      requestId,
      started,
      intent: routing.intent,
      routing,
      capabilitiesUsed: [],
      deterministic: { applicability: null, verification: null, scenario: null },
      regulatoryResult: null,
      evidenceResult: null,
      researchResult: null,
      decisionResults: null,
      warnings: ["الطلب خارج نطاق القدرات المعتمدة — لم يُستدعَ أي وكيل."],
      reviewReasons: [],
      llmMetas: [],
      failureCode: "UNSUPPORTED_REQUEST",
    });
  }

  // -- 1. deterministic verification snapshot (regulation / decision / combined) --
  let verification: DeterministicVerificationView | null = null;
  if (has(caps, "DETERMINISTIC_VERIFICATION")) {
    verification = verificationSnapshot(profile, verificationInputs);
    capsUsed.push({
      capability: "DETERMINISTIC_VERIFICATION",
      status: "SUCCESS",
      detail: `readiness=${verification.readiness.value ?? "—"} coverage=${verification.coverage.value ?? "—"} blockers=${verification.criticalBlockerIds.length}`,
      meta: null,
    });
    if (verification.criticalBlockerIds.length > 0) reviewReasons.push("critical-blocker-present");
    if (verification.pendingVerificationIds.length > 0) reviewReasons.push("pending-verification");
    if (verification.regulatoryPendingIds.length > 0) reviewReasons.push("regulatory-pending-requirement");
    if (verification.applicabilityPendingIds.length > 0) reviewReasons.push("ambiguous-applicability");
  }

  // -- 2. regulatory intelligence (deterministic applicability runs inside it) --
  let regulatoryResult: RegulatoryAgentResult | null = null;
  if (has(caps, "REGULATORY_INTELLIGENCE")) {
    const clientOpt = opts.client ? { client: opts.client } : {};
    // Deterministic retrieval first. If the user named a requirement id, use it;
    // otherwise resolve from the free text. A single canonical MATCH + a company
    // profile → the company-specific applicability path (deterministic
    // applicability runs inside `explainApplicability` before the LLM). Anything
    // ambiguous / out of corpus → a controlled free-text result.
    const explicitId = extractRequirementId(request.textAr);
    const retrieval = explicitId
      ? retrieveCandidates({ requirementId: explicitId })
      : retrieveCandidates({ text: request.textAr });
    regulatoryResult =
      retrieval.kind === "MATCH" && retrieval.candidateIds.length === 1
        ? await explainApplicability(
            { requirementIdOrAlias: retrieval.candidateIds[0], profile },
            clientOpt,
          )
        : await answerRegulatoryQuestion({ text: request.textAr }, clientOpt);
    if (regulatoryResult.meta) llmMetas.push(regulatoryResult.meta);
    capsUsed.push({
      capability: "DETERMINISTIC_APPLICABILITY",
      status: regulatoryResult.deterministicApplicability ? "SUCCESS" : "NOT_REQUIRED",
      detail: regulatoryResult.deterministicApplicability
        ? `${regulatoryResult.deterministicApplicability.requirementId}:${regulatoryResult.deterministicApplicability.outcome}`
        : "no single requirement in scope / no profile",
      meta: null,
    });
    capsUsed.push({
      capability: "REGULATORY_INTELLIGENCE",
      status: statusFromChildFailure(regulatoryResult.failureCode, regulatoryResult.ok),
      detail: regulatoryResult.failureCode ?? `state=${regulatoryResult.regulatoryState}`,
      meta: regulatoryResult.meta,
    });
    // an `*-interpretation-review` reason is added ONLY when a SUCCESSFUL AI
    // interpretation was surfaced AND it legitimately needs review.
    if (regulatoryResult.ok && regulatoryResult.needsHumanReview)
      reviewReasons.push("regulatory-interpretation-review");
    // deterministic / retrieval conditions (independent of the LLM call outcome)
    if (regulatoryResult.regulatoryState === "UNRESOLVED_REQUIREMENT")
      reviewReasons.push("unresolved-requirement");
    if (regulatoryResult.ambiguous) reviewReasons.push("ambiguous-regulatory-retrieval");
    if (regulatoryResult.deterministicApplicability?.outcome === "INSUFFICIENT_DATA")
      reviewReasons.push("insufficient-applicability-data");
    if (!regulatoryResult.ok && isRequestedFailure(regulatoryResult.failureCode))
      reviewReasons.push("requested-regulatory-capability-failed");
  }

  // -- 3. evidence intelligence (only when an extraction is attached) -----------
  let evidenceResult: EvidenceAgentResult | null = null;
  if (has(caps, "EVIDENCE_INTELLIGENCE")) {
    if (!request.evidenceExtraction) {
      warnings.push("طُلبت قدرة تفسير الأدلة لكن لم يُرفَق أي ملف/استخراج — لن يُخترع دليل.");
      capsUsed.push({
        capability: "EVIDENCE_INTELLIGENCE",
        status: "NO_RELEVANT_DATA",
        detail: "no evidence extraction attached",
        meta: null,
      });
      reviewReasons.push("evidence-requested-but-absent");
    } else {
      const candidateRequirementIds = regulatoryResult?.requirementIds?.length
        ? regulatoryResult.requirementIds
        : undefined;
      evidenceResult = await analyzeEvidence(
        { extraction: request.evidenceExtraction, candidateRequirementIds },
        opts.client ? { client: opts.client } : {},
      );
      if (evidenceResult.meta) llmMetas.push(evidenceResult.meta);
      const evStatus: CapabilityStatus = evidenceResult.outOfScope
        ? "NO_RELEVANT_DATA"
        : statusFromChildFailure(evidenceResult.failureCode, evidenceResult.ok);
      capsUsed.push({
        capability: "EVIDENCE_INTELLIGENCE",
        status: evStatus,
        detail: evidenceResult.failureCode ?? `state=${evidenceResult.state} mappings=${evidenceResult.mappings.length}`,
        meta: evidenceResult.meta,
      });
      // only when a SURFACED interpretation (state AI_INTERPRETED) needs review
      if (
        evidenceResult.ok &&
        evidenceResult.state === "AI_INTERPRETED" &&
        evidenceResult.needsHumanReview
      )
        reviewReasons.push("evidence-interpretation-review");
      if (evidenceResult.ok && evidenceResult.conflicts.length > 0)
        reviewReasons.push("conflicting-evidence");
      if (!evidenceResult.ok && isRequestedFailure(evidenceResult.failureCode))
        reviewReasons.push("requested-evidence-capability-failed");
    }
  }

  // -- 4. decision intelligence (deterministic CURRENT + scenarios) ------------
  let decisionResults: DecisionSimulationOutput | null = null;
  if (has(caps, "DECISION_INTELLIGENCE")) {
    decisionResults = await simulateDecisionScenarios(
      { textAr: request.textAr, profile },
      opts.client ? { client: opts.client } : {},
    );
    for (const m of [decisionResults.interpretation.meta, decisionResults.recommendation.meta]) {
      if (m) llmMetas.push(m);
    }
    capsUsed.push({
      capability: "DECISION_INTELLIGENCE",
      status: statusFromChildFailure(decisionResults.failureCode, decisionResults.ok),
      detail:
        decisionResults.failureCode ??
        `scenarios=${decisionResults.scenarios.length} recommend=${decisionResults.recommendation.recommendedScenarioId ?? "—"}`,
      meta: decisionResults.recommendation.meta ?? decisionResults.interpretation.meta,
    });
    // interpretation-review only when the interpretation actually succeeded
    if (decisionResults.interpretation.ok && decisionResults.interpretation.needsHumanReview)
      reviewReasons.push("decision-interpretation-review");
    // recommendation-review only when a recommendation was actually surfaced
    if (decisionResults.recommendation.available && decisionResults.recommendation.needsHumanReview)
      reviewReasons.push("decision-recommendation-review");
    // a guardrail-rejected recommendation keeps its dedicated reason — the
    // deterministic scenario output still exists and the recommendation was
    // explicitly rejected.
    if (decisionResults.recommendation.failureCode === "GUARDRAIL_REJECTED")
      reviewReasons.push("decision-recommendation-guardrail-rejected");
    else if (
      !decisionResults.ok &&
      isRequestedFailure(decisionResults.failureCode)
    )
      reviewReasons.push("requested-decision-capability-failed");
    else if (
      decisionResults.recommendation.failureCode &&
      isRequestedFailure(decisionResults.recommendation.failureCode)
    )
      reviewReasons.push("requested-decision-capability-failed");
  }

  // -- 5. research intelligence — ALWAYS LAST. never feeds steps 1-4 -----------
  let researchResult: ResearchAgentResult | null = null;
  if (has(caps, "RESEARCH_INTELLIGENCE")) {
    const firstDiff = decisionResults?.scenarios[0]?.diff ?? null;
    researchResult = firstDiff
      ? await getResearchInsightsForDecision(
          { scenarioDiff: firstDiff, questionAr: request.textAr },
          opts.client ? { client: opts.client } : {},
        )
      : await answerResearchQuestion(
          { questionAr: request.textAr },
          opts.client ? { client: opts.client } : {},
        );
    if (researchResult.meta) llmMetas.push(researchResult.meta);
    capsUsed.push({
      capability: "RESEARCH_INTELLIGENCE",
      status: statusFromChildFailure(researchResult.failureCode, researchResult.ok),
      detail: researchResult.failureCode ?? `retrieval=${researchResult.retrievalOutcome} insights=${researchResult.insights.length}`,
      meta: researchResult.meta,
    });
    // Request-scoped: a review reason is added ONLY from an ACTUALLY SURFACED
    // insight's own canonical properties — never from the aggregate flag and
    // never merely because Research Intelligence ran.
    const provisionalResearch = researchResult.insights.some(
      (i) => i.publicationStatus === "INTERIM_REPORT" || i.sourceKind === "OFFICIAL_STUDY_PAGE",
    );
    if (provisionalResearch) reviewReasons.push("provisional-research-source");
    if (researchResult.insights.some((i) => i.interpretationConfidence === "LOW"))
      reviewReasons.push("research-interpretation-review");
    if (!researchResult.ok && isRequestedFailure(researchResult.failureCode))
      reviewReasons.push("requested-research-capability-failed");
  }

  // -- failure aggregation -------------------------------------------------
  const requiredAiCaps = caps.filter(
    (c): c is OrchestratorCapability =>
      c === "REGULATORY_INTELLIGENCE" ||
      c === "EVIDENCE_INTELLIGENCE" ||
      c === "DECISION_INTELLIGENCE" ||
      c === "RESEARCH_INTELLIGENCE",
  );
  const anyAiSuccess = capsUsed.some(
    (e) => requiredAiCaps.includes(e.capability) && e.status === "SUCCESS",
  );
  const anyDeterministic =
    verification !== null ||
    decisionResults !== null ||
    (regulatoryResult?.deterministicApplicability ?? null) !== null;
  const failureCode: OrchestratorFailureCode | null =
    !anyAiSuccess && !anyDeterministic && requiredAiCaps.length > 0
      ? "NO_CAPABILITY_PRODUCED_OUTPUT"
      : null;

  return finalize({
    requestId,
    started,
    intent: routing.intent,
    routing,
    capabilitiesUsed: capsUsed,
    deterministic: {
      applicability: regulatoryResult?.deterministicApplicability ?? null,
      verification,
      scenario: decisionResults,
    },
    regulatoryResult,
    evidenceResult,
    researchResult,
    decisionResults,
    warnings,
    reviewReasons,
    llmMetas,
    failureCode,
  });
}

// -- finalisation ----------------------------------------------------------

/** A controlled child failure for a capability the user's intent explicitly requested. */
function isRequestedFailure(code: string | null): boolean {
  return (
    code === "SCHEMA_VALIDATION_FAILED" ||
    code === "GUARDRAIL_REJECTED" ||
    code === "AI_UNAVAILABLE" ||
    code === "PROVIDER_ERROR" ||
    code === "AMBIGUOUS_RETRIEVAL" ||
    code === "AMBIGUOUS_RESEARCH"
  );
}

interface FinalizeArgs {
  requestId: string;
  started: number;
  intent: OrchestratorIntent;
  routing: RoutingDecision;
  capabilitiesUsed: CapabilityStatusEntry[];
  deterministic: OrchestratorDeterministicResults;
  regulatoryResult: RegulatoryAgentResult | null;
  evidenceResult: EvidenceAgentResult | null;
  researchResult: ResearchAgentResult | null;
  decisionResults: DecisionSimulationOutput | null;
  warnings: string[];
  reviewReasons: string[];
  llmMetas: AICallMeta[];
  failureCode: OrchestratorFailureCode | null;
}

function finalize(a: FinalizeArgs): OrchestratorResult {
  const aiInsights = buildAiInsights(a.regulatoryResult, a.decisionResults);
  const evidenceInsights = buildEvidenceInsights(a.evidenceResult);
  const researchInsights = buildResearchInsights(a.researchResult);
  const provenance = buildProvenance(
    a.regulatoryResult,
    a.evidenceResult,
    a.decisionResults,
    a.researchResult,
    a.llmMetas,
  );
  const reasons = [...new Set(a.reviewReasons)].sort();

  return {
    requestId: a.requestId,
    intent: a.intent,
    routing: a.routing,
    capabilitiesUsed: a.capabilitiesUsed,
    deterministicResults: a.deterministic,
    aiInsights,
    researchInsights,
    evidenceInsights,
    decisionResults: a.decisionResults,
    regulatoryResult: a.regulatoryResult,
    evidenceResult: a.evidenceResult,
    researchResult: a.researchResult,
    warnings: a.warnings,
    needsHumanReview: reasons.length > 0,
    needsHumanReviewReasons: reasons,
    provenance,
    failureCode: a.failureCode,
    meta: {
      requestId: a.requestId,
      aiCallsMade: a.llmMetas.length,
      llmMetas: a.llmMetas,
      durationMs: Date.now() - a.started,
    },
  };
}

// -- flattened insight builders (verbatim from child fields — no re-synthesis) --

function buildAiInsights(
  reg: RegulatoryAgentResult | null,
  dec: DecisionSimulationOutput | null,
): OrchestratorInsight[] {
  const out: OrchestratorInsight[] = [];
  if (reg?.ok && reg.answerAr) {
    out.push({
      kind: "REGULATORY_INTERPRETATION",
      capability: "REGULATORY_INTELLIGENCE",
      textAr: reg.answerAr,
      refs: [...reg.requirementIds],
      needsHumanReview: reg.needsHumanReview,
    });
  }
  if (dec?.recommendation.available && dec.recommendation.recommendationAr) {
    out.push({
      kind: "DECISION_RECOMMENDATION",
      capability: "DECISION_INTELLIGENCE",
      textAr: dec.recommendation.recommendationAr,
      refs: dec.recommendation.recommendedScenarioId ? [dec.recommendation.recommendedScenarioId] : [],
      needsHumanReview: dec.recommendation.needsHumanReview,
    });
  }
  return out;
}

function buildEvidenceInsights(ev: EvidenceAgentResult | null): OrchestratorInsight[] {
  if (!ev?.ok || ev.state !== "AI_INTERPRETED") return [];
  return ev.mappings.map((m) => ({
    kind: "EVIDENCE_INTERPRETATION" as const,
    capability: "EVIDENCE_INTELLIGENCE" as const,
    textAr: m.appearsToSupportAr,
    refs: [m.requirementId, ...m.evidenceFactIds],
    needsHumanReview:
      m.interpretationConfidence === "LOW" || m.regulatoryResolution === "UNRESOLVED_REQUIREMENT",
  }));
}

function buildResearchInsights(res: ResearchAgentResult | null): OrchestratorInsight[] {
  if (!res?.ok) return [];
  return res.insights.map((ins) => ({
    kind: "RESEARCH_SUPPORT" as const,
    capability: "RESEARCH_INTELLIGENCE" as const,
    // decision-support wording only — kept verbatim from the guardrailed child field
    textAr: ins.claimAr,
    refs: [ins.researchId],
    needsHumanReview: ins.needsHumanReview,
  }));
}

// -- provenance (reattached from child results — never via an LLM) ----------

function buildProvenance(
  reg: RegulatoryAgentResult | null,
  ev: EvidenceAgentResult | null,
  dec: DecisionSimulationOutput | null,
  res: ResearchAgentResult | null,
  ai: AICallMeta[],
): OrchestratorProvenance {
  const evidence =
    ev && ev.facts.length > 0
      ? {
          evidenceId: ev.evidenceId,
          factLocators: ev.facts.map((f) => ({
            factId: f.factId,
            kind: f.sourceLocator.kind,
            locator:
              f.sourceLocator.kind === "PDF_PAGE"
                ? `page ${f.sourceLocator.page}`
                : `${f.sourceLocator.sheet}!${f.sourceLocator.cellRef}`,
          })),
        }
      : null;

  const decLineage = dec?.scenarios.flatMap((s) => s.diff.sourceLineage) ?? [];
  const decision =
    dec && dec.scenarios.length > 0
      ? {
          scenarioIds: dec.scenarios.map((s) => s.scenarioId),
          sourceLineage: dedupeLineage(decLineage),
        }
      : null;

  const research =
    res && res.insights.length > 0
      ? {
          researchIds: [...new Set(res.insights.map((i) => i.researchId))],
          sourceKinds: [...new Set(res.insights.map((i) => i.sourceKind))],
          publicationStatuses: [...new Set(res.insights.map((i) => i.publicationStatus))],
          snapshotHashes: [...new Set(res.insights.map((i) => i.snapshotHash))],
          locators: res.insights.flatMap((i) => i.citedPassages.map((p) => p.locator)),
        }
      : null;

  return {
    regulatory: reg && reg.sources.length > 0 ? reg.sources.map((s) => ({ ...s })) : null,
    evidence,
    decision,
    research,
    ai: ai.map((m) => ({ ...m })),
  };
}

function dedupeLineage<T extends { requirementId: string }>(xs: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of xs) {
    if (seen.has(x.requirementId)) continue;
    seen.add(x.requirementId);
    out.push(x);
  }
  return out;
}
