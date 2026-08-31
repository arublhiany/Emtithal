// =============================================================================
// AI provider configuration — server-side ONLY (Phase 4).
//
// Reads exactly three env vars: AI_PROVIDER, AI_PROVIDER_API_KEY, AI_MODEL.
// Never a NEXT_PUBLIC_* var, never a hardcoded model id, and NO provider-specific
// secret names. When the provider is missing/unknown or a value is missing the
// client returns a controlled AI_UNAVAILABLE — it does not throw.
// =============================================================================

export type AIProvider = "anthropic" | "gemini";
export const KNOWN_AI_PROVIDERS: readonly AIProvider[] = ["anthropic", "gemini"];

export interface AIConfigPresent {
  present: true;
  provider: AIProvider;
  apiKey: string;
  model: string;
}
export interface AIConfigMissing {
  present: false;
  /** Which required var(s) were absent — non-secret, safe to log. */
  missing: ("AI_PROVIDER" | "AI_PROVIDER_API_KEY" | "AI_MODEL")[];
  /** Set when AI_PROVIDER holds a value that is not a known provider. */
  unknownProvider: string | null;
}
export type AIConfig = AIConfigPresent | AIConfigMissing;

type EnvLike = Record<string, string | undefined>;

/** Reads the AI config from `process.env`. Pure; no side effects. */
export function readAIConfig(env: EnvLike = process.env): AIConfig {
  const providerRaw = env.AI_PROVIDER?.trim();
  const apiKey = env.AI_PROVIDER_API_KEY?.trim();
  const model = env.AI_MODEL?.trim();

  const missing: AIConfigMissing["missing"] = [];
  if (!providerRaw) missing.push("AI_PROVIDER");
  if (!apiKey) missing.push("AI_PROVIDER_API_KEY");
  if (!model) missing.push("AI_MODEL");

  const isKnown =
    providerRaw != null && (KNOWN_AI_PROVIDERS as readonly string[]).includes(providerRaw);
  const unknownProvider = providerRaw && !isKnown ? providerRaw : null;

  if (missing.length > 0 || unknownProvider) {
    return { present: false, missing, unknownProvider };
  }
  return {
    present: true,
    provider: providerRaw as AIProvider,
    apiKey: apiKey as string,
    model: model as string,
  };
}
