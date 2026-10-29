"use client";

// =============================================================================
// Government portfolio — canonical, demo-scoped (Phase 11).
//
// Runs the deterministic Verification Engine on each profile in the demo
// government portfolio (Phase 10 `getDemoGovernmentPortfolio`). Every value is
// canonical — Readiness Index, Verification Coverage, critical blockers,
// regulatory/applicability-pending counts. No Official Score, no invented
// national metric. Rows are `(تجريبي)`-labelled by the underlying dataset.
// =============================================================================

import { useMemo } from "react";
import { getRegulatoryRequirements } from "@/lib/data/regulatory";
import { getDemoGovernmentPortfolio } from "@/lib/data/demo/governmentPortfolio";
import { DEMO_VERIFICATION_INPUTS } from "@/lib/data/demo/verificationInputs";
import { verifyAll } from "@/lib/engine/verificationEngine";

export interface PortfolioRow {
  companyId: string;
  nameAr: string;
  /** "مؤشر جاهزية سبّاق" — number | null (→ "—"). */
  readiness: number | null;
  /** "نسبة التحقق" — number | null (→ "—"). */
  coverage: number | null;
  criticalBlockerCount: number;
  regulatoryPendingCount: number;
  applicabilityPendingCount: number;
  pendingVerificationCount: number;
  /** true only when a canonical critical blocker exists — never an invented tier. */
  needsAttention: boolean;
}

export function useGovernmentPortfolio() {
  return useMemo(() => {
    const reqs = getRegulatoryRequirements();
    const rows: PortfolioRow[] = getDemoGovernmentPortfolio().map(({ profile, nameAr }) => {
      const run = verifyAll(reqs, profile, DEMO_VERIFICATION_INPUTS);
      return {
        companyId: profile.companyId,
        nameAr,
        readiness: run.readiness.value,
        coverage: run.coverage.value,
        criticalBlockerCount: run.criticalBlockers.length,
        regulatoryPendingCount: run.regulatoryPendingCount,
        applicabilityPendingCount: run.applicabilityPendingCount,
        pendingVerificationCount: run.pendingWarnings.length,
        needsAttention:
          run.criticalBlockers.length > 0 ||
          run.pendingWarnings.length > 0 ||
          run.applicabilityPendingCount > 0,
      };
    });

    const readinessValues = rows.map((r) => r.readiness).filter((n): n is number => n != null);
    const portfolioReadiness =
      readinessValues.length === 0
        ? null
        : Math.round(readinessValues.reduce((a, b) => a + b, 0) / readinessValues.length);

    return {
      rows,
      count: rows.length,
      companiesNeedingAttention: rows.filter((r) => r.needsAttention).length,
      companiesWithCriticalBlocker: rows.filter((r) => r.criticalBlockerCount > 0).length,
      totalPendingVerification: rows.reduce((s, r) => s + r.pendingVerificationCount, 0),
      /** Mean of the available demo readiness values — clearly demo-scoped, NOT an Official Score. */
      portfolioReadiness,
    };
  }, []);
}
