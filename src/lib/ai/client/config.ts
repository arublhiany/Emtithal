// =============================================================================
// AI provider configuration — server-side ONLY (Phase 4).
//
// Reads exactly two env vars: AI_PROVIDER_API_KEY and AI_MODEL. Never a
// NEXT_PUBLIC_* var, never a hardcoded model id. When either is missing the
// client returns a controlled AI_UNAVAILABLE — it does not throw.
// =============================================================================

export interface AIConfigPresent {
  present: true;
  apiKey: string;
  model: string;
}
export interface AIConfigMissing {
  present: false;
  /** Which required var(s) were missing — non-secret, safe to log. */
  missing: ("AI_PROVIDER_API_KEY" | "AI_MODEL")[];
}
export type AIConfig = AIConfigPresent | AIConfigMissing;

type EnvLike = Record<string, string | undefined>;

/** Reads the AI config from `process.env`. Pure; no side effects. */
export function readAIConfig(env: EnvLike = process.env): AIConfig {
  const apiKey = env.AI_PROVIDER_API_KEY?.trim();
  const model = env.AI_MODEL?.trim();

  const missing: ("AI_PROVIDER_API_KEY" | "AI_MODEL")[] = [];
  if (!apiKey) missing.push("AI_PROVIDER_API_KEY");
  if (!model) missing.push("AI_MODEL");

  if (missing.length > 0) return { present: false, missing };
  return { present: true, apiKey: apiKey as string, model: model as string };
}
