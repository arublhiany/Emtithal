// =============================================================================
// AI agent output shapes — Finalist (Phase 1, types only).
//
// Shape only. No agent, prompt, schema, or client is implemented here — those
// land in Phases 4–9. Fields follow AI_AGENTS_ARCHITECTURE_v1.md.
// =============================================================================

import type { Mode } from "@/lib/mode";
import type { ComplianceStatus } from "./compliance";

export { MODE } from "@/lib/mode";
export type { Mode } from "@/lib/mode";

/** AI confidence (AI arch §24). Uppercase — distinct from the legacy lowercase `ConfidenceLevel`. */
export type AIConfidence = "HIGH" | "MEDIUM" | "LOW";

/** UI-facing lifecycle of an AI result (AI arch §46). */
export type AgentResultState = "ANALYZING" | "COMPLETED" | "FAILED" | "NEEDS_REVIEW";

/** Controlled failure codes (AI arch §47). */
export type AgentFailureCode =
  | "AI_UNAVAILABLE"
  | "SOURCE_NOT_FOUND"
  | "INSUFFICIENT_DATA"
  | "SCHEMA_VALIDATION_FAILED"
  | "UNRESOLVED_REQUIREMENT"
  | "HUMAN_REVIEW_REQUIRED";

/** Common explainability envelope carried by every agent result (AI arch §16, §23). */
export interface AgentResult<TData> {
  data: TData | null;
  mode: Mode;
  state: AgentResultState;
  failureCode: AgentFailureCode | null;
  reason: string;
  requirementsUsed: string[];
  dataUsed: string[];
  assumptions: string[];
  sources: string[];
  confidence: AIConfidence;
  unresolved: string[];
  humanReviewRequired: boolean;
  resultVersion: number;
}

// --- Regulatory Intelligence Agent (AI arch §5) ------------------------------
export interface RegulatoryAgentOutput {
  requirementIds: string[];
  authorityId: string | null;
  reason: string;
  sources: string[];
  confidence: AIConfidence;
  unresolved: string[];
}

/**
 * Whether an approved regulatory record backs the answer, and if so whether it
 * is verified truth (Phase 5). `OUT_OF_CORPUS` = the question is not supported by
 * the approved closed-world corpus — no regulation is generated for it.
 */
export type RegulatoryState = "SPECIFIED" | "UNRESOLVED_REQUIREMENT" | "OUT_OF_CORPUS";

/**
 * Raw structured output of the Regulatory Intelligence Agent's LLM call
 * (Phase 5). NON-AUTHORITATIVE interpretation only — the orchestrator derives
 * everything authoritative deterministically and never trusts these fields as
 * truth. There is deliberately no `confidence` field: the canonical confidence
 * is set by code from retrieval / regulatory-state / source-lineage conditions,
 * and the model must not be able to move it.
 */
export interface RegulatoryAgentAnswer {
  answerAr: string;
  requirementIds: string[];
  authorityId: string | null;
  /** Additive only — never replaces the deterministic engine's missing fields. */
  missingInformation: string[];
  /** Explanatory detail under the deterministic canonical applicability statement. */
  applicabilityExplanationAr: string | null;
}

// --- Evidence Intelligence Agent (AI arch §6) -------------------------------
export interface EvidenceFact {
  field: string;
  value: string | number;
  evidenceReference: string;
  confidence: AIConfidence;
}

export interface EvidenceAgentOutput {
  facts: EvidenceFact[];
  missingFields: string[];
  contradictions: string[];
  confidence: AIConfidence;
}

// --- Evidence Intelligence Agent — Phase 6 analysis (interpretation only) ----
//
// NON-AUTHORITATIVE. The model maps already-extracted facts to an approved
// candidate requirement set. It never sets a compliance status / weight /
// target / penalty, never invents a requirement, never marks anything verified.

export interface EvidenceRequirementMapping {
  requirementId: string;
  evidenceFactIds: string[];
  appearsToSupportAr: string;
  stillMissingAr: string[];
  relatedVerificationTargetAr: string | null;
  interpretationConfidence: AIConfidence;
}

export interface EvidenceConflict {
  factIdA: string;
  factIdB: string;
  descriptionAr: string;
}

export interface EvidenceAgentAnalysis {
  summaryAr: string;
  mappings: EvidenceRequirementMapping[];
  conflicts: EvidenceConflict[];
  unmappedFactIds: string[];
  needsHumanReview: boolean;
}

// --- Decision Intelligence Agent (AI arch §8–§15) --------------------------
export interface DecisionObject {
  decisionType: string;
  action: string;
  value: number | null;
  unit: string | null;
  domain: string;
  confidence: AIConfidence;
}

export interface Scenario {
  scenarioId: string;
  titleAr: string;
  descriptionAr: string;
  changes: string[];
  assumptions: string[];
  affectedRequirements: string[];
  operationalEffects: string[];
  regulatoryEffects: string[];
  researchInsights: string[];
  confidence: AIConfidence;
  dataUsed: string[];
  sources: string[];
  unresolved: string[];
}

export interface ScenarioComparisonResult {
  decision: DecisionObject;
  currentReadiness: number | null;
  scenarios: Scenario[];
  recommendedScenarioId: string | null;
  affectedStatuses: Record<string, ComplianceStatus>;
}

// --- Decision Intelligence Agent — Phase 7 (interpretation + recommendation) --
//
// NON-AUTHORITATIVE. The model turns natural language into requested operational
// changes and, given ALREADY-COMPUTED deterministic scenarios, explains and
// recommends among them. It never computes compliance / readiness / coverage /
// a status, never invents a requirement / weight / penalty / integration, never
// resolves an UNRESOLVED_REQUIREMENT.

export interface DecisionRequestedChange {
  /** Canonical company-profile field path — post-validated against the closed catalog. */
  fieldPath: string;
  toValue: string;
  intentAr: string;
}

/** A user-stated "keep/same" value — a constraint, never a change or an assumption. */
export interface DecisionConstraint {
  fieldPath: string;
  expectedValue: string;
  intentAr: string;
}

export interface DecisionInterpretation {
  decisionTitleAr: string;
  decisionSummaryAr: string;
  requestedChanges: DecisionRequestedChange[];
  constraints: DecisionConstraint[];
  assumptionsAr: string[];
  ambiguitiesAr: string[];
  missingInfoAr: string[];
  interpretationConfidence: AIConfidence;
  needsHumanReview: boolean;
}

export interface DecisionScenarioExplanation {
  scenarioId: string;
  whyChangedAr: string;
}

export interface DecisionRecommendation {
  /** Post-validated against the computed scenario IDs, or null. */
  recommendedScenarioId: string | null;
  recommendationAr: string;
  tradeoffsAr: string[];
  assumptionsAr: string[];
  scenarioExplanations: DecisionScenarioExplanation[];
  needsHumanReview: boolean;
}

// --- Research Knowledge Agent (AI arch §17–§21) ---------------------------
export type ResearchCorpusState = "CORPUS_PENDING" | "CORPUS_LOADED";

export interface ResearchStudy {
  title: string;
  year: string;
  source: string;
  summary: string;
  operationalInsight: string;
}

export interface ResearchQueryResult {
  corpusState: ResearchCorpusState;
  query: string;
  studies: ResearchStudy[];
  confidence: AIConfidence;
}
