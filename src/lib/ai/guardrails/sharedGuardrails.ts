// =============================================================================
// Shared AI guardrails — enforced in CODE, not just prompt text (Phase 4).
//
// The deterministic Verification Engine is authoritative. AI output must NEVER
// set or mutate a regulatory-authority field. Any such attempt returns a
// controlled GUARDRAIL_REJECTED — the field is NEVER silently stripped and the
// call is NEVER allowed to continue as if valid.
// =============================================================================

import type { GuardrailContext } from "@/lib/ai/client/types";

/** Prepended to every AI system prompt. The code-level scan below is the real enforcement. */
export const SHARED_GUARDRAIL_SYSTEM_PROMPT = `
You are a support layer for Emtithal. The deterministic Verification Engine — not you — decides compliance.

You MUST NOT output, assert, set, or modify any of the following:
- a compliance status (COMPLIANT / PARTIALLY_COMPLIANT / NON_COMPLIANT / etc.) as a judgment
- an official weight, track weight, or any official assessment weight
- a penalty, fine, or sanction
- an internal criticality (CRITICAL / REQUIRED / ADVISORY) or "critical gate"
- a target population / target value / required population presented as regulatory truth
- an integration or connection state (e.g. "CONNECTED")
- a regulatory requirement or authority that is not in the approved corpus you were given

If you lack sufficient verified information, say so with INSUFFICIENT_DATA or
UNRESOLVED_REQUIREMENT and a short explanation. Never fabricate a plausible answer.
Respond with ONLY a single JSON object. No prose. No markdown fences.
`.trim();

const JSON_ONLY_INSTRUCTION =
  "Return ONLY one JSON object matching the required schema. No prose, no code fences.";

export function withSharedGuardrails(agentSystemPrompt: string): string {
  return `${SHARED_GUARDRAIL_SYSTEM_PROMPT}\n\n${agentSystemPrompt.trim()}\n\n${JSON_ONLY_INSTRUCTION}`;
}

// -----------------------------------------------------------------------------

export type GuardrailViolationKind =
  | "compliance_status_judgment"
  | "official_weight"
  | "penalty"
  | "internal_criticality"
  | "target_value_as_truth"
  | "integration_state"
  | "invented_requirement"
  | "invented_authority";

export interface GuardrailViolation {
  path: string;
  kind: GuardrailViolationKind;
  detail: string;
}

export type GuardrailScanResult =
  | { ok: true }
  | { ok: false; violations: GuardrailViolation[] };

const COMPLIANCE_STATUS_VALUES = new Set([
  "COMPLIANT",
  "PARTIALLY_COMPLIANT",
  "NON_COMPLIANT",
  "PENDING_VERIFICATION",
  "INSUFFICIENT_DATA",
  "NOT_APPLICABLE",
]);

const RX = {
  complianceStatusKey: /^(compliance[_-]?status|affected[_-]?statuses?|status)$/i,
  officialWeightKey: /(official[_-]?weight|track[_-]?weight[_-]?percent|within[_-]?track[_-]?weight[_-]?percent)/i,
  penaltyKey: /(penalt(y|ies)|fine|sanction)/i,
  criticalityKey: /(internal[_-]?criticality|critical[_-]?gate)/i,
  targetKey: /(target[_-]?(population|value|count)|required[_-]?population|official[_-]?target)/i,
  integrationKey: /(is[_-]?connected|integration[_-]?(state|status)|connection[_-]?state|connected)/i,
  requirementIdsKey: /^(requirement[_-]?ids?|affected[_-]?requirements?)$/i,
  authorityIdKey: /^(authority[_-]?id)$/i,
};

function normaliseId(v: unknown): string | null {
  return typeof v === "string" ? v.trim() : null;
}

/**
 * Deep-scans an already-parsed AI output object for forbidden regulatory-authority
 * content. Returns ALL violations found.
 */
export function scanForForbiddenContent(
  value: unknown,
  ctx: GuardrailContext = {},
): GuardrailScanResult {
  const violations: GuardrailViolation[] = [];
  const approvedReq = ctx.approvedRequirementIds ? new Set(ctx.approvedRequirementIds) : null;
  const approvedAuth = ctx.approvedAuthorityIds ? new Set(ctx.approvedAuthorityIds) : null;

  const visit = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((item, i) => visit(item, `${path}[${i}]`));
      return;
    }
    if (node === null || typeof node !== "object") return;

    for (const [key, raw] of Object.entries(node as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;

      if (RX.officialWeightKey.test(key)) {
        violations.push({ path: childPath, kind: "official_weight", detail: `AI may not set '${key}'.` });
      }
      if (RX.penaltyKey.test(key)) {
        violations.push({ path: childPath, kind: "penalty", detail: `AI may not set '${key}'.` });
      }
      if (RX.criticalityKey.test(key)) {
        violations.push({ path: childPath, kind: "internal_criticality", detail: `AI may not set '${key}'.` });
      }
      if (RX.complianceStatusKey.test(key)) {
        const hits = collectStrings(raw).filter((s) => COMPLIANCE_STATUS_VALUES.has(s.toUpperCase()));
        if (hits.length > 0) {
          violations.push({
            path: childPath,
            kind: "compliance_status_judgment",
            detail: `AI may not assert a compliance status (${hits.join(", ")}).`,
          });
        }
      }
      if (RX.targetKey.test(key) && typeof raw === "number") {
        violations.push({
          path: childPath,
          kind: "target_value_as_truth",
          detail: `AI may not assert a numeric target ('${key}': ${raw}).`,
        });
      }
      if (RX.integrationKey.test(key)) {
        const truthy =
          raw === true ||
          (typeof raw === "string" && raw.trim().toUpperCase() === "CONNECTED");
        if (truthy) {
          violations.push({
            path: childPath,
            kind: "integration_state",
            detail: `AI may not assert an integration/connection state ('${key}').`,
          });
        }
      }
      if (approvedReq && RX.requirementIdsKey.test(key)) {
        for (const id of collectStrings(raw)) {
          if (id && !approvedReq.has(id)) {
            violations.push({
              path: childPath,
              kind: "invented_requirement",
              detail: `Requirement '${id}' is not in the approved corpus.`,
            });
          }
        }
      }
      if (approvedAuth && RX.authorityIdKey.test(key)) {
        const id = normaliseId(raw);
        if (id && !approvedAuth.has(id)) {
          violations.push({
            path: childPath,
            kind: "invented_authority",
            detail: `Authority '${id}' is not in the approved corpus.`,
          });
        }
      }

      visit(raw, childPath);
    }
  };

  visit(value, "");
  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}

function collectStrings(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(collectStrings);
  if (node && typeof node === "object") return Object.values(node).flatMap(collectStrings);
  return [];
}

/** Lighter scan for free-text output — flags forbidden JSON-ish field assertions. */
export function scanTextForForbiddenContent(text: string): GuardrailScanResult {
  const violations: GuardrailViolation[] = [];
  const checks: [RegExp, GuardrailViolationKind, string][] = [
    [/"?official[_-]?weight"?\s*[:=]/i, "official_weight", "text asserts an official weight"],
    [/"?internal[_-]?criticality"?\s*[:=]/i, "internal_criticality", "text asserts internal criticality"],
    [/"?penalty"?\s*[:=]|"?fine"?\s*[:=]/i, "penalty", "text asserts a penalty/fine"],
    [/"?(compliance[_-]?status|affected[_-]?statuses)"?\s*[:=]/i, "compliance_status_judgment", "text asserts a compliance status"],
    [/"?(is[_-]?connected|integration[_-]?state)"?\s*[:=]\s*("?CONNECTED"?|true)/i, "integration_state", "text asserts an integration state"],
  ];
  for (const [rx, kind, detail] of checks) {
    if (rx.test(text)) violations.push({ path: "(text)", kind, detail });
  }
  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}
