// =============================================================================
// Emtithal AI Orchestrator — types (Phase 9). Server-side only.
//
// The Orchestrator COORDINATES the already-approved capabilities. It is NOT a
// new source of regulatory truth and creates no authority beyond its child
// layers. Authority order (locked):
//   1. Canonical regulatory model / Regulatory Matrix
//   2. Deterministic applicability engine
//   3. Deterministic verification / readiness engine
//   4. Canonical company / evidence data
//   5. AI interpretation layers (regulatory / evidence / decision)
//   6. Research decision-support layer
// AI never overrides deterministic truth; research never overrides regulation;
// evidence interpretation never marks evidence verified.
// =============================================================================

import type { AICallMeta } from "@/lib/ai/client/types";
import type { ComplianceStatus } from "@/lib/model";
import type { AggregateMetric } from "@/lib/engine/verificationEngine";
import type {
  RegulatoryAgentResult,
  SourceLineage,
  DeterministicApplicabilityView,
} from "@/lib/ai/agents/regulatoryAgent";
import type { EvidenceAgentResult } from "@/lib/ai/agents/evidenceAgent";
import type { DecisionSimulationOutput } from "@/lib/ai/agents/decisionAgent";
import type { ResearchAgentResult, ResearchInsightView } from "@/lib/ai/agents/researchAgent";
import type { RequirementLineage } from "@/lib/engine/decisionScenarioEngine";

// -- intent & capabilities -----------------------------------------------------

export type OrchestratorIntent =
  | "REGULATORY_INTELLIGENCE"
  | "EVIDENCE_INTELLIGENCE"
  | "DECISION_INTELLIGENCE"
  | "RESEARCH_INTELLIGENCE"
  | "COMBINED_ANALYSIS"
  | "UNSUPPORTED";

/** A concrete capability the Orchestrator may invoke. Deterministic ones never call an LLM. */
export type OrchestratorCapability =
  | "DETERMINISTIC_APPLICABILITY"
  | "DETERMINISTIC_VERIFICATION"
  | "REGULATORY_INTELLIGENCE"
  | "EVIDENCE_INTELLIGENCE"
  | "DECISION_INTELLIGENCE"
  | "RESEARCH_INTELLIGENCE";

/** Per-capability outcome — one agent failing never destroys the others. */
export type CapabilityStatus =
  | "SUCCESS" // ran and produced a valid result
  | "NOT_REQUIRED" // the routed intent did not need it
  | "NO_RELEVANT_DATA" // ran deterministic retrieval; nothing approved matched (no LLM, no fabrication)
  | "UNAVAILABLE" // AI provider unavailable / provider error
  | "FAILED_SAFE"; // controlled failure (schema / guardrail); deterministic outputs preserved

export interface CapabilityStatusEntry {
  capability: OrchestratorCapability;
  status: CapabilityStatus;
  /** Non-secret detail (a child failureCode, a retrieval outcome, …). Never raw model text. */
  detail: string | null;
  /** Safe AI metadata when this capability made an LLM call; `null` for deterministic ones / no call. */
  meta: AICallMeta | null;
}

// -- routing -----------------------------------------------------------------

export interface RoutingDecision {
  intent: OrchestratorIntent;
  /** Capabilities to run, already in locked execution order. */
  capabilities: OrchestratorCapability[];
  /** Deterministic signal tokens/phrases that fired — pure explainability, no LLM. */
  matchedSignals: { capability: OrchestratorCapability; signals: string[] }[];
  /** Whether routing was rule-based (always true in Phase 9) or forced by the caller. */
  method: "DETERMINISTIC_RULES" | "CALLER_FORCED";
  reasonAr: string;
}

// -- deterministic result views (read-only copies — never engine internals) ---

export interface DeterministicVerificationView {
  readiness: AggregateMetric;
  coverage: AggregateMetric;
  criticalBlockerIds: string[];
  verificationGapIds: string[];
  pendingVerificationIds: string[];
  regulatoryPendingIds: string[];
  applicabilityPendingIds: string[];
  statusCounts: Record<ComplianceStatus, number>;
  /** Enforced invariant — the Orchestrator never computes an Official Score. */
  officialScoreComputed: false;
}

export interface OrchestratorDeterministicResults {
  /** Present when a regulatory requirement was in scope and a company profile was supplied. */
  applicability: DeterministicApplicabilityView | null;
  /** Present for regulatory / decision / combined intents. A read-only snapshot. */
  verification: DeterministicVerificationView | null;
  /** Present only when a decision / what-if was requested. Phase 7 deterministic engine output. */
  scenario: DecisionSimulationOutput | null;
}

// -- flattened, provenance-tagged insight surfaces --------------------------

export type OrchestratorInsightKind =
  | "REGULATORY_INTERPRETATION"
  | "EVIDENCE_INTERPRETATION"
  | "DECISION_RECOMMENDATION"
  | "RESEARCH_SUPPORT";

export interface OrchestratorInsight {
  kind: OrchestratorInsightKind;
  capability: OrchestratorCapability;
  /** Verbatim from the child layer's already-guardrailed field. Never re-synthesised. */
  textAr: string;
  /** e.g. requirementId(s) / evidenceId / scenarioId(s) / researchId(s). */
  refs: string[];
  needsHumanReview: boolean;
}

// -- provenance ------------------------------------------------------------

export interface OrchestratorProvenance {
  /** Canonical requirement lineage — from `RegulatoryAgentResult.sources`, never the LLM. */
  regulatory: SourceLineage[] | null;
  /** Deterministic extraction locators — from the evidence agent's echoed facts. */
  evidence:
    | {
        evidenceId: string;
        factLocators: { factId: string; kind: "PDF_PAGE" | "XLSX_CELL"; locator: string }[];
      }
    | null;
  /** Deterministic scenario lineage — from the Phase 7 engine's `ScenarioDiff.sourceLineage`. */
  decision: { scenarioIds: string[]; sourceLineage: RequirementLineage[] } | null;
  /** Canonical research provenance — from the approved corpus, reattached by the research agent's code. */
  research:
    | {
        researchIds: string[];
        sourceKinds: ResearchInsightView["sourceKind"][];
        publicationStatuses: ResearchInsightView["publicationStatus"][];
        snapshotHashes: (string | null)[];
        locators: ResearchInsightView["citedPassages"][number]["locator"][];
      }
    | null;
  /** Safe AI call metadata only. No prompts, no raw content. */
  ai: AICallMeta[];
}

// -- request / options / result ------------------------------------------

export type OrchestratorFailureCode =
  | "UNSUPPORTED_REQUEST" // routing found no approved capability
  | "NO_CAPABILITY_PRODUCED_OUTPUT"; // every required capability failed safe / was unavailable

export interface OrchestratorMeta {
  requestId: string;
  aiCallsMade: number;
  llmMetas: AICallMeta[];
  /** Wall-clock for the whole orchestration. */
  durationMs: number;
}

export interface OrchestratorResult {
  requestId: string;
  intent: OrchestratorIntent;
  routing: RoutingDecision;
  capabilitiesUsed: CapabilityStatusEntry[];
  deterministicResults: OrchestratorDeterministicResults;
  aiInsights: OrchestratorInsight[];
  researchInsights: OrchestratorInsight[];
  evidenceInsights: OrchestratorInsight[];
  decisionResults: DecisionSimulationOutput | null;
  /** Full child results — kept so callers can read child-level provenance / detail. */
  regulatoryResult: RegulatoryAgentResult | null;
  evidenceResult: EvidenceAgentResult | null;
  researchResult: ResearchAgentResult | null;
  warnings: string[];
  /** Deterministic aggregation — never a free-form model decision. */
  needsHumanReview: boolean;
  needsHumanReviewReasons: string[];
  provenance: OrchestratorProvenance;
  failureCode: OrchestratorFailureCode | null;
  meta: OrchestratorMeta;
}
