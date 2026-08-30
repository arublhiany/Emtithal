// =============================================================================
// Phase 2 tests — onboarding data-capture logic (no inference).
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildCompanyProfile, getMissingApplicabilityInputs } from "@/lib/onboarding/companyProfile";

test("an empty draft produces a fully-undeclared profile (no inferred values)", () => {
  const p = buildCompanyProfile({ companyId: "c", legalNameAr: "c", season: "1447H" });

  assert.deepEqual(p.declaredFacts, {
    experienceTrackScopeDeclared: null,
    companyResponsibleForCamp: null,
    contractsExternalServiceProviders: null,
    providesOrEnsuresCatering: null,
  });
  for (const c of [p.pilgrims, p.workforce, p.directContactWorkers, p.nusukApplicablePersons]) {
    assert.deepEqual(c, { count: null, sourceAr: null, lastUpdatedAr: null, verification: null });
  }
  assert.deepEqual(p.camps, []);
  assert.deepEqual(p.serviceProviders, []);
  assert.deepEqual(p.dataSources, []);
  assert.deepEqual(p.servicesAr, []);
  assert.deepEqual(p.locationsAr, []);
});

test("a count with no numeric value is treated as undeclared, dropping any dangling source", () => {
  const p = buildCompanyProfile({
    companyId: "c",
    legalNameAr: "c",
    season: "1447H",
    directContactWorkers: { count: null, sourceAr: "some source" },
  });
  assert.deepEqual(p.directContactWorkers, {
    count: null,
    sourceAr: null,
    lastUpdatedAr: null,
    verification: null,
  });
});

test("declared values pass through verbatim", () => {
  const p = buildCompanyProfile({
    companyId: "c",
    legalNameAr: "c",
    season: "1447H",
    workforce: { count: 180, sourceAr: "hr", lastUpdatedAr: "قبل يوم", verification: "PENDING_VERIFICATION" },
    declaredFacts: { experienceTrackScopeDeclared: true },
  });
  assert.deepEqual(p.workforce, {
    count: 180,
    sourceAr: "hr",
    lastUpdatedAr: "قبل يوم",
    verification: "PENDING_VERIFICATION",
  });
  assert.equal(p.declaredFacts.experienceTrackScopeDeclared, true);
  assert.equal(p.declaredFacts.companyResponsibleForCamp, null);
});

test("getMissingApplicabilityInputs lists every undeclared applicability input", () => {
  const empty = buildCompanyProfile({ companyId: "c", legalNameAr: "c", season: "1447H" });
  assert.deepEqual(getMissingApplicabilityInputs(empty).sort(), [
    "declaredFacts.companyResponsibleForCamp",
    "declaredFacts.contractsExternalServiceProviders",
    "declaredFacts.experienceTrackScopeDeclared",
    "declaredFacts.providesOrEnsuresCatering",
    "directContactWorkers.count",
    "nusukApplicablePersons.count",
  ]);

  const partial = buildCompanyProfile({
    companyId: "c",
    legalNameAr: "c",
    season: "1447H",
    declaredFacts: {
      experienceTrackScopeDeclared: true,
      companyResponsibleForCamp: true,
      contractsExternalServiceProviders: true,
      providesOrEnsuresCatering: true,
    },
  });
  assert.deepEqual(getMissingApplicabilityInputs(partial).sort(), [
    "directContactWorkers.count",
    "nusukApplicablePersons.count",
  ]);
});
