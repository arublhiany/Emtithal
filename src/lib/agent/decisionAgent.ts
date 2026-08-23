// =============================================================================
// Decision Intelligence Agent — V1 (وكيل ذكاء القرار)
//
// IMPORTANT: this is a DETERMINISTIC interpretation/retrieval layer, not an
// LLM-backed agent. There is no model call, no API key, and no network
// dependency here — every decision is a plain, documented, reproducible rule
// evaluated in-process. It is named and structured as an "agent" because it
// occupies that architectural position (MASTER_SPEC's AI Intelligence Layer,
// sitting between the raw decision input and the deterministic Compliance/
// Decision Engine), not because it wraps a generative model.
//
// Responsibility: read a proposed operational decision and the company's
// current requirements, and identify which requirements have a defensible
// relationship to it — with a confidence level and a stated source rule for
// each. It never computes a score, a delta, or a risk level; that stays the
// exclusive job of the deterministic engine in lib/engine/decisionEngine.ts,
// which is the sole source of truth for all numeric compliance output.
//
// Grounding guardrail: this module only ever iterates over the `Requirement[]`
// it is given (the five real criteria already in the repository, sourced
// from lib/data/requirements.ts / MVP_REQUIREMENTS.md). There is no code path
// that can reference or fabricate a requirement ID that isn't already in
// that array — the agent cannot invent a regulation or requirement.
//
// -----------------------------------------------------------------------------
// Two signals per (decision, requirement) pair (moved here unchanged from
// the previous version of decisionEngine.ts — same logic, same thresholds):
//
//   1. CATEGORY_PRIOR — a 0-1 plausibility score for how strongly a decision
//      *category* typically relates to a requirement. Deliberately modest:
//      no category has more than one requirement at the "high tier" (>=0.7).
//      DEMO CONFIGURATION — not an official regulatory weighting.
//
//   2. REQUIREMENT_KEYWORDS — a short list of Arabic topic-anchor terms per
//      requirement, drawn directly from that requirement's own Purpose /
//      Expected Evidence text in MVP_REQUIREMENTS.md (cited per requirement
//      below). This is topic-matching against text already in the repo, not
//      an invented regulation.
//
// Inclusion rule (documented, deterministic):
//   - keyword match AND category prior > 0  -> included, High confidence, counted in score
//   - keyword match, no/low category prior  -> included, Medium confidence, counted in score
//   - category prior >= HIGH_TIER_PRIOR, no keyword match
//                                            -> included, Low confidence, "uncertain",
//                                               shown for transparency but NOT counted in score
//   - otherwise                             -> not returned at all
//
// If there isn't enough evidence for a requirement to clear either bar, this
// module simply omits it rather than guessing — the caller (decisionEngine)
// treats "no mapping returned" as "no impact," never as a silent zero.
// =============================================================================

import type { ConfidenceLevel, DecisionCategory, DecisionInput, Requirement } from "@/lib/types";

const HIGH_TIER_PRIOR = 0.7; // minimum category-only prior that can surface an "uncertain" (uncounted) link
const KEYWORD_ONLY_SENSITIVITY = 0.45; // sensitivity used when only content (no category prior) justifies inclusion

const CATEGORY_LABEL_AR: Record<DecisionCategory, string> = {
  staffing_change: "تغييرات في القوى العاملة",
  service_change: "تغيير في الخدمة أو نقاط التقديم",
  guest_experience_process: "عمليات تجربة الضيف",
  evidence_process_change: "تغيير في عمليات التوثيق والأدلة",
  operational_change: "تغيير تشغيلي عام",
};

/**
 * Category → requirement plausibility priors (DEMO CONFIGURATION).
 * Kept deliberately modest: these are *candidate* signals, not auto-include
 * weights. Only one requirement per category reaches the HIGH_TIER_PRIOR
 * threshold (its single most defensible, definitional link).
 */
const CATEGORY_PRIOR: Record<DecisionCategory, Partial<Record<string, number>>> = {
  staffing_change: {
    // Fewer/more field staff most directly affects capacity to observe the
    // journey (CR-004). Happiness Team (CR-005) and rights-awareness (CR-003)
    // staffing are only weakly implied by a *generic* staffing change — they
    // need explicit content match to be counted with real confidence.
    "CR-004": 0.7,
    "CR-005": 0.35,
    "CR-003": 0.25,
  },
  service_change: {
    "CR-001": 0.75,
    "CR-004": 0.4,
  },
  guest_experience_process: {
    "CR-001": 0.85,
    "CR-002": 0.4,
  },
  evidence_process_change: {
    // Documentation is one of all five requirements' evidence dimensions
    // (MVP_REQUIREMENTS.md "Evidence Evaluation Model"), but CR-002 and
    // CR-005 name documentation/reporting explicitly in their own Expected
    // Evidence lists, so they carry the strongest, tied priors.
    "CR-002": 0.6,
    "CR-005": 0.6,
    "CR-001": 0.3,
  },
  operational_change: {
    // Deliberately the weakest, most generic category — nothing reaches the
    // high tier, so a purely generic "operational change" with no matching
    // content surfaces no requirement at all.
    "CR-004": 0.55,
    "CR-003": 0.35,
    "CR-005": 0.3,
  },
};

/**
 * Topic-anchor keywords per requirement, drawn from each requirement's own
 * Purpose / Expected Evidence text in MVP_REQUIREMENTS.md:
 *   CR-001 (lines 40-50)  — pilgrim-experience initiatives, service quality
 *   CR-002 (lines 74-84)  — modern concepts, training/awareness programs
 *   CR-003 (lines 108-118) — pilgrim-rights awareness activities
 *   CR-004 (lines 142-153) — field observation/monitoring of the journey
 *   CR-005 (lines 177-189) — Happiness Team rounds/interventions/cases
 * Plain substring matching against the decision's own text — a documented,
 * deterministic MVP interpretation layer, not a live model call.
 */
const REQUIREMENT_KEYWORDS: Record<string, string[]> = {
  "CR-001": [
    "تجربة الضيف",
    "تجربة ضيف الرحمن",
    "راحة الضيف",
    "رضا الضيف",
    "مبادرة",
    "مبادرات",
    "وقت الانتظار",
    "الانتظار",
    "تدفق",
    "ازدحام",
    "جودة الخدمة",
    "استراحة",
    "إرشاد ميداني",
    "نقطة استقبال",
    "خدمة الضيف",
    "توثيق المبادرة",
    "توثيق الأنشطة",
  ],
  "CR-002": [
    "تدريب",
    "برنامج توعوي",
    "برامج توعوية",
    "توعية",
    "المفاهيم الحديثة",
    "ورشة",
    "تأهيل",
    "تطوير معرفي",
    "ترسيخ معرفي",
    "دورة تدريبية",
    // CR-002's own Expected Evidence names "implementation documentation" —
    // a documentation/process change decision legitimately touches it.
    "توثيق",
  ],
  "CR-003": [
    "حقوق ضيف الرحمن",
    "حقوق الحجاج",
    "حماية الحقوق",
    "التوعية بالحقوق",
    "شكاوى",
    "إنصاف",
    "كرامة الضيف",
    "حقوق",
  ],
  "CR-004": [
    "رصد التجربة",
    "رصد الرحلة",
    "رصد رحلة الضيف",
    "مراقبة ميدانية",
    "ملاحظات ميدانية",
    "تحليل التجربة",
    "متابعة ميدانية",
    "تقرير رصد",
    "رصد",
  ],
  "CR-005": [
    "فريق السعادة",
    "جولات ميدانية",
    "جولات فريق السعادة",
    "تدخلات ميدانية",
    "حالات فريق السعادة",
    "مستفيدين فريق السعادة",
    "مبادرات فريق السعادة",
    "فريق سعادة",
    // CR-005's own name is literally "توثيق فعاليات ومبادرات فريق السعادة" —
    // a documentation/process change decision legitimately touches it.
    "توثيق فعاليات",
    "التوثيق الدوري",
  ],
};

function matchKeywords(haystack: string, keywords: string[]): string[] {
  return keywords.filter((k) => haystack.includes(k));
}

/**
 * The agent's output for one requirement it judged to have a defensible
 * relationship to the decision. Deliberately narrow: no score, delta, or
 * risk fields — those are computed exclusively by decisionEngine.ts from
 * `sensitivity`, which stays the deterministic engine's sole numeric input
 * from this layer.
 */
export interface DecisionAgentMapping {
  requirementId: string;
  /** Whether this mapping is confident enough to be counted toward the deterministic score. */
  includedInScore: boolean;
  confidence: ConfidenceLevel;
  /** 0-1 magnitude-scaling factor handed to the deterministic engine. */
  sensitivity: number;
  /** Which rule/signal justified including this requirement — for traceability/auditability. */
  sourceRuleAr: string;
}

/**
 * Interprets a proposed operational decision against the company's current
 * requirements and returns only the requirements with a defensible
 * relationship to it (see module header for the inclusion rule). Requirements
 * with insufficient evidence are simply omitted, never guessed at.
 */
export function interpretDecision(
  input: DecisionInput,
  requirements: Requirement[]
): DecisionAgentMapping[] {
  const decisionText = `${input.titleAr} ${input.descriptionAr} ${input.affectedAreaAr}`;
  const categoryLabelAr = CATEGORY_LABEL_AR[input.category];
  const priors = CATEGORY_PRIOR[input.category];

  const mappings: DecisionAgentMapping[] = [];

  for (const requirement of requirements) {
    const categoryPrior = priors[requirement.id] ?? 0;
    const matched = matchKeywords(decisionText, REQUIREMENT_KEYWORDS[requirement.id] ?? []);
    const hasKeywordMatch = matched.length > 0;
    const sampleTerms = matched.slice(0, 2).join("، ");

    if (hasKeywordMatch && categoryPrior > 0) {
      mappings.push({
        requirementId: requirement.id,
        includedInScore: true,
        confidence: "high",
        sensitivity: categoryPrior,
        sourceRuleAr: `تطابق نصي مباشر ("${sampleTerms}") مع فئة القرار "${categoryLabelAr}" التي ترتبط عادة بهذا المعيار.`,
      });
      continue;
    }
    if (hasKeywordMatch) {
      mappings.push({
        requirementId: requirement.id,
        includedInScore: true,
        confidence: "medium",
        sensitivity: KEYWORD_ONLY_SENSITIVITY,
        sourceRuleAr: `تطابق نصي مباشر ("${sampleTerms}") مع مضمون القرار، رغم أن فئة القرار "${categoryLabelAr}" لا ترتبط عادة بهذا المعيار.`,
      });
      continue;
    }
    if (categoryPrior >= HIGH_TIER_PRIOR) {
      mappings.push({
        requirementId: requirement.id,
        includedInScore: false,
        confidence: "low",
        sensitivity: categoryPrior,
        sourceRuleAr: `ارتباط عام محتمل بفئة القرار "${categoryLabelAr}" فقط، دون تطابق نصي مباشر في وصف القرار — غير مؤكد ولم يُحتسب ضمن النتيجة الإجمالية.`,
      });
      continue;
    }
    // Insufficient evidence either way — omitted rather than guessed at.
  }

  return mappings;
}
