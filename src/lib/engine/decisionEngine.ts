// =============================================================================
// Decision Intelligence Engine (MASTER_SPEC §37-39, §46)
//
// This MVP performs deterministic, rule-based "AI-Assisted Impact
// Forecasting" (MASTER_SPEC §26) — NOT statistical prediction from
// historical data, and NOT an official Ministry determination. Every number
// here is reproducible from the rule table below plus the company's current
// requirement scores; nothing is invented at request time.
//
// Rule table (DEMO CONFIGURATION): each decision category is mapped to the
// MVP criteria it plausibly affects, with a sensitivity coefficient
// (0-1) expressing how strongly that category moves that criterion's score
// per percentage point of the proposed change. This mapping is an MVP
// demo assumption, not an official regulatory model — see
// DEMO_WEIGHT_DISCLAIMER in lib/data/requirements.ts for the same caveat
// applied to scoring weights.
// =============================================================================

import type {
  ConfidenceLevel,
  DecisionAlternative,
  DecisionCategory,
  DecisionInput,
  DecisionSimulationResult,
  Requirement,
  RequirementImpact,
  RiskLevel,
} from "@/lib/types";
import { computeOverallScore } from "@/lib/engine/scoringEngine";

interface SensitivityRule {
  requirementId: string;
  sensitivity: number; // 0-1
}

const IMPACT_SCALE = 0.7; // demo dampening factor so a 20% operational change ≈ a moderate score shift

const RULE_TABLE: Record<DecisionCategory, SensitivityRule[]> = {
  staffing_change: [
    { requirementId: "CR-005", sensitivity: 1.0 }, // فريق السعادة يعتمد مباشرة على عدد الموظفين الميدانيين
    { requirementId: "CR-004", sensitivity: 0.85 }, // رصد التجربة يحتاج كوادر ميدانية
    { requirementId: "CR-003", sensitivity: 0.45 }, // أنشطة التوعية بالحقوق تحتاج فريقًا لتنفيذها
  ],
  service_change: [
    { requirementId: "CR-001", sensitivity: 0.8 },
    { requirementId: "CR-004", sensitivity: 0.55 },
  ],
  guest_experience_process: [
    { requirementId: "CR-001", sensitivity: 1.0 },
    { requirementId: "CR-002", sensitivity: 0.5 },
    { requirementId: "CR-004", sensitivity: 0.4 },
  ],
  evidence_process_change: [
    { requirementId: "CR-002", sensitivity: 0.7 },
    { requirementId: "CR-005", sensitivity: 0.6 },
    { requirementId: "CR-001", sensitivity: 0.3 },
  ],
  operational_change: [
    { requirementId: "CR-003", sensitivity: 0.6 },
    { requirementId: "CR-004", sensitivity: 0.7 },
    { requirementId: "CR-005", sensitivity: 0.4 },
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

function buildRequirementImpacts(
  input: DecisionInput,
  requirements: Requirement[],
  magnitudeMultiplier: number
): RequirementImpact[] {
  const rules = RULE_TABLE[input.category];
  return rules.map((rule) => {
    const requirement = requirements.find((r) => r.id === rule.requirementId);
    if (!requirement) {
      throw new Error(`Unknown requirement referenced in decision rule table: ${rule.requirementId}`);
    }
    const rawDelta =
      input.magnitudePercent * magnitudeMultiplier * rule.sensitivity * IMPACT_SCALE;
    const delta = Math.round(rawDelta);
    const predictedScore = clampScore(requirement.score + delta);
    const actualDelta = predictedScore - requirement.score;
    const direction = actualDelta < 0 ? "تراجعًا" : actualDelta > 0 ? "تحسنًا" : "تأثيرًا محدودًا";

    return {
      requirementId: requirement.id,
      requirementNameAr: requirement.nameAr,
      currentScore: requirement.score,
      predictedScore,
      delta: actualDelta,
      riskLevel: riskFromDelta(actualDelta, predictedScore),
      explanationAr: `القرار المقترح على "${input.affectedAreaAr}" يُتوقع أن يحدث ${direction} في نتيجة معيار ${requirement.id} بمقدار ${Math.abs(actualDelta)} نقطة (بناءً على حساسية تقديرية ${Math.round(rule.sensitivity * 100)}% لهذا النوع من القرارات ضمن التكوين التجريبي).`,
    };
  });
}

function overallFromImpacts(
  requirements: Requirement[],
  impacts: RequirementImpact[]
): number {
  const impactMap = new Map(impacts.map((i) => [i.requirementId, i.predictedScore]));
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
  return impacts.reduce<RiskLevel>((worst, i) => {
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
  affectedIds: string[]
): { confidence: ConfidenceLevel; reasonAr: string } {
  const affected = requirements.filter((r) => affectedIds.includes(r.id));
  const lowConfidenceCount = affected.filter((r) => r.confidence === "low").length;
  if (lowConfidenceCount >= 2) {
    return {
      confidence: "low",
      reasonAr:
        "أكثر من معيار متأثر يعتمد حاليًا على أدلة غير مكتملة، مما يقلل من دقة توقع الأثر.",
    };
  }
  if (lowConfidenceCount === 1) {
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
  const predictedOverallScore = overallFromImpacts(requirements, affectedRequirements);
  const alternatives = buildAlternatives(input, requirements, currentOverallScore);
  const recommended = alternatives.find((a) => a.isRecommended)!;

  const riskLevel = overallRisk(affectedRequirements);

  const negatives = affectedRequirements.filter((i) => i.delta < 0);
  const positives = affectedRequirements.filter((i) => i.delta > 0);

  const positiveImpactsAr =
    positives.length > 0
      ? positives.map(
          (i) => `تحسّن متوقع بمقدار ${i.delta} نقطة في معيار ${i.requirementNameAr} (${i.requirementId}).`
        )
      : ["لا توجد آثار إيجابية مباشرة متوقعة على معايير الامتثال الخمسة."];

  const negativeImpactsAr =
    negatives.length > 0
      ? negatives.map(
          (i) =>
            `تراجع متوقع بمقدار ${Math.abs(i.delta)} نقطة في معيار ${i.requirementNameAr} (${i.requirementId}) — مستوى خطر ${riskLabelAr(i.riskLevel)}.`
        )
      : ["لا توجد آثار سلبية مباشرة متوقعة على معايير الامتثال الخمسة."];

  const regulatoryGapsAr = affectedRequirements
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
    affectedRequirements.map((i) => i.requirementId)
  );

  const explanationAr = `تم تحليل القرار "${input.titleAr}" بناءً على حالة الامتثال الحالية للشركة (${currentOverallScore}/100) والمعايير الخمسة المعتمدة في النموذج التجريبي. يُتوقع أن تتأثر ${affectedRequirements.length} معايير بشكل مباشر بنسبة تغيير مقترحة ${input.magnitudePercent > 0 ? "+" : ""}${input.magnitudePercent}%. الخيار الموصى به هو "${recommended.labelAr}" لأنه يحقق أفضل توازن بين الهدف التشغيلي وأثر الامتثال ضمن قواعد المحاكاة التجريبية المعتمدة. هذه محاكاة استرشادية وليست قرارًا رقابيًا رسميًا من الوزارة.`;

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
