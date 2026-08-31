// =============================================================================
// Phase 10 tests — deterministic impact analysis + scoped notifications.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  analyzeImpact,
  buildRegChangeNotifications,
  seedRegMgmtState,
  activeVersionOf,
  type PortfolioCompany,
} from "@/lib/regmgmt";
import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
import { getRequirementByCanonicalId } from "@/lib/data/regulatory";
import type { CanonicalCompanyProfile } from "@/lib/model";

// HAJ-EXP-05 is a DECLARED_SCOPE rule on experienceTrackScopeDeclared:
//   true → APPLICABLE, false → NOT_APPLICABLE, null → INSUFFICIENT_DATA
function profile(scope: boolean | null, id: string): CanonicalCompanyProfile {
  const p = structuredClone(DEMO_COMPANY_PROFILE);
  p.companyId = id;
  p.declaredFacts.experienceTrackScopeDeclared = scope;
  return p;
}

const PORTFOLIO: PortfolioCompany[] = [
  { profile: profile(true, "co-applicable"), nameAr: "شركة منطبقة" },
  { profile: profile(false, "co-not-applicable"), nameAr: "شركة غير منطبقة" },
  { profile: profile(null, "co-insufficient"), nameAr: "شركة ببيانات ناقصة" },
];

const v5 = () => activeVersionOf(seedRegMgmtState().managed.find((m) => m.requirementId === "HAJ-EXP-05")!)!;
const canonReq = () => getRequirementByCanonicalId("HAJ-EXP-05")!;

test("impact analysis scopes to APPLICABLE / INSUFFICIENT_DATA; NOT_APPLICABLE → NO_IMPACT", () => {
  const ia = analyzeImpact(v5(), "NEW_VERSION", PORTFOLIO, canonReq());
  const byId = new Map(ia.impacts.map((i) => [i.companyId, i]));
  assert.equal(byId.get("co-applicable")!.applicability, "APPLICABLE");
  assert.equal(byId.get("co-applicable")!.state, "NEW_EVIDENCE_REQUIRED");
  assert.equal(byId.get("co-not-applicable")!.applicability, "NOT_APPLICABLE");
  assert.equal(byId.get("co-not-applicable")!.state, "NO_IMPACT");
  assert.equal(byId.get("co-insufficient")!.applicability, "INSUFFICIENT_DATA");
  assert.equal(byId.get("co-insufficient")!.state, "APPLICABILITY_REEVALUATION_REQUIRED");

  assert.deepEqual(ia.potentiallyAffectedCompanyIds.sort(), ["co-applicable", "co-insufficient"]);
  assert.deepEqual(ia.companiesRequiringActionIds, ["co-applicable"]);
});

test("a regulatory change NEVER auto-marks a company NON_COMPLIANT", () => {
  for (const ct of ["NEW_REQUIREMENT", "NEW_VERSION", "UPDATED_REQUIREMENT", "DEACTIVATED_REQUIREMENT"] as const) {
    const ia = analyzeImpact(v5(), ct, PORTFOLIO, canonReq());
    assert.equal(ia.autoNonComplianceApplied, false);
    for (const i of ia.impacts) {
      assert.equal(i.makesNonCompliant, false);
      assert.notEqual(i.state as string, "NON_COMPLIANT");
    }
  }
});

test("deactivation → applicable companies get re-evaluation (no action, no penalty)", () => {
  const ia = analyzeImpact(v5(), "DEACTIVATED_REQUIREMENT", PORTFOLIO, canonReq());
  const applicable = ia.impacts.find((i) => i.companyId === "co-applicable")!;
  assert.equal(applicable.state, "APPLICABILITY_REEVALUATION_REQUIRED");
  assert.deepEqual(ia.companiesRequiringActionIds, []);
});

test("a brand-new government requirement with no canonical rule → all companies re-evaluate (INSUFFICIENT_DATA)", () => {
  const govVersion = { ...v5(), requirementId: "GOV-NEW-777" };
  const ia = analyzeImpact(govVersion, "NEW_REQUIREMENT", PORTFOLIO, null);
  assert.ok(ia.impacts.every((i) => i.applicability === "INSUFFICIENT_DATA"));
  assert.ok(ia.impacts.every((i) => i.state === "APPLICABILITY_REEVALUATION_REQUIRED"));
});

// -- notifications: scoped ONLY to affected companies ------------

test("notifications are built ONLY for affected companies; the unrelated one gets nothing", () => {
  const version = v5();
  const ia = analyzeImpact(version, "NEW_VERSION", PORTFOLIO, canonReq());
  const notifs = buildRegChangeNotifications(version, "NEW_VERSION", ia, "2026-09-05T00:00:00.000Z");
  const notifiedCompanies = notifs.map((n) => n.companyId).sort();
  assert.deepEqual(notifiedCompanies, ["co-applicable", "co-insufficient"]);
  assert.equal(
    notifs.some((n) => n.companyId === "co-not-applicable"),
    false,
    "an unrelated (NOT_APPLICABLE) company must never be notified",
  );
});

test("notification carries a direct deep link + action flag matching the impact state", () => {
  const version = v5();
  const ia = analyzeImpact(version, "NEW_VERSION", PORTFOLIO, canonReq());
  const notifs = buildRegChangeNotifications(version, "NEW_VERSION", ia, "2026-09-05T00:00:00.000Z");
  const applicable = notifs.find((n) => n.companyId === "co-applicable")!;
  assert.equal(applicable.actionRequired, true); // NEW_EVIDENCE_REQUIRED
  assert.equal(applicable.targetHref, "/company/compliance/HAJ-EXP-05");
  assert.match(applicable.titleAr, /نسخة جديدة/);
  const insuff = notifs.find((n) => n.companyId === "co-insufficient")!;
  assert.equal(insuff.actionRequired, false); // re-evaluation only
});

test("impact analysis is deterministic — identical inputs give identical results", () => {
  const a = analyzeImpact(v5(), "NEW_VERSION", PORTFOLIO, canonReq());
  const b = analyzeImpact(v5(), "NEW_VERSION", PORTFOLIO, canonReq());
  assert.deepEqual(
    a.impacts.map((i) => [i.companyId, i.applicability, i.state]),
    b.impacts.map((i) => [i.companyId, i.applicability, i.state]),
  );
});
