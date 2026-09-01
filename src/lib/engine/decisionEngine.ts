// =============================================================================
// Decision Intelligence Engine (MASTER_SPEC §37-39, §46)
//
// This MVP performs deterministic, rule-based "AI-Assisted Impact
// Forecasting" (MASTER_SPEC §26) — NOT statistical prediction from
// historical data, and NOT an official Ministry determination. Every number
// here is reproducible from the company's current requirement scores plus
// the mappings handed to it; nothing is invented at request time.
//
// -----------------------------------------------------------------------------
// Layering: this file is the deterministic engine, not the interpreter
// -----------------------------------------------------------------------------
// Which requirements a decision plausibly relates to — and with what
// confidence and source rule — is decided by the Decision Intelligence Agent
// V1 (lib/agent/decisionAgent.ts), a separate interpretation/retrieval layer
// that sits above this engine. This file never decides relevance itself: it
// calls the agent, then does 100% of the numeric work (delta, predicted
// score, risk level, alternatives, recommendation) from the agent's output.
// The agent cannot compute or override a score — `sensitivity` is the only
// number it hands down, and computeOverallScore (lib/engine/scoringEngine.ts)
// remains the sole source of truth for compliance scoring, exactly as
// before this layering was introduced.
//
// Fallback: if the agent throws or returns something malformed, `interpret()`
// below catches it and returns no mappings at all — the deterministic engine
// then behaves exactly as it does for "no defensible relationship found"
// (zero score movement, the existing empty-state explanation), so Decision
// Simulation keeps working even if the interpretation layer is unavailable.
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
import { interpretDecision, type DecisionAgentMapping } from "@/lib/agent/decisionAgent";

/** "بمقدار …" points phrase in natural Arabic (1 → نقطة واحدة, 2 → نقطتين, 3–10 → N نقاط, else → N نقطة). */
function pointsPhraseAr(n: number): string {
  const a = Math.abs(n);
  if (a === 1) return "نقطة واحدة";
  if (a === 2) return "نقطتين";
  if (a >= 3 && a <= 10) return `${a} نقاط`;
  return `${a} نقطة`;
}

// NOTE: `computeOverallScore` here is the LEGACY weighted baseline used only for
// the decision-simulation before/after projection. It is NOT the Phase 3
// compliance engine (`verificationEngine.ts`). Migrating decision simulation to
// the canonical engine is Phase 5/7 work.

const IMPACT_SCALE = 0.7; // demo dampening factor so a 20% operational change ≈ a moderate score shift

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

/**
 * Calls the Decision Intelligence Agent to get requirement mappings, with a
 * fallback: if the agent throws or returns a malformed result, this returns
 * an empty mapping list rather than letting the failure propagate — Decision
 * Simulation must keep working (as "no confident impact found") even if the
 * interpretation layer is unavailable. `interpret` is injectable so tests can
 * exercise this fallback path deterministically.
 */
function safeInterpret(
  input: DecisionInput,
  requirements: Requirement[],
  interpret: typeof interpretDecision
): DecisionAgentMapping[] {
  try {
    const mappings = interpret(input, requirements);
    if (!Array.isArray(mappings)) throw new Error("Decision agent returned a non-array result");
    return mappings;
  } catch {
    return [];
  }
}

function buildRequirementImpacts(
  input: DecisionInput,
  requirements: Requirement[],
  magnitudeMultiplier: number,
  interpret: typeof interpretDecision
): RequirementImpact[] {
  const mappings = safeInterpret(input, requirements, interpret);
  const mappingByRequirementId = new Map(mappings.map((m) => [m.requirementId, m]));

  const impacts: RequirementImpact[] = [];

  for (const requirement of requirements) {
    const mapping = mappingByRequirementId.get(requirement.id);
    if (!mapping) continue;

    const rawDelta =
      input.magnitudePercent * magnitudeMultiplier * mapping.sensitivity * IMPACT_SCALE;
    const delta = Math.round(rawDelta);
    const predictedScore = clampScore(requirement.score + delta);
    const actualDelta = predictedScore - requirement.score;

    const direction: DecisionImpactDirection = !mapping.includedInScore
      ? "uncertain"
      : actualDelta > 0
        ? "positive"
        : actualDelta < 0
          ? "negative"
          : "uncertain";

    const reqName = `«${requirement.nameAr}»`;
    const explanationAr = mapping.includedInScore
      ? `${
          direction === "positive" ? "تحسّن" : direction === "negative" ? "تراجع" : "تأثير محدود"
        } متوقع في جاهزية متطلب ${reqName} بمقدار ${pointsPhraseAr(actualDelta)}.`
      : `قد يتأثر متطلب ${reqName} بالقرار المقترح، لكن مستوى الثقة منخفض. الأثر غير محتسب في المؤشر — راجع البيانات المرتبطة قبل الاعتماد عليه.`;

    impacts.push({
      requirementId: requirement.id,
      requirementNameAr: requirement.nameAr,
      currentScore: requirement.score,
      predictedScore,
      delta: actualDelta,
      riskLevel: mapping.includedInScore ? riskFromDelta(actualDelta, predictedScore) : "none",
      explanationAr,
      direction,
      confidence: mapping.confidence,
      sourceRuleAr: mapping.sourceRuleAr,
      includedInScore: mapping.includedInScore,
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
  currentOverallScore: number,
  interpret: typeof interpretDecision
): DecisionAlternative[] {
  const asProposedImpacts = buildRequirementImpacts(input, requirements, 1, interpret);
  const asProposedScore = overallFromImpacts(requirements, asProposedImpacts);

  const phasedImpacts = buildRequirementImpacts(input, requirements, 0.5, interpret);
  const phasedScore = overallFromImpacts(requirements, phasedImpacts);

  const mitigatedImpacts = buildRequirementImpacts(input, requirements, 0.25, interpret);
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
        "لم يظهر ارتباط واضح بين هذا القرار وأي متطلب، لذا لا يُتوقع أثر مؤكد على المؤشر.",
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
        "أكثر من متطلب متأثر يعتمد حاليًا على أدلة غير مكتملة، مما يقلل من دقة التحليل.",
    };
  }
  if (lowEvidenceCount === 1) {
    return {
      confidence: "medium",
      reasonAr: "أحد المتطلبات المتأثرة يعتمد على أدلة غير مكتملة حاليًا.",
    };
  }
  return {
    confidence: "medium",
    reasonAr: "يعتمد التحليل على بيانات الشركة الحالية.",
  };
}

/**
 * @param interpret Which Decision Intelligence Agent to consult for
 *   requirement mappings. Defaults to the real agent (lib/agent/decisionAgent.ts);
 *   overridable in tests to exercise the fallback path when the agent is
 *   unavailable or throws (see safeInterpret above).
 */
export function simulateDecision(
  input: DecisionInput,
  requirements: Requirement[],
  interpret: typeof interpretDecision = interpretDecision
): DecisionSimulationResult {
  const { overallScore: currentOverallScore } = computeOverallScore(
    requirements.map((r) => ({ id: r.id, weight: r.weight, score: r.score }))
  );

  const affectedRequirements = buildRequirementImpacts(input, requirements, 1, interpret);
  const countedImpacts = affectedRequirements.filter((i) => i.includedInScore);
  const predictedOverallScore = overallFromImpacts(requirements, affectedRequirements);
  const alternatives = buildAlternatives(input, requirements, currentOverallScore, interpret);
  const recommended = alternatives.find((a) => a.isRecommended)!;

  const riskLevel = overallRisk(affectedRequirements);

  const negatives = countedImpacts.filter((i) => i.direction === "negative");
  const positives = countedImpacts.filter((i) => i.direction === "positive");

  const positiveImpactsAr =
    positives.length > 0
      ? positives.map(
          (i) =>
            `تحسّن متوقع في جاهزية متطلب «${i.requirementNameAr}» بمقدار ${pointsPhraseAr(i.delta)}.`
        )
      : ["لا توجد آثار إيجابية مؤكدة متوقعة."];

  const negativeImpactsAr =
    negatives.length > 0
      ? negatives.map(
          (i) =>
            `تراجع متوقع في جاهزية متطلب «${i.requirementNameAr}» بمقدار ${pointsPhraseAr(i.delta)} — مستوى الخطر ${riskLabelAr(i.riskLevel)}.`
        )
      : ["لا توجد آثار سلبية مؤكدة متوقعة."];

  const regulatoryGapsAr = countedImpacts
    .filter((i) => i.predictedScore < 60)
    .map(
      (i) =>
        `قد تنخفض جاهزية متطلب «${i.requirementNameAr}» إلى نطاق «غير ملتزم» عند تنفيذ القرار كما هو مقترح.`
    );

  const preventiveActionsAr = negatives.map((i) => {
    const req = requirements.find((r) => r.id === i.requirementId)!;
    return `قبل التنفيذ: ${req.recommendedActionAr} — لتقليل أثر القرار على متطلب «${req.nameAr}».`;
  });
  if (preventiveActionsAr.length === 0) {
    preventiveActionsAr.push("لا توجد إجراءات وقائية إضافية مطلوبة.");
  }

  const { confidence, reasonAr: confidenceReasonAr } = computeSimulationConfidence(
    requirements,
    countedImpacts
  );

  const explanationAr =
    countedImpacts.length > 0
      ? `يعرض التحليل المتطلبات التي قد يتأثر امتثالها بقرار "${input.titleAr}". من بين ${affectedRequirements.length} متطلبًا مرتبطًا محتملًا، ظهر أثر مؤكد على ${countedImpacts.length}. البديل المقترح هو "${recommended.labelAr}" لتحقيق أفضل توازن بين الهدف التشغيلي والجاهزية. هذه محاكاة استرشادية.`
      : `لم يظهر ارتباط واضح بين قرار "${input.titleAr}" وأي متطلب، لذا لا يُتوقع تغيّر في المؤشر. هذه محاكاة استرشادية.`;

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
