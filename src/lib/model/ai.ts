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
