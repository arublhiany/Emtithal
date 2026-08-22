"use client";

import { useMemo } from "react";
import { getRequirements } from "@/lib/data/requirements";
import { getGaps } from "@/lib/data/gaps";
import { getRisks } from "@/lib/data/risks";
import { getCompanyProfile } from "@/lib/data/company";
import { computeOverallScore, computeReadinessLabel } from "@/lib/engine/scoringEngine";

/** Client-side aggregation of the deterministic compliance engine outputs for the demo company. */
export function useCompanyCompliance() {
  return useMemo(() => {
    const requirements = getRequirements();
    const gaps = getGaps();
    const risks = getRisks();
    const profile = getCompanyProfile();

    const { overallScore, contributions } = computeOverallScore(
      requirements.map((r) => ({ id: r.id, weight: r.weight, score: r.score }))
    );

    const hasUnresolvedCriticalGate = requirements.some(
      (r) => r.criticalGate && r.complianceStatus !== "compliant"
    );
    const readiness = computeReadinessLabel(overallScore, hasUnresolvedCriticalGate);

    const criticalGaps = gaps.filter((g) => g.severity === "critical");
    const highRisks = risks.filter((r) => r.level === "high" || r.level === "critical");

    return {
      requirements,
      gaps,
      risks,
      profile,
      overallScore,
      contributions,
      readiness,
      hasUnresolvedCriticalGate,
      criticalGaps,
      highRisks,
    };
  }, []);
}
