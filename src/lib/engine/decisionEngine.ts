// =============================================================================
// Decision Intelligence Engine (MASTER_SPEC §37-39, §46)
//
// This MVP performs deterministic, rule-based "AI-Assisted Impact
// Forecasting" (MASTER_SPEC §26) — NOT statistical prediction from
// historical data, and NOT an official Ministry determination. Every number
// here is reproducible from the rules below plus the company's current
// requirement scores; nothing is invented at request time, and no LLM call
// is involved (a plain deterministic keyword/topic match, documented below).
//
// -----------------------------------------------------------------------------
// Mapping model — content-aware, not category-flat
// -----------------------------------------------------------------------------
// A requirement is only linked to a decision when there is a defensible
// reason: either its own topic vocabulary appears in the decision's text, or
// the decision's category has a well-established (high-tier) relationship to
// it. A decision category alone is a weak, generic prior — it is never
// sufficient on its own to assert that a requirement will move, except for
// each category's single strongest ("high-tier") link, which is still shown
// only as an unconfirmed possibility, not counted toward the score.
//
// Two signals per (decision, requirement) pair:
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
// Inclusion rule (documented, deterministic — see buildRequirementImpacts):
//   - keyword match AND category prior > 0  -> included, High confidence, counted in score
//   - keyword match, no/low category prior  -> included, Medium confidence, counted in score
//   - category prior >= HIGH_TIER_PRIOR, no keyword match
//                                            -> included, Low confidence, "uncertain",
//                                               shown for transparency but NOT counted in score
//   - otherwise                             -> not included at all
//
// This directly guards against a decision "randomly" moving a criterion it
// has no defensible relationship to: the overall compliance score
// (computeOverallScore) only ever incorporates requirements whose impact was
// marked `includedInScore: true`.
// =============================================================================

import type {
  ConfidenceLevel,
  DecisionAlternative,
  DecisionCategory,
  DecisionImpactDirection,
  DecisionInput,
  DecisionSimulationResult,
  Requirement,
  RequirementImpact,
  RiskLevel,
} from "@/lib/types";
import { computeOverallScore } from "@/lib/engine/scoringEngine";

const IMPACT_SCALE = 0.7; // demo dampening factor so a 20% operational change ≈ a moderate score shift
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

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function riskFromDelta(delta: number, predictedScore: number): RiskLevel {
  if (predictedScore < 40) return "critical";
  if (delta <= -18 || predictedScore < 55) return "high";
  if (delta <= -6) return "medium";
  if (delta < 0) return "low";
  return "none";
}

function matchKeywords(haystack: string, keywords: string[]): string[] {
  return keywords.filter((k) => haystack.includes(k));
}

interface RelevanceResult {
  included: boolean;
  includedInScore: boolean;
  confidence: ConfidenceLevel;
  sensitivity: number;
  sourceRuleAr: string;
}

/** Deterministic relevance decision for one (decision, requirement) pair — see module header. */
function assessRelevance(
  requirementId: string,
  categoryPrior: number,
  matchedKeywords: string[],
  categoryLabelAr: string
): RelevanceResult {
  const hasKeywordMatch = matchedKeywords.length > 0;
  const sampleTerms = matchedKeywords.slice(0, 2).join("، ");

  if (hasKeywordMatch && categoryPrior > 0) {
    return {
      included: true,
      includedInScore: true,
      confidence: "high",
      sensitivity: categoryPrior,
      sourceRuleAr: `تطابق نصي مباشر ("${sampleTerms}") مع فئة القرار "${categoryLabelAr}" التي ترتبط عادة بهذا المعيار.`,
    };
  }
  if (hasKeywordMatch) {
    return {
      included: true,
      includedInScore: true,
      confidence: "medium",
      sensitivity: KEYWORD_ONLY_SENSITIVITY,
      sourceRuleAr: `تطابق نصي مباشر ("${sampleTerms}") مع مضمون القرار، رغم أن فئة القرار "${categoryLabelAr}" لا ترتبط عادة بهذا المعيار.`,
    };
  }
  if (categoryPrior >= HIGH_TIER_PRIOR) {
    return {
      included: true,
      includedInScore: false,
      confidence: "low",
      sensitivity: categoryPrior,
      sourceRuleAr: `ارتباط عام محتمل بفئة القرار "${categoryLabelAr}" فقط، دون تطابق نصي مباشر في وصف القرار — غير مؤكد ولم يُحتسب ضمن النتيجة الإجمالية.`,
    };
  }
  return {
    included: false,
    includedInScore: false,
    confidence: "low",
    sensitivity: 0,
    sourceRuleAr: "",
  };
}

function buildRequirementImpacts(
  input: DecisionInput,
  requirements: Requirement[],
  magnitudeMultiplier: number
): RequirementImpact[] {
  const decisionText = `${input.titleAr} ${input.descriptionAr} ${input.affectedAreaAr}`;
  const categoryLabelAr = CATEGORY_LABEL_AR[input.category];
  const priors = CATEGORY_PRIOR[input.category];

  const impacts: RequirementImpact[] = [];

  for (const requirement of requirements) {
    const categoryPrior = priors[requirement.id] ?? 0;
    const matched = matchKeywords(decisionText, REQUIREMENT_KEYWORDS[requirement.id] ?? []);
    const relevance = assessRelevance(requirement.id, categoryPrior, matched, categoryLabelAr);

    if (!relevance.included) continue;

    const rawDelta =
      input.magnitudePercent * magnitudeMultiplier * relevance.sensitivity * IMPACT_SCALE;
    const delta = Math.round(rawDelta);
    const predictedScore = relevance.includedInScore
      ? clampScore(requirement.score + delta)
      : clampScore(requirement.score + delta); // shown as an illustrative estimate either way
    const actualDelta = predictedScore - requirement.score;

    const direction: DecisionImpactDirection = !relevance.includedInScore
      ? "uncertain"
      : actualDelta > 0
        ? "positive"
        : actualDelta < 0
          ? "negative"
          : "uncertain";

    const explanationAr = relevance.includedInScore
      ? `القرار المقترح على "${input.affectedAreaAr}" يُتوقع أن يحدث ${
          direction === "positive" ? "تحسنًا" : direction === "negative" ? "تراجعًا" : "تأثيرًا محدودًا"
        } في نتيجة معيار ${requirement.id} بمقدار ${Math.abs(actualDelta)} نقطة. ${relevance.sourceRuleAr}`
      : `لا يوجد تطابق نصي مباشر بين وصف القرار ونطاق معيار ${requirement.id}. ${relevance.sourceRuleAr} الأثر التقديري المعروض (${actualDelta >= 0 ? "+" : ""}${actualDelta} نقطة) استرشادي فقط ولم يُحتسب ضمن النتيجة الإجمالية.`;

    impacts.push({
      requirementId: requirement.id,
      requirementNameAr: requirement.nameAr,
      currentScore: requirement.score,
      predictedScore,
      delta: actualDelta,
      riskLevel: relevance.includedInScore ? riskFromDelta(actualDelta, predictedScore) : "none",
      explanationAr,
      direction,
      confidence: relevance.confidence,
      sourceRuleAr: relevance.sourceRuleAr,
      includedInScore: relevance.includedInScore,
    });
  }

  return impacts;
}

function overallFromImpacts(
  requirements: Requirement[],
  impacts: RequirementImpact[]
): number {
  const impactMap = new Map(
    impacts.filter((i) => i.includedInScore).map((i) => [i.requirementId, i.predictedScore])
  );
  const { overallScore } = computeOverallScore(
    requirements.map((r) => ({
      id: r.id,
      weight: r.weight,
      score: impactMap.get(r.id) ?? r.score,
    }))
  );
  return overallScore;
}

function buildAlternatives(
  input: DecisionInput,
  requirements: Requirement[],
  currentOverallScore: number
): DecisionAlternative[] {
  const asProposedImpacts = buildRequirementImpacts(input, requirements, 1);
  const asProposedScore = overallFromImpacts(requirements, asProposedImpacts);

  const phasedImpacts = buildRequirementImpacts(input, requirements, 0.5);
  const phasedScore = overallFromImpacts(requirements, phasedImpacts);

  const mitigatedImpacts = buildRequirementImpacts(input, requirements, 0.25);
  const mitigatedScore = overallFromImpacts(requirements, mitigatedImpacts);

  const mitigationLabelAr: Record<DecisionCategory, string> = {
    staffing_change: "نقل موظفين من موقع أقل ازدحامًا بدلاً من التخفيض المباشر",
    service_change: "تعديل تدريجي لآلية الخدمة مع إبقاء الطاقة التشغيلية الحالية",
    guest_experience_process: "تنفيذ المبادرة على مرحلتين مع قياس الأثر بعد المرحلة الأولى",
    evidence_process_change: "أتمتة جزئية لعملية التوثيق بدلاً من تقليل تكرارها",
    operational_change: "إعادة توزيع الموارد الحالية بدلاً من تقليصها",
  };

  const mitigationDescAr: Record<DecisionCategory, string> = {
    staffing_change:
      "بدلاً من خفض العدد، يتم نقل عدد مماثل من الموظفين من نقطة خدمة أقل ازدحامًا لتغطية النقص.",
    service_change: "تنفيذ التعديل على مراحل صغيرة مع مراقبة الأثر على تجربة الضيف بعد كل مرحلة.",
    guest_experience_process:
      "إطلاق المبادرة في نقطة تجمع واحدة أولاً، ثم التوسع بعد قياس الأثر الفعلي على الرضا.",
    evidence_process_change:
      "استخدام نموذج توثيق مبسّط وأدوات رفع سريعة بدلاً من تقليل عدد مرات التوثيق.",
    operational_change:
      "إعادة توزيع فرق الرصد الحالية على نقاط الخدمة غير المغطاة بدلاً من تقليص الموارد.",
  };

  const alternatives: DecisionAlternative[] = [
    {
      id: "as_proposed",
      labelAr: "الخيار أ — تنفيذ القرار كما هو مقترح",
      descriptionAr: input.descriptionAr,
      complianceImpact: classifyImpact(asProposedScore - currentOverallScore),
      operationalRisk: overallRisk(asProposedImpacts),
      feasibilityAr: "قابل للتنفيذ فورًا لكنه يحمل أعلى أثر على نتائج الامتثال ضمن البدائل المطروحة.",
      predictedOverallScore: asProposedScore,
      isRecommended: false,
    },
    {
      id: "phased",
      labelAr: "الخيار ب — تنفيذ تدريجي بنسبة نصف التغيير المقترح",
      descriptionAr: `تطبيق نصف نسبة التغيير المقترحة (${(input.magnitudePercent * 0.5).toFixed(1)}%) مبدئيًا مع مراجعة الأثر قبل التوسع.`,
      complianceImpact: classifyImpact(phasedScore - currentOverallScore),
      operationalRisk: overallRisk(phasedImpacts),
      feasibilityAr: "قابل للتنفيذ ويقلل المخاطرة التنظيمية، لكنه يؤجل تحقيق كامل الهدف التشغيلي.",
      predictedOverallScore: phasedScore,
      isRecommended: false,
    },
    {
      id: "mitigated",
      labelAr: `الخيار ج — ${mitigationLabelAr[input.category]}`,
      descriptionAr: mitigationDescAr[input.category],
      complianceImpact: classifyImpact(mitigatedScore - currentOverallScore),
      operationalRisk: overallRisk(mitigatedImpacts),
      feasibilityAr: "يحقق جزءًا كبيرًا من الهدف التشغيلي مع الحفاظ على مستوى امتثال قريب من الحالي.",
      predictedOverallScore: mitigatedScore,
      isRecommended: false,
    },
    {
      id: "defer",
      labelAr: "الخيار د — تأجيل القرار ومعالجة الفجوات الحالية أولاً",
      descriptionAr:
        "تأجيل تنفيذ القرار حتى استكمال الإجراءات التصحيحية المفتوحة على المعايير المتأثرة.",
      complianceImpact: "neutral",
      operationalRisk: "low",
      feasibilityAr: "لا يحقق الهدف التشغيلي المرجو من القرار، لكنه يحافظ على مستوى الامتثال الحالي دون مخاطرة إضافية.",
      predictedOverallScore: currentOverallScore,
      isRecommended: false,
    },
  ];

  // Recommendation rule (documented, deterministic): prefer the alternative
  // with the highest predicted overall score among those that still make
  // meaningful operational progress (i.e., not "defer"), unless every
  // non-defer alternative would push overall compliance into non-compliant
  // territory (<60) — in that case, recommend deferring.
  const actionable = alternatives.filter((a) => a.id !== "defer");
  const allActionableUnsafe = actionable.every((a) => a.predictedOverallScore < 60);

  const recommendedId = allActionableUnsafe
    ? "defer"
    : actionable.reduce((best, a) =>
        a.predictedOverallScore > best.predictedOverallScore ? a : best
      ).id;

  return alternatives.map((a) => ({ ...a, isRecommended: a.id === recommendedId }));
}

function overallRisk(impacts: RequirementImpact[]): RiskLevel {
  const order: RiskLevel[] = ["none", "low", "medium", "high", "critical"];
  // Only impacts that were actually counted toward the score can justify an
  // aggregate risk claim — an "uncertain" link shouldn't inflate the badge.
  return impacts.filter((i) => i.includedInScore).reduce<RiskLevel>((worst, i) => {
    return order.indexOf(i.riskLevel) > order.indexOf(worst) ? i.riskLevel : worst;
  }, "none");
}

function classifyImpact(
  delta: number
): DecisionAlternative["complianceImpact"] {
  if (delta > 1) return "positive";
  if (delta >= -1) return "neutral";
  if (delta >= -8) return "low_negative";
  return "high_negative";
}

function computeSimulationConfidence(
  requirements: Requirement[],
  countedImpacts: RequirementImpact[]
): { confidence: ConfidenceLevel; reasonAr: string } {
  if (countedImpacts.length === 0) {
    return {
      confidence: "low",
      reasonAr:
        "لا يوجد معيار له ارتباط نصي أو تصنيفي مؤكد بهذا القرار ضمن قواعد المطابقة الحالية، لذا لا يُتوقع أثر موثوق على النتيجة الإجمالية.",
    };
  }

  const affected = requirements.filter((r) =>
    countedImpacts.some((i) => i.requirementId === r.id)
  );
  const lowEvidenceCount = affected.filter((r) => r.confidence === "low").length;

  if (lowEvidenceCount >= 2) {
    return {
      confidence: "low",
      reasonAr:
        "أكثر من معيار متأثر يعتمد حاليًا على أدلة غير مكتملة، مما يقلل من دقة التحليل الآلي.",
    };
  }
  if (lowEvidenceCount === 1) {
    return {
      confidence: "medium",
      reasonAr: "أحد المعايير المتأثرة يعتمد على أدلة غير مكتملة حاليًا.",
    };
  }
  return {
    confidence: "medium",
    reasonAr:
      "التوقع مبني على تحليل قواعد تجريبي مرتبط بالحالة الحالية للبيانات، وليس على نموذج تنبؤ إحصائي مدرَّب على بيانات تاريخية.",
  };
}

export function simulateDecision(
  input: DecisionInput,
  requirements: Requirement[]
): DecisionSimulationResult {
  const { overallScore: currentOverallScore } = computeOverallScore(
    requirements.map((r) => ({ id: r.id, weight: r.weight, score: r.score }))
  );

  const affectedRequirements = buildRequirementImpacts(input, requirements, 1);
  const countedImpacts = affectedRequirements.filter((i) => i.includedInScore);
  const predictedOverallScore = overallFromImpacts(requirements, affectedRequirements);
  const alternatives = buildAlternatives(input, requirements, currentOverallScore);
  const recommended = alternatives.find((a) => a.isRecommended)!;

  const riskLevel = overallRisk(affectedRequirements);

  const negatives = countedImpacts.filter((i) => i.direction === "negative");
  const positives = countedImpacts.filter((i) => i.direction === "positive");

  const positiveImpactsAr =
    positives.length > 0
      ? positives.map(
          (i) => `تحسّن متوقع بمقدار ${i.delta} نقطة في معيار ${i.requirementNameAr} (${i.requirementId}).`
        )
      : ["لا توجد آثار إيجابية مباشرة ومؤكدة متوقعة على معايير الامتثال الخمسة."];

  const negativeImpactsAr =
    negatives.length > 0
      ? negatives.map(
          (i) =>
            `تراجع متوقع بمقدار ${Math.abs(i.delta)} نقطة في معيار ${i.requirementNameAr} (${i.requirementId}) — مستوى خطر ${riskLabelAr(i.riskLevel)}.`
        )
      : ["لا توجد آثار سلبية مباشرة ومؤكدة متوقعة على معايير الامتثال الخمسة."];

  const regulatoryGapsAr = countedImpacts
    .filter((i) => i.predictedScore < 60)
    .map(
      (i) =>
        `معيار ${i.requirementId} (${i.requirementNameAr}) قد ينخفض إلى نطاق \"غير ملتزم\" (${i.predictedScore}/100) في حال تنفيذ القرار كما هو مقترح.`
    );

  const preventiveActionsAr = negatives.map((i) => {
    const req = requirements.find((r) => r.id === i.requirementId)!;
    return `قبل التنفيذ: ${req.recommendedActionAr} — لتقليل أثر القرار على معيار ${i.requirementId}.`;
  });
  if (preventiveActionsAr.length === 0) {
    preventiveActionsAr.push("لا توجد إجراءات وقائية إلزامية إضافية بناءً على المحاكاة الحالية.");
  }

  const { confidence, reasonAr: confidenceReasonAr } = computeSimulationConfidence(
    requirements,
    countedImpacts
  );

  const explanationAr =
    countedImpacts.length > 0
      ? `تم تحليل القرار "${input.titleAr}" بناءً على حالة الامتثال الحالية للشركة (${currentOverallScore}/100) والمعايير الخمسة المعتمدة في النموذج التجريبي. من أصل ${affectedRequirements.length} معيار له ارتباط محتمل بهذا القرار، تم احتساب أثر مؤكد على ${countedImpacts.length} منها فقط استنادًا إلى تطابق نصي أو تصنيفي واضح. الخيار الموصى به هو "${recommended.labelAr}" لأنه يحقق أفضل توازن بين الهدف التشغيلي وأثر الامتثال ضمن قواعد المحاكاة التجريبية المعتمدة. هذه محاكاة استرشادية وليست قرارًا رقابيًا رسميًا من الوزارة.`
      : `تم تحليل القرار "${input.titleAr}" ولم يظهر أي ارتباط نصي أو تصنيفي مؤكد بين مضمونه والمعايير الخمسة المعتمدة، لذا لا يُتوقع تغيّر في النتيجة الإجمالية للامتثال (${currentOverallScore}/100). هذه محاكاة استرشادية وليست قرارًا رقابيًا رسميًا من الوزارة.`;

  return {
    id: `DS-${Date.now()}`,
    createdAtLabel: "الآن",
    decision: input,
    affectedRequirements,
    currentOverallScore,
    predictedOverallScore,
    riskLevel,
    positiveImpactsAr,
    negativeImpactsAr,
    regulatoryGapsAr,
    alternatives,
    recommendedAlternativeId: recommended.id,
    preventiveActionsAr,
    explanationAr,
    confidence,
    confidenceReasonAr,
    isSimulatedDemo: true,
  };
}

function riskLabelAr(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    critical: "حرج",
    high: "مرتفع",
    medium: "متوسط",
    low: "منخفض",
    none: "لا يوجد",
  };
  return map[level];
}
