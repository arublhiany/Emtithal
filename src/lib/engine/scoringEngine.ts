// =============================================================================
// Compliance Engine — deterministic scoring
//
// Per EMTITHAL_MASTER_SPEC.md §17-19 and §22, numerical compliance MUST be
// calculated by a deterministic, reproducible engine — never invented by a
// language model. This module is pure and framework-free so it can be unit
// tested and reused by both the company and Ministry surfaces.
//
// Scoring model (MVP demo configuration — NOT an official Ministry weighting):
//   - Each of the 5 MVP criteria is scored 0-100 from its 5 evidence
//     dimensions (execution, documentation, measurement, supporting
//     evidence, completeness). Each dimension contributes up to 20 points:
//       found                 -> 20
//       unclear               -> 10
//       pending_verification  -> 5
//       missing                -> 0
//   - The overall readiness score is the weight-average of the 5 criterion
//     scores, using the configured demo weights (20 points each, 100 total).
//   - A critical-gate criterion scoring below the critical threshold caps
//     the overall readiness label at "needs attention" regardless of the
//     numeric average (MASTER_SPEC §21: a high score must never hide an
//     unresolved critical requirement).
// =============================================================================

import type {
  LegacyComplianceStatus,
  ConfidenceLevel,
  EvidenceDimensionAssessment,
  EvidenceValidationStatus,
  RiskLevel,
} from "@/lib/types";

const DIMENSION_POINTS: Record<EvidenceDimensionAssessment["state"], number> = {
  found: 20,
  unclear: 10,
  pending_verification: 5,
  missing: 0,
};

export const COMPLIANT_THRESHOLD = 85;
export const PARTIAL_THRESHOLD = 60;
export const NON_COMPLIANT_FLOOR = 1;

/** Deterministically computes a criterion's 0-100 score from its evidence dimensions. */
export function computeRequirementScore(
  dimensions: EvidenceDimensionAssessment[]
): number {
  if (dimensions.length === 0) return 0;
  // Each dimension contributes up to 20 points; 5 dimensions sum to 0-100.
  const total = dimensions.reduce((sum, d) => sum + DIMENSION_POINTS[d.state], 0);
  return Math.round(total * (100 / (dimensions.length * 20)));
}

function allDimensionsMissing(dimensions: EvidenceDimensionAssessment[]): boolean {
  return dimensions.every((d) => d.state === "missing");
}

function allDimensionsPending(dimensions: EvidenceDimensionAssessment[]): boolean {
  return dimensions.every((d) => d.state === "pending_verification" || d.state === "unclear");
}

/** Derives the Arabic compliance status label from the deterministic score. */
export function computeComplianceStatus(
  score: number,
  dimensions: EvidenceDimensionAssessment[]
): LegacyComplianceStatus {
  if (allDimensionsMissing(dimensions)) return "not_assessed";
  if (allDimensionsPending(dimensions)) return "needs_review";
  if (score >= COMPLIANT_THRESHOLD) return "compliant";
  if (score >= PARTIAL_THRESHOLD) return "partially_compliant";
  if (score >= NON_COMPLIANT_FLOOR) return "non_compliant";
  return "not_assessed";
}

/** Aggregate evidence validation status shown at the requirement level. */
export function computeEvidenceStatus(
  dimensions: EvidenceDimensionAssessment[]
): EvidenceValidationStatus | "missing" {
  if (dimensions.some((d) => d.state === "missing")) return "missing";
  if (dimensions.some((d) => d.state === "pending_verification")) return "pending_verification";
  if (dimensions.some((d) => d.state === "unclear")) return "needs_review";
  return "verified";
}

/**
 * Documented risk formula (MVP demo methodology — see MASTER_SPEC §35):
 * combines the criterion's deterministic score, whether it is a critical
 * gate, and the count of unresolved evidence dimensions (missing, unclear,
 * or pending verification).
 */
export function computeRiskLevel(
  score: number,
  criticalGate: boolean,
  dimensions: EvidenceDimensionAssessment[]
): RiskLevel {
  const unresolved = dimensions.filter((d) => d.state !== "found").length;

  if (criticalGate && score < 50) return "critical";
  if (score < 50) return "high";
  if (score < PARTIAL_THRESHOLD) return unresolved >= 2 ? "high" : "medium";
  if (score < COMPLIANT_THRESHOLD) return unresolved >= 2 ? "medium" : "low";
  return unresolved >= 3 ? "medium" : "low";
}

/** AI confidence must communicate uncertainty rather than false precision (MASTER_SPEC §27). */
export function computeConfidence(
  dimensions: EvidenceDimensionAssessment[]
): { confidence: ConfidenceLevel; reasonAr: string } {
  const missing = dimensions.filter((d) => d.state === "missing").length;
  const unclearOrPending = dimensions.filter(
    (d) => d.state === "unclear" || d.state === "pending_verification"
  ).length;

  if (missing >= 2) {
    return {
      confidence: "low",
      reasonAr: "يوجد أكثر من بُعد أدلة مفقود بالكامل، مما يحد من إمكانية التحليل الآلي الموثوق.",
    };
  }
  if (missing === 1 || unclearOrPending >= 2) {
    return {
      confidence: "medium",
      reasonAr: "بعض عناصر الأدلة غير واضحة أو تحتاج تحديثًا، ما يقلل من دقة التحليل الآلي.",
    };
  }
  if (unclearOrPending === 1) {
    return {
      confidence: "medium",
      reasonAr: "معظم الأدلة مكتملة، مع وجود عنصر واحد يحتاج مراجعة بشرية للتأكد.",
    };
  }
  return {
    confidence: "high",
    reasonAr: "جميع أبعاد الأدلة موجودة وواضحة وتدعم النتيجة المحسوبة.",
  };
}

export interface WeightedContribution {
  requirementId: string;
  weight: number;
  score: number;
  weightedContribution: number; // points out of `weight`
}

/**
 * LEGACY weighted average (the old demo "20% per criterion" model). This is NOT
 * the Phase 3 compliance engine — the canonical, authoritative engine is
 * `verificationEngine.ts` (Emtithal Readiness Index V1, unweighted). Retained
 * only as the baseline for the deterministic decision-simulation fallback
 * (`decisionEngine.ts`); do not reintroduce it into the compliance surfaces.
 */
export function computeOverallScore(
  items: { id: string; weight: number; score: number }[]
): { overallScore: number; contributions: WeightedContribution[] } {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0) || 1;
  const contributions: WeightedContribution[] = items.map((i) => ({
    requirementId: i.id,
    weight: i.weight,
    score: i.score,
    weightedContribution: (i.weight * i.score) / 100,
  }));
  const overallScore = Math.round(
    (contributions.reduce((sum, c) => sum + c.weightedContribution, 0) / totalWeight) * 100
  );
  return { overallScore, contributions };
}

/** Overall readiness label — a high average must never hide an unresolved critical gate (§21). */
export function computeReadinessLabel(
  overallScore: number,
  hasUnresolvedCriticalGate: boolean
): { labelAr: string; tone: "good" | "warning" | "critical" } {
  if (hasUnresolvedCriticalGate) {
    return { labelAr: "يتطلب تدخلاً عاجلاً — فجوة حرجة غير محلولة", tone: "critical" };
  }
  if (overallScore >= COMPLIANT_THRESHOLD) {
    return { labelAr: "جاهزية عالية للتفتيش", tone: "good" };
  }
  if (overallScore >= PARTIAL_THRESHOLD) {
    return { labelAr: "جاهزية متوسطة — تحتاج متابعة", tone: "warning" };
  }
  return { labelAr: "جاهزية منخفضة — إجراء فوري مطلوب", tone: "critical" };
}
