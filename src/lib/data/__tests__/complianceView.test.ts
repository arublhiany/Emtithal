// =============================================================================
// Phase 3 tests — canonical compliance view: no company-wide compliance status
// from Readiness, and legacy demo gap/risk data never drives canonical KPIs.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { getDemoVerificationRun } from "@/lib/engine/complianceView";
import { getMinistryCompanies } from "@/lib/data/ministryCompanies";
import { getGaps } from "@/lib/data/gaps";
import { getRisks } from "@/lib/data/risks";

test("ministry demo row derives NO company-wide compliance status from Readiness", () => {
  const run = getDemoVerificationRun();
  const demo = getMinistryCompanies().find((c) => c.id.startsWith("demo-") || c.id === "company-alnoor");
  assert.ok(demo, "demo company row present");

  // Compatibility-only neutral value — never compliant/partially/non from Readiness.
  assert.equal(demo!.status, "not_assessed");

  // Canonical facts are exposed straight from the engine.
  assert.equal(demo!.readiness, run.readiness.value);
  assert.equal(demo!.verificationCoverage, run.coverage.value);
  assert.equal(demo!.criticalBlockerCount, run.criticalBlockers.length);
  assert.equal(demo!.regulatoryPendingCount, run.regulatoryPendingCount);
  assert.equal(demo!.applicabilityPendingCount, run.applicabilityPendingCount);

  // riskLevel only mirrors the presence of a canonical Critical Blocker.
  assert.equal(demo!.riskLevel, run.criticalBlockers.length > 0 ? "critical" : "none");
});

test("legacy getGaps() / getRisks() are marked LEGACY_DEMO_ONLY", () => {
  for (const g of getGaps()) assert.equal(g.legacyDemoOnly, true, g.id);
  for (const r of getRisks()) assert.equal(r.legacyDemoOnly, true, r.id);
});

test("canonical critical KPI is independent of the legacy gap/risk severity data", () => {
  const run = getDemoVerificationRun();
  const legacyCriticalGaps = getGaps().filter((g) => g.severity === "critical").length;
  const legacyCriticalRisks = getRisks().filter((r) => r.level === "critical").length;

  // The demo's canonical critical blocker count is 1 (CIV-03) …
  assert.equal(run.criticalBlockers.length, 1);
  // … while the legacy demo narrative shows a different number — proving the
  // canonical KPI does not read from getGaps()/getRisks().
  assert.notEqual(run.criticalBlockers.length, legacyCriticalGaps);
  assert.equal(legacyCriticalGaps, 0);
  assert.equal(legacyCriticalRisks, 0);
});
