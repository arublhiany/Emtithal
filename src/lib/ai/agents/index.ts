// =============================================================================
// AI agents — server-side entrypoints (Phase 5+).
//
// Do NOT import from a client component: these pull in the server-only AI client.
// =============================================================================

export {
  answerRegulatoryQuestion,
  explainRequirement,
  explainApplicability,
} from "./regulatoryAgent";
export type {
  RegulatoryAgentResult,
  RegulatoryAgentOptions,
  RegulatoryAgentFailureCode,
  SourceLineage,
  DeterministicApplicabilityView,
} from "./regulatoryAgent";
export {
  retrieveCandidates,
  normalizeText,
  meaningfulTokens,
  CORPUS_SEASON,
} from "./regulatoryRetrieval";
export type {
  RegulatoryRetrievalQuery,
  RetrievalResult,
  RetrievalKind,
} from "./regulatoryRetrieval";
export { interpretDecision, simulateDecisionScenarios } from "./decisionAgent";
export type {
  DecisionAgentInput,
  DecisionAgentOptions,
  DecisionAgentFailureCode,
  DecisionInterpretationView,
  DecisionScenarioView,
  DecisionRecommendationView,
  DecisionSimulationOutput,
  ScenarioProvenance,
} from "./decisionAgent";
export { answerResearchQuestion, getResearchInsightsForDecision } from "./researchAgent";
export type {
  AnswerResearchQuestionInput,
  ResearchAgentOptions,
  ResearchAgentResult,
  ResearchAgentFailureCode,
  ResearchInsightView,
  ResearchCitedPassage,
} from "./researchAgent";
export { analyzeEvidence, mapEvidenceToRequirements } from "./evidenceAgent";
export type {
  EvidenceAgentInput,
  EvidenceAgentOptions,
  EvidenceAgentResult,
  EvidenceAgentFailureCode,
  EvidenceRetrievalOutcome,
  EvidenceAnalysisState,
  EvidenceRequirementMappingView,
  EvidenceConflictView,
} from "./evidenceAgent";
