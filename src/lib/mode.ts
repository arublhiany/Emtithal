// =============================================================================
// Execution mode + data provenance markers — Finalist scaffolding (Phase 0).
//
// Introduced ahead of the real AI layer (Phase 4+) and the demo-dataset work
// (Phase 12) so every later module imports one stable definition instead of
// redeclaring string unions. Nothing imports these yet — adding this file
// changes no product behaviour.
//
//   MODE         — how a given result was produced.
//   DATA_SOURCE  — whether the data behind a view is the fixed demo dataset or
//                  real / connected data. DEMO_DATA must never be presented as
//                  live government data.
// =============================================================================

export const MODE = {
  /** Result produced by a real LLM call through the AI service layer. */
  REAL_AI: "REAL_AI",
  /** Result produced by the deterministic fallback path (no LLM available). */
  DETERMINISTIC_FALLBACK: "DETERMINISTIC_FALLBACK",
  /** Result served from the fixed demonstration dataset. */
  DEMO_DATA: "DEMO_DATA",
} as const;

export type Mode = (typeof MODE)[keyof typeof MODE];

export const DATA_SOURCE = {
  /** Fixed, fictional demonstration dataset. */
  DEMO_DATA: "DEMO_DATA",
  /** Real or connected data. */
  REAL_DATA: "REAL_DATA",
} as const;

export type DataSource = (typeof DATA_SOURCE)[keyof typeof DATA_SOURCE];
