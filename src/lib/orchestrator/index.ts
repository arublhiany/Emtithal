// =============================================================================
// Emtithal AI Orchestrator — server-side entrypoint (Phase 9).
//
// Do NOT import from a client component: this pulls in the server-only AI agents.
// =============================================================================

export { runOrchestration } from "./orchestrator";
export type { OrchestratorRequest, OrchestratorOptions } from "./orchestrator";
export { classifyIntent, routingForForcedIntent } from "./routing";
export type {
  OrchestratorIntent,
  OrchestratorCapability,
  CapabilityStatus,
  CapabilityStatusEntry,
  RoutingDecision,
  DeterministicVerificationView,
  OrchestratorDeterministicResults,
  OrchestratorInsight,
  OrchestratorInsightKind,
  OrchestratorProvenance,
  OrchestratorFailureCode,
  OrchestratorMeta,
  OrchestratorResult,
} from "./types";
