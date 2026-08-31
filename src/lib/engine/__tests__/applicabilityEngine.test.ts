// =============================================================================
// Phase 2 integrity tests — deterministic Applicability Engine.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { getRegulatoryRequirements, getRequirementByCanonicalId } from "@/lib/data/regulatory";
import {
  DEMO_COMPANY_PROFILE,
  DEMO_COMPANY_PROFILE_DRAFT,
} from "@/lib/data/demo/companyProfile";
import { buildCompanyProfile, type CompanyProfileDraft } from "@/lib/onboarding/companyProfile";
import {
  evaluateAllApplicability,
  evaluateApplicability,
  getNotApplicableRequirementIds,
  summariseApplicability,
} from "@/lib/engine/applicabilityEngine";

const REQS = getRegulatoryRequirements();
const req = (id: string) => getRequirementByCanonicalId(id)!;

/** A profile with NOTHING declared. */
function emptyProfile() {
  return buildCompanyProfile({ companyId: "t", legalNameAr: "t", season: "1447H" });
}
function withDraft(patch: Partial<CompanyProfileDraft>) {
  return buildCompanyProfile({ companyId: "t", legalNameAr: "t", season: "1447H", ...patch });
}

const EXP_IDS = ["HAJ-EXP-01", "HAJ-EXP-02", "HAJ-EXP-03", "HAJ-EXP-04", "HAJ-EXP-05"];
const CIV_IDS = ["CIV-01", "CIV-02", "CIV-03", "CIV-04", "CIV-05"];

// -- Experience Track (DECLARED_SCOPE) ------------------------------------------

test("Experience Track declared true → every HAJ-EXP is APPLICABLE", () => {
  const p = withDraft({ declaredFacts: { experienceTrackScopeDeclared: true } });
  for (const id of EXP_IDS) {
    assert.equal(evaluateApplicability(req(id), p).outcome, "APPLICABLE", id);
  }
});

test("Experience Track declared false → every HAJ-EXP is NOT_APPLICABLE", () => {
  const p = withDraft({ declaredFacts: { experienceTrackScopeDeclared: false } });
  for (const id of EXP_IDS) {
    assert.equal(evaluateApplicability(req(id), p).outcome, "NOT_APPLICABLE", id);
  }
});

test("Experience Track not declared → every HAJ-EXP is INSUFFICIENT_DATA (never inferred)", () => {
  const p = emptyProfile();
  for (const id of EXP_IDS) {
    const r = evaluateApplicability(req(id), p);
    assert.equal(r.outcome, "INSUFFICIENT_DATA", id);
    assert.notEqual(r.outcome, "APPLICABLE");
  }
});

// -- Civil Defense + HAJ-CAMP (EXPRESSION company_responsible_for_camp) --------

test("companyResponsibleForCamp true → CIV-01…05 and HAJ-CAMP-01 APPLICABLE", () => {
  const p = withDraft({ declaredFacts: { companyResponsibleForCamp: true } });
  for (const id of [...CIV_IDS, "HAJ-CAMP-01"]) {
    assert.equal(evaluateApplicability(req(id), p).outcome, "APPLICABLE", id);
  }
});

test("companyResponsibleForCamp false → CIV-01…05 and HAJ-CAMP-01 NOT_APPLICABLE", () => {
  const p = withDraft({ declaredFacts: { companyResponsibleForCamp: false } });
  for (const id of [...CIV_IDS, "HAJ-CAMP-01"]) {
    assert.equal(evaluateApplicability(req(id), p).outcome, "NOT_APPLICABLE", id);
  }
});

test("companyResponsibleForCamp not declared → CIV-01…05 and HAJ-CAMP-01 INSUFFICIENT_DATA", () => {
  const p = emptyProfile();
  for (const id of [...CIV_IDS, "HAJ-CAMP-01"]) {
    assert.equal(evaluateApplicability(req(id), p).outcome, "INSUFFICIENT_DATA", id);
  }
});

// -- Hard invariant: missing data never becomes APPLICABLE --------------------

test("a fully undeclared profile produces NO APPLICABLE requirement", () => {
  const results = evaluateAllApplicability(REQS, emptyProfile());
  for (const r of results) {
    assert.notEqual(r.outcome, "APPLICABLE", `${r.requirementId} became APPLICABLE from no data`);
    assert.ok(
      r.outcome === "INSUFFICIENT_DATA" || r.outcome === "NOT_APPLICABLE",
      `${r.requirementId} → ${r.outcome}`,
    );
  }
});

// -- Target population is never invented -------------------------------------

test("target population is never manufactured", () => {
  // Nusuk / MOH targets absent → basis is null, outcome INSUFFICIENT_DATA.
  const p = emptyProfile();
  const nusuk = evaluateApplicability(req("HAJ-NUSUK-01"), p);
  const moh = evaluateApplicability(req("MOH-01"), p);
  assert.equal(nusuk.targetPopulationBasis, null);
  assert.equal(moh.targetPopulationBasis, null);
  assert.equal(nusuk.outcome, "INSUFFICIENT_DATA");
  assert.equal(moh.outcome, "INSUFFICIENT_DATA");

  // Every result across every requirement: basis is a description string or null,
  // never a bare number.
  for (const r of evaluateAllApplicability(REQS, DEMO_COMPANY_PROFILE)) {
    assert.ok(
      r.targetPopulationBasis === null || typeof r.targetPopulationBasis === "string",
      `${r.requirementId} target basis is not a string/null`,
    );
    if (typeof r.targetPopulationBasis === "string") {
      assert.match(r.targetPopulationBasis, /^declared: /, r.requirementId);
    }
  }
});

// -- HAJ-PROVIDERS-01: applicability must not resolve the regulatory gap ------

test("external providers → HAJ-PROVIDERS-01 APPLICABLE but regulatory state stays UNRESOLVED", () => {
  const p = withDraft({
    declaredFacts: { contractsExternalServiceProviders: true },
  });
  const r = evaluateApplicability(req("HAJ-PROVIDERS-01"), p);
  assert.equal(r.outcome, "APPLICABLE");
  assert.equal(r.regulatoryResolution, "UNRESOLVED_REQUIREMENT");
  assert.ok(r.regulatoryUnresolvedNote && r.regulatoryUnresolvedNote.length > 0);
  assert.match(r.reason, /UNRESOLVED/);
});

test("no external providers declared → HAJ-PROVIDERS-01 NOT_APPLICABLE; nothing declared → INSUFFICIENT_DATA", () => {
  assert.equal(
    evaluateApplicability(
      req("HAJ-PROVIDERS-01"),
      withDraft({ declaredFacts: { contractsExternalServiceProviders: false } }),
    ).outcome,
    "NOT_APPLICABLE",
  );
  assert.equal(
    evaluateApplicability(req("HAJ-PROVIDERS-01"), emptyProfile()).outcome,
    "INSUFFICIENT_DATA",
  );
});

// -- MOH-01: only the direct-contact worker subset --------------------------

test("MOH-01 applicability uses ONLY the declared direct-contact worker subset", () => {
  // Whole workforce declared, but NOT the direct-contact subset → INSUFFICIENT_DATA.
  const workforceOnly = withDraft({ workforce: { count: 180 } });
  const r1 = evaluateApplicability(req("MOH-01"), workforceOnly);
  assert.equal(r1.outcome, "INSUFFICIENT_DATA");
  assert.deepEqual(r1.companyFieldsUsed, ["directContactWorkers.count"]);

  // Direct-contact subset declared → APPLICABLE, limited to that subset.
  const withSubset = withDraft({ directContactWorkers: { count: 45, sourceAr: "سجل أدوار — بيانات عرض" } });
  const r2 = evaluateApplicability(req("MOH-01"), withSubset);
  assert.equal(r2.outcome, "APPLICABLE");
  assert.match(r2.reason, /NOT the whole workforce/);
  assert.match(r2.targetPopulationBasis ?? "", /^declared: directContactWorkers/);

  // MOH-01 stays regulatorily unresolved (season continuity) in both cases.
  assert.equal(r1.regulatoryResolution, "UNRESOLVED_REQUIREMENT");
  assert.equal(r2.regulatoryResolution, "UNRESOLVED_REQUIREMENT");
});

test("MOH-01: missing direct-contact worker population → INSUFFICIENT_DATA", () => {
  assert.equal(evaluateApplicability(req("MOH-01"), emptyProfile()).outcome, "INSUFFICIENT_DATA");
});

// -- missingCompanyFields: EXACT absent inputs, not "fields consulted" -------

test("missingCompanyFields names only the exact absent required input (MOH-01)", () => {
  const r = evaluateApplicability(req("MOH-01"), emptyProfile());
  assert.equal(r.outcome, "INSUFFICIENT_DATA");
  assert.deepEqual(r.missingCompanyFields, ["directContactWorkers.count"]);
});

test("a present field is never labelled missing (MOH-01 subset declared → APPLICABLE, [])", () => {
  const withSubset = withDraft({ directContactWorkers: { count: 45, sourceAr: "س" } });
  const r = evaluateApplicability(req("MOH-01"), withSubset);
  assert.equal(r.outcome, "APPLICABLE");
  assert.deepEqual(r.missingCompanyFields, []);
});

test("APPLICABLE and NOT_APPLICABLE always have missingCompanyFields = []", () => {
  const inScope = withDraft({ declaredFacts: { experienceTrackScopeDeclared: true } });
  const outScope = withDraft({ declaredFacts: { experienceTrackScopeDeclared: false } });
  for (const id of EXP_IDS) {
    assert.deepEqual(evaluateApplicability(req(id), inScope).missingCompanyFields, [], `${id} APPLICABLE`);
    assert.deepEqual(evaluateApplicability(req(id), outScope).missingCompanyFields, [], `${id} NOT_APPLICABLE`);
  }
  // whole demo set: no APPLICABLE / NOT_APPLICABLE result carries a missing field
  for (const r of evaluateAllApplicability(REQS, DEMO_COMPANY_PROFILE)) {
    if (r.outcome !== "INSUFFICIENT_DATA") assert.deepEqual(r.missingCompanyFields, [], r.requirementId);
  }
});

test("when one of several rule inputs is absent, only the absent one is returned (HAJ-PROVIDERS-01)", () => {
  // emptyProfile → contractsExternalServiceProviders undeclared AND serviceProviders = []
  const r = evaluateApplicability(req("HAJ-PROVIDERS-01"), emptyProfile());
  assert.equal(r.outcome, "INSUFFICIENT_DATA");
  // the rule consulted two inputs …
  assert.deepEqual(r.companyFieldsUsed, [
    "declaredFacts.contractsExternalServiceProviders",
    "serviceProviders[]",
  ]);
  // … but only the genuinely-absent one is reported missing (an empty
  // serviceProviders[] is a declared state, not an absence)
  assert.deepEqual(r.missingCompanyFields, ["declaredFacts.contractsExternalServiceProviders"]);
});

test("each undeclared single-input rule reports exactly that input", () => {
  const cases: [string, string][] = [
    ["HAJ-EXP-01", "declaredFacts.experienceTrackScopeDeclared"],
    ["HAJ-CAMP-01", "declaredFacts.companyResponsibleForCamp"],
    ["CIV-03", "declaredFacts.companyResponsibleForCamp"],
    ["HAJ-CATERING-01", "declaredFacts.providesOrEnsuresCatering"],
    ["HAJ-NUSUK-01", "nusukApplicablePersons.count"],
    ["MOH-01", "directContactWorkers.count"],
  ];
  for (const [id, field] of cases) {
    const r = evaluateApplicability(req(id), emptyProfile());
    assert.equal(r.outcome, "INSUFFICIENT_DATA", id);
    assert.deepEqual(r.missingCompanyFields, [field], id);
  }
});

// -- NOT_APPLICABLE requirements are identifiable for downstream exclusion ---

test("NOT_APPLICABLE requirements are collectable for Phase 3 exclusion", () => {
  const p = withDraft({
    declaredFacts: { experienceTrackScopeDeclared: false, companyResponsibleForCamp: false },
  });
  const results = evaluateAllApplicability(REQS, p);
  const notApplicable = getNotApplicableRequirementIds(results).sort();
  assert.deepEqual(notApplicable, [
    "CIV-01",
    "CIV-02",
    "CIV-03",
    "CIV-04",
    "CIV-05",
    "HAJ-CAMP-01",
    "HAJ-EXP-01",
    "HAJ-EXP-02",
    "HAJ-EXP-03",
    "HAJ-EXP-04",
    "HAJ-EXP-05",
  ]);
});

// -- DEMO_DATA sources are never live government integrations ----------------

test("DEMO_DATA data sources are never represented as live integrations", () => {
  for (const ds of DEMO_COMPANY_PROFILE.dataSources) {
    assert.equal(ds.origin, "DEMO_DATA", `${ds.kind} origin`);
    assert.notEqual(ds.state, "CONNECTED", `${ds.kind} must not be CONNECTED in demo`);
  }
  const nusuk = DEMO_COMPANY_PROFILE.dataSources.find((d) => d.kind === "NUSUK")!;
  assert.equal(nusuk.state, "NOT_CONNECTED");
  assert.equal(nusuk.sourceAr, "لا يوجد ربط مفعّل في النسخة الحالية");
});

// -- Demo company applicability snapshot ------------------------------------

test("demo company (demo-company-01) applicability set is as expected", () => {
  assert.equal(DEMO_COMPANY_PROFILE.companyId, "demo-company-01");
  const s = summariseApplicability(evaluateAllApplicability(REQS, DEMO_COMPANY_PROFILE));
  assert.deepEqual(s.applicable.sort(), [
    "CIV-01",
    "CIV-02",
    "CIV-03",
    "CIV-04",
    "CIV-05",
    "HAJ-CAMP-01",
    "HAJ-CATERING-01",
    "HAJ-EXP-01",
    "HAJ-EXP-02",
    "HAJ-EXP-03",
    "HAJ-EXP-04",
    "HAJ-EXP-05",
    "HAJ-PROVIDERS-01",
  ]);
  assert.deepEqual(s.notApplicable, []);
  assert.deepEqual(s.insufficientData.sort(), ["HAJ-NUSUK-01", "MOH-01"]);
  // Regulatory truth still unresolved for these two regardless of applicability.
  assert.deepEqual(s.stillRegulatorilyUnresolved.sort(), ["HAJ-PROVIDERS-01", "MOH-01"]);
});

test("engine is deterministic and pure (same input → identical output)", () => {
  const a = evaluateAllApplicability(REQS, DEMO_COMPANY_PROFILE);
  const b = evaluateAllApplicability(REQS, buildCompanyProfile(DEMO_COMPANY_PROFILE_DRAFT));
  assert.deepEqual(a, b);
});
