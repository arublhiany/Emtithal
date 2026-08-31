// =============================================================================
// Shared AI guardrails — enforced in CODE, not just prompt text (Phase 4).
//
// The deterministic Verification Engine is authoritative. AI output must NEVER
// set or mutate a regulatory-authority field. Any such attempt returns a
// controlled GUARDRAIL_REJECTED — the field is NEVER silently stripped and the
// call is NEVER allowed to continue as if valid.
// =============================================================================

import type { AIResponseFormat, GuardrailContext } from "@/lib/ai/client/types";

/**
 * Prepended to every AI system prompt (structured or text). The code-level scan
 * below is the real enforcement; this text is defence-in-depth. It carries NO
 * output-format instruction — that is appended per call by `withSharedGuardrails`.
 */
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
`.trim();

const JSON_ONLY_INSTRUCTION =
  "Return ONLY one JSON object matching the required schema. No prose, no markdown fences.";

const TEXT_ONLY_INSTRUCTION =
  "Answer in plain text. Do not wrap your answer in JSON or markdown code fences.";

/**
 * Wraps an agent's system prompt with the shared guardrail rules plus the
 * output-format instruction for this call. `"json"` for `generateStructured`,
 * `"text"` for `generateText`.
 */
export function withSharedGuardrails(
  agentSystemPrompt: string,
  format: AIResponseFormat,
): string {
  const instruction = format === "json" ? JSON_ONLY_INSTRUCTION : TEXT_ONLY_INSTRUCTION;
  return `${SHARED_GUARDRAIL_SYSTEM_PROMPT}\n\n${agentSystemPrompt.trim()}\n\n${instruction}`;
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

// -----------------------------------------------------------------------------
// Compliance-verdict prose guard (Phase 6). Evidence interpretation may say the
// evidence *appears* relevant / *appears to document* something, or that it is
// *not enough alone* to judge compliance. It may NOT state an affirmative (or
// negative) compliance / satisfaction / verification verdict in free text — the
// deterministic verification engine owns that. Runs AFTER generation on the
// user-facing prose fields.
// -----------------------------------------------------------------------------

/** Normalise for verdict matching: strip Arabic diacritics/tatweel, fold alef/ya/ta-marbuta, lowercase. */
function normaliseVerdictText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا") // أ إ آ ٱ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compliance-verdict phrases — BOTH affirmative and negative. Evidence
 * interpretation must not state a compliance / satisfaction / verification
 * outcome either way. Arabic patterns match `normaliseVerdictText` output;
 * English patterns match raw + normalised. Phrases that merely mention
 * "الامتثال" / "compliance" in an uncertainty context are NOT listed here.
 */
const COMPLIANCE_VERDICT_RX: RegExp[] = [
  // --- Arabic — affirmative ---
  /(يثبت|تثبت|يؤكد|تؤكد|اثبت|يبرهن)\s+(علي\s+)?(ال)?امتثال/,
  /(يثبت|تثبت)\s+استيفاء/,
  /(ال)?امتثال\s+(مؤكد|محقق|ثابت|مثبت|مستوف|قائم|منجز|تام)/,
  /(تحقق|تم\s+تحقيق|جري\s+تحقيق)\s+(ال)?امتثال/,
  /المتطلب\s+(متحقق|محقق|مستوف|مستوفي|مكتمل|مطابق|منجز|تام|مستوفى)/,
  /(تم|جري)\s+استيفاء\s+المتطلب/,
  /(يستوفي|تستوفي|يحقق|تحقق|يلبي|تلبي)\s+المتطلب/,
  /(الشركه|المنشاه|الجهه|المتعهد)\s+(ملتزم|ملتزمه|ممتثل|ممتثله|مستوف|مستوفيه|مطابق|مطابقه|محقق|محققه)/,
  /(ملتزم|ملتزمه|ممتثل|ممتثله)\s+(بالمتطلب|بالمتطلبات|بالاشتراط|بالمعيار)/,
  /دليل\s+(علي\s+)?(ال)?امتثال/,
  /الدليل\s+يثبت/,
  // --- Arabic — negative ---
  /عدم\s+(ال)?امتثال/, // عدم امتثال / عدم الامتثال / يوجد عدم امتثال / يثبت عدم الامتثال
  /غير\s+(ملتزم|ملتزمه|ممتثل|ممتثله|متحقق|محقق|مستوف|مستوفي|مستوفاه|مطابق|منجز|مكتمل)/,
  /لم\s+(تستوف|يستوف|يتحقق|تتحقق|يكتمل|تكتمل|ينجز|تنجز|يطابق|يمتثل|تمتثل)/,
  /المتطلب\s+(لم\s+يتحقق|غير\s+متحقق|غير\s+مستوف)/,
  // --- English — affirmative ---
  /\b(is|are|now|fully|clearly)\s+compliant\b/i,
  /\bthe\s+(company|entity|provider)\s+is\s+compliant\b/i,
  /\b(proves?|prove|proven|demonstrates?|confirms?|establishes?)\s+(full\s+)?compliance\b/i,
  /\bcompliance\s+(is|has\s+been)\s+(confirmed|proven|established|met|achieved|demonstrated)\b/i,
  /\b(the\s+)?requirement\s+is\s+(satisfied|met|fulfilled|complete|compliant)\b/i,
  /\b(meets|satisfies|fulfil?ls?)\s+the\s+requirement\b/i,
  /\bverified\s+compliant\b/i,
  /\bevidence\s+of\s+compliance\b/i,
  // --- English — negative ---
  /\bnon-?complian(t|ce)\b/i, // non-compliant / non-compliance / proves non-compliance / evidence of non-compliance
  /\b(is|are)\s+not\s+compliant\b/i,
  /\b(the\s+)?requirement\s+(is|was)\s+not\s+(met|satisfied|fulfilled|complete)\b/i,
  /\b(the\s+)?requirement\s+has\s+not\s+been\s+(met|satisfied|fulfilled|complete[d]?)\b/i,
  /\bfails?\s+to\s+(meet|satisfy|fulfil?l)\s+the\s+requirement\b/i,
];

export interface ComplianceVerdictScan {
  ok: boolean;
  /** Field paths where a verdict was found — never the offending text itself. */
  fields: string[];
}

/**
 * Scans named free-text fields for a compliance / satisfaction / verification
 * verdict. Returns the offending FIELD PATHS only — callers must not surface the
 * text.
 */
export function scanEvidenceProseForVerdict(
  entries: { path: string; text: string }[],
): ComplianceVerdictScan {
  const fields: string[] = [];
  for (const { path, text } of entries) {
    if (!text) continue;
    const norm = normaliseVerdictText(text);
    if (COMPLIANCE_VERDICT_RX.some((rx) => rx.test(norm) || rx.test(text))) fields.push(path);
  }
  return fields.length === 0 ? { ok: true, fields: [] } : { ok: false, fields };
}

// -----------------------------------------------------------------------------
// Regulation / research firewall (Phase 8). Research prose is DECISION SUPPORT
// only — it must never assert a regulatory obligation, an official weight, a
// penalty, a government requirement, or a compliance verdict AS ITS OWN CLAIM.
// A NEGATED disclaimer ("لا يمثل ذلك متطلبًا تنظيميًا", "this is not a
// requirement") is allowed and does NOT count as a violation.
// -----------------------------------------------------------------------------

const REGULATORY_CLAIM_RX: RegExp[] = [
  /(هذا|هذه|ذلك|تلك)\s+متطلب(\s+رسمي|\s+تنظيمي)?/, // "هذا متطلب رسمي/تنظيمي"
  /(وزاره\s+الحج|الوزاره|الجهه\s+التنظيميه)\s+(تشترط|تفرض|تلزم|توجب|تطالب)/,
  /(يجب|يلزم|يُشترط|يُفرض)\s+رسميًا/,
  /(الوزن\s+الرسمي|وزن\s+رسمي|official\s+weight)/,
  /(الغرامه|غرامه\s+ماليه|penalty|fine|sanction)/,
  /(متطلب\s+رسمي|اشتراط\s+رسمي|official\s+requirement|regulatory\s+requirement)/,
  /(the\s+ministry|ministry\s+of\s+hajj)\s+(requires|mandates|obliges|stipulates)/i,
  /(this|it)\s+(is|constitutes|represents)\s+(an?\s+)?(official|regulatory)\s+requirement/i,
];

const REGULATORY_CLAIM_NEGATION_RX =
  /(لا\s+يمثل|لا\s+يعد|لا\s+يُعد|ليس\s+متطلب|لا\s+يشكل|ليست\s+اشتراط|ليس\s+اشتراط|not\s+a\s+([a-z]+\s+)?requirement|does\s+not\s+(constitute|represent|imply|create)\s+a[n]?\s+([a-z]+\s+)?requirement|is\s+not\s+a[n]?\s+([a-z]+\s+)?requirement)/i;

export interface RegulatoryClaimScan {
  ok: boolean;
  fields: string[];
}

/**
 * Scans research prose for an assertion of regulatory truth. A field whose text
 * only *denies* making such a claim is not flagged. Returns FIELD PATHS only.
 */
export function scanResearchProseForRegulatoryClaim(
  entries: { path: string; text: string }[],
): RegulatoryClaimScan {
  const fields: string[] = [];
  for (const { path, text } of entries) {
    if (!text) continue;
    const norm = normaliseVerdictText(text);
    const asserts = REGULATORY_CLAIM_RX.some((rx) => rx.test(norm) || rx.test(text));
    if (!asserts) continue;
    const denies = REGULATORY_CLAIM_NEGATION_RX.test(norm) || REGULATORY_CLAIM_NEGATION_RX.test(text);
    if (!denies) fields.push(path);
  }
  return fields.length === 0 ? { ok: true, fields: [] } : { ok: false, fields };
}
