// =============================================================================
// Phase 1 integrity tests — multi-authority Regulatory Matrix.
// Source of truth: REGULATORY_MATRIX_v1.md.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { COMPLIANCE_STATUSES } from "@/lib/model";
import {
  getAuthorities,
  getRegulatoryRequirements,
  getRequirementByCanonicalId,
  getRequirementsMissingOfficialSource,
  getRequirementsMissingSourceLocator,
  getUnresolvedRequirements,
  resolveRequirementId,
  toLegacyRequirementId,
} from "@/lib/data/regulatory";
import {
  CANONICAL_TO_LEGACY_STATUS,
  LEGACY_TO_CANONICAL_STATUS,
  toCanonicalStatus,
  toLegacyStatus,
} from "@/lib/legacy/compat";

const ALL = getRegulatoryRequirements();

test("Regulatory Matrix v1 contains exactly 15 canonical requirements", () => {
  // 5 Hajj Experience + 4 Hajj Operational + 1 Ministry of Health + 5 Civil Defense.
  assert.equal(ALL.length, 15);
  const byPrefix = (p: string) => ALL.filter((r) => r.id.startsWith(p)).length;
  assert.equal(byPrefix("HAJ-EXP-"), 5);
  assert.equal(
    byPrefix("HAJ-NUSUK-") + byPrefix("HAJ-CATERING-") + byPrefix("HAJ-CAMP-") + byPrefix("HAJ-PROVIDERS-"),
    4,
  );
  assert.equal(byPrefix("MOH-"), 1);
  assert.equal(byPrefix("CIV-"), 5);
});

test("canonical requirement IDs are unique and use the matrix ID scheme", () => {
  const ids = ALL.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate canonical IDs");
  for (const id of ids) {
    assert.match(id, /^(HAJ-EXP|HAJ-NUSUK|HAJ-CATERING|HAJ-CAMP|HAJ-PROVIDERS|MOH|CIV)-\d{2}$/, id);
  }
  // No canonical record stores a legacy CR-00x identity.
  for (const r of ALL) assert.ok(!/^CR-\d{3}$/.test(r.id), `${r.id} is a legacy ID`);
});

test("CR-001…CR-005 resolve to HAJ-EXP-01…05 (aliases only)", () => {
  for (let n = 1; n <= 5; n++) {
    const legacy = `CR-00${n}`;
    const canonical = `HAJ-EXP-0${n}`;
    assert.equal(resolveRequirementId(legacy), canonical, `${legacy} → ${canonical}`);
    assert.equal(toLegacyRequirementId(canonical), legacy, `${canonical} → ${legacy}`);
    const rec = getRequirementByCanonicalId(canonical);
    assert.ok(rec);
    assert.deepEqual(rec!.legacyIds, [legacy]);
  }
  // Canonical IDs resolve to themselves; unknown IDs resolve to undefined.
  assert.equal(resolveRequirementId("HAJ-EXP-03"), "HAJ-EXP-03");
  assert.equal(resolveRequirementId("CR-999"), undefined);
  assert.equal(resolveRequirementId("nope"), undefined);
  // Non-experience requirements carry no legacy aliases.
  for (const r of ALL) {
    if (!r.id.startsWith("HAJ-EXP-")) assert.deepEqual(r.legacyIds, [], r.id);
  }
});

test("officialWeight is non-null ONLY where the matrix explicitly publishes one", () => {
  for (const r of ALL) {
    if (r.id.startsWith("HAJ-EXP-")) {
      assert.ok(r.officialWeight, `${r.id} should carry the published experience-track weight`);
      assert.equal(r.officialWeight!.trackWeightPercent, 3, `${r.id} track weight`);
      assert.equal(r.officialWeight!.withinTrackWeightPercent, 20, `${r.id} within-track weight`);
    } else {
      assert.equal(r.officialWeight, null, `${r.id} must have officialWeight = null (matrix §5–§7)`);
    }
  }
});

test("every requirement is scoped to season 1447H", () => {
  for (const r of ALL) assert.equal(r.season, "1447H", r.id);
});

test("internalCriticality matches the approved mapping (legacy criticalGate NOT carried)", () => {
  const expected: Record<string, "CRITICAL" | "REQUIRED" | "ADVISORY" | null> = {
    "HAJ-EXP-01": "REQUIRED",
    "HAJ-EXP-02": "REQUIRED",
    "HAJ-EXP-03": "REQUIRED", // NOT CRITICAL — legacy criticalGate rejected
    "HAJ-EXP-04": "REQUIRED",
    "HAJ-EXP-05": "REQUIRED",
    "HAJ-NUSUK-01": "REQUIRED",
    "HAJ-CATERING-01": "REQUIRED",
    "HAJ-CAMP-01": "CRITICAL",
    "MOH-01": null, // until current-season applicability is resolved
    "HAJ-PROVIDERS-01": null, // until responsibility ambiguity is resolved
    "CIV-01": "CRITICAL",
    "CIV-02": "REQUIRED",
    "CIV-03": "CRITICAL",
    "CIV-04": "CRITICAL",
    "CIV-05": "CRITICAL",
  };
  assert.equal(Object.keys(expected).length, 15);
  for (const r of ALL) {
    assert.equal(r.internalCriticality, expected[r.id], r.id);
  }
  // Every UNRESOLVED_REQUIREMENT record has no criticality.
  for (const r of getUnresolvedRequirements()) {
    assert.equal(r.internalCriticality, null, `${r.id} is UNRESOLVED but carries a criticality`);
  }
});

test("UNRESOLVED_REQUIREMENT records are identifiable and match the expected set", () => {
  for (const r of ALL) {
    assert.ok(
      r.resolution === "SPECIFIED" || r.resolution === "UNRESOLVED_REQUIREMENT",
      `${r.id} has an invalid resolution: ${r.resolution}`,
    );
  }
  const unresolvedIds = getUnresolvedRequirements()
    .map((r) => r.id)
    .sort();
  assert.deepEqual(unresolvedIds, ["HAJ-PROVIDERS-01", "MOH-01"]);

  // CIV requirements are NOT unresolved after the §3A Target Source clarification.
  for (const r of ALL.filter((x) => x.id.startsWith("CIV-"))) {
    assert.equal(r.resolution, "SPECIFIED", r.id);
  }

  // Each unresolved record states its SPECIFIC reason (not "missing Target Source").
  const provider = ALL.find((r) => r.id === "HAJ-PROVIDERS-01")!;
  assert.ok(
    provider.unresolved.some((u) => u.startsWith("company-vs-provider responsibility mapping")),
    "HAJ-PROVIDERS-01 must cite the responsibility-mapping gap",
  );
  assert.ok(
    !provider.unresolved.some((u) => u.toLowerCase().includes("no target source")),
    "HAJ-PROVIDERS-01 must not still cite a missing Target Source",
  );
  assert.ok(provider.targetSource && provider.targetSource.length > 0, "PROVIDERS has a Target Source");

  const moh = ALL.find((r) => r.id === "MOH-01")!;
  assert.ok(
    moh.unresolved.some((u) => u.startsWith("seasonContinuity")),
    "MOH-01 must cite unverified current-season continuity",
  );
});

test("authorities: exactly the three transcribed from the matrix", () => {
  const ids = getAuthorities()
    .map((a) => a.id)
    .sort();
  assert.deepEqual(ids, ["CIVIL_DEFENSE", "MOH", "MOHU"]);
  // Every requirement points at a known authority.
  const known = new Set(ids);
  for (const r of ALL) assert.ok(known.has(r.authorityId), `${r.id} → ${r.authorityId}`);
});

test("the six canonical compliance statuses are represented exactly", () => {
  assert.deepEqual([...COMPLIANCE_STATUSES].sort(), [
    "COMPLIANT",
    "INSUFFICIENT_DATA",
    "NON_COMPLIANT",
    "NOT_APPLICABLE",
    "PARTIALLY_COMPLIANT",
    "PENDING_VERIFICATION",
  ]);
  // Legacy adapter is total in both directions and lands inside the canonical set.
  const canonicalSet = new Set(COMPLIANCE_STATUSES);
  for (const legacy of ["compliant", "partially_compliant", "non_compliant", "needs_review", "not_assessed"] as const) {
    const canonical = toCanonicalStatus(legacy);
    assert.ok(canonicalSet.has(canonical), `${legacy} → ${canonical}`);
    assert.equal(LEGACY_TO_CANONICAL_STATUS[legacy], canonical);
  }
  for (const canonical of COMPLIANCE_STATUSES) {
    const legacy = toLegacyStatus(canonical);
    assert.ok(
      ["compliant", "partially_compliant", "non_compliant", "needs_review", "not_assessed"].includes(legacy),
      `${canonical} → ${legacy}`,
    );
    assert.equal(CANONICAL_TO_LEGACY_STATUS[canonical], legacy);
  }
  // Round-trip holds for the five statuses with a 1:1 legacy counterpart.
  for (const legacy of ["compliant", "partially_compliant", "non_compliant"] as const) {
    assert.equal(toLegacyStatus(toCanonicalStatus(legacy)), legacy);
  }
});

test("SPECIFIED records carry every structural §16 field", () => {
  const specified = ALL.filter((r) => r.resolution === "SPECIFIED");
  assert.equal(specified.length, 13, "13 SPECIFIED + 2 UNRESOLVED = 15");
  for (const r of specified) {
    assert.ok(r.applicabilityRule, `${r.id} missing applicabilityRule`);
    assert.ok(r.targetSource, `${r.id} missing targetSource`);
    assert.ok(r.verificationRule, `${r.id} missing verificationRule`);
    assert.ok(r.matrixSourceRef.length > 0, `${r.id} missing matrixSourceRef`);
  }
});

test("every record carries a verified officialSource, distinct from matrixSourceRef", () => {
  for (const r of ALL) {
    assert.ok(r.officialSource, `${r.id} has no verified officialSource`);
    assert.equal(typeof r.officialSource!.reference, "string");
    assert.ok(r.officialSource!.reference.length > 0, `${r.id} officialSource.reference is empty`);
    // officialSource is a structured object, never the matrixSourceRef string.
    assert.notEqual(r.officialSource as unknown, r.matrixSourceRef);
    assert.ok(
      r.officialSource!.authorityId === r.authorityId,
      `${r.id} officialSource authority (${r.officialSource!.authorityId}) != requirement authority (${r.authorityId})`,
    );
  }
  assert.equal(getRequirementsMissingOfficialSource().length, 0);
});

test("source locator gaps are tracked without inventing a page number", () => {
  const missingLocator = getRequirementsMissingSourceLocator()
    .map((r) => r.id)
    .sort();
  assert.deepEqual(missingLocator, ["HAJ-CAMP-01", "HAJ-CATERING-01", "HAJ-PROVIDERS-01"]);
  for (const r of getRequirementsMissingSourceLocator()) {
    assert.ok(
      r.unresolved.some((u) => u.startsWith("officialSource locator")),
      `${r.id} missing locator note in unresolved[]`,
    );
  }
});

test("officialSource.locatorStatus is an explicit canonical field (not inferred from locatorNote)", () => {
  const status = (id: string) => getRequirementByCanonicalId(id)!.officialSource!.locatorStatus;

  assert.equal(status("HAJ-EXP-05"), "VERIFIED_COMPLETE");
  assert.equal(status("HAJ-CATERING-01"), "INCOMPLETE");
  assert.equal(status("HAJ-CAMP-01"), "INCOMPLETE");
  assert.equal(status("HAJ-PROVIDERS-01"), "INCOMPLETE");

  // every record has one of the two explicit values
  for (const r of ALL) {
    assert.ok(
      r.officialSource!.locatorStatus === "VERIFIED_COMPLETE" ||
        r.officialSource!.locatorStatus === "INCOMPLETE",
      `${r.id} locatorStatus not explicit`,
    );
  }
  // the only INCOMPLETE requirements are exactly the three §3A-C ones
  assert.deepEqual(
    ALL.filter((r) => r.officialSource!.locatorStatus === "INCOMPLETE")
      .map((r) => r.id)
      .sort(),
    ["HAJ-CAMP-01", "HAJ-CATERING-01", "HAJ-PROVIDERS-01"],
  );
});

test("verificationTarget is defined for the qualitative/field requirements", () => {
  for (const r of ALL.filter((x) => x.id.startsWith("CIV-") || x.id === "HAJ-PROVIDERS-01")) {
    assert.ok(r.verificationTarget && r.verificationTarget.length > 0, `${r.id} missing verificationTarget`);
  }
});

test("no record is silently marked complete — every record has an open question", () => {
  for (const r of ALL) {
    assert.ok(r.unresolved.length > 0, `${r.id} claims to be fully specified`);
  }
});

test("applicability: no 'always applicable' basis; the Experience track is DECLARED_SCOPE", () => {
  for (const r of ALL) {
    // The removed ALWAYS_FOR_COMPANY kind must not reappear.
    assert.notEqual((r.applicabilityRule as { kind?: string } | null)?.kind, "ALWAYS_FOR_COMPANY", r.id);
  }
  for (const r of ALL.filter((x) => x.id.startsWith("HAJ-EXP-"))) {
    assert.equal(r.applicabilityRule?.kind, "DECLARED_SCOPE", r.id);
    assert.ok(
      r.unresolved.some((u) => u.startsWith("applicability basis")),
      `${r.id} does not flag that Experience-Track scope must be declared`,
    );
  }
});
