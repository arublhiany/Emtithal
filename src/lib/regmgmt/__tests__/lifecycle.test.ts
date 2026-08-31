// =============================================================================
// Phase 10 tests — requirement lifecycle + versioning + audit + store.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  seedRegMgmtState,
  serializeRegMgmt,
  deserializeRegMgmt,
  reduceCreateRequirement,
  reduceIssueVersion,
  reduceUpdateDraft,
  reduceActivateVersion,
  reduceDeactivate,
  activeVersionOf,
  auditForRequirement,
  canTransition,
  validateVersionInput,
  type RequirementVersionInput,
} from "@/lib/regmgmt";
import { getRegulatoryRequirements } from "@/lib/data/regulatory";

const ACTOR = "مستخدم حكومي (تجريبي)";
const T0 = "2026-09-01T09:00:00.000Z";
const T1 = "2026-09-02T09:00:00.000Z";
const T2 = "2026-09-03T09:00:00.000Z";

const input = (over: Partial<RequirementVersionInput> = {}): RequirementVersionInput => ({
  titleAr: "اشتراط تجريبي لإدارة دورة الحياة",
  authorityId: "MOHU",
  domainAr: "تجربة ضيف الرحمن",
  trackAr: null,
  season: "1447H",
  effectiveFrom: "1447-02-01",
  officialSourceReferenceAr: "وثيقة رسمية تجريبية",
  officialSourceUrls: ["https://uqu.edu.sa/x"],
  officialSourceLocatorNoteAr: null,
  verificationAreasAr: ["مجال تحقق تجريبي"],
  changeSummaryAr: "إصدار مبدئي",
  ...over,
});

// -- seed / baseline -----------------------------------------------------

test("the seed layers an ACTIVE v1 baseline over every canonical requirement, with no audit", () => {
  const s = seedRegMgmtState();
  const canon = getRegulatoryRequirements();
  assert.equal(s.managed.length, canon.length);
  for (const m of s.managed) {
    assert.equal(m.origin, "CANONICAL_BASELINE");
    assert.equal(m.versions.length, 1);
    assert.equal(m.versions[0].version, 1);
    assert.equal(m.versions[0].status, "ACTIVE");
    assert.equal(m.activeVersion, 1);
    assert.equal(m.draftVersion, null);
  }
  assert.deepEqual(s.audit, []);
  assert.deepEqual(s.notifications, []);
});

// -- lifecycle transition table --------------------------------------

test("lifecycle transition table: DRAFT→ACTIVE, ACTIVE→SUPERSEDED/DEACTIVATED; terminals are terminal", () => {
  assert.equal(canTransition("DRAFT", "ACTIVE"), true);
  assert.equal(canTransition("DRAFT", "DEACTIVATED"), true);
  assert.equal(canTransition("ACTIVE", "SUPERSEDED"), true);
  assert.equal(canTransition("ACTIVE", "DEACTIVATED"), true);
  assert.equal(canTransition("ACTIVE", "DRAFT"), false);
  assert.equal(canTransition("SUPERSEDED", "ACTIVE"), false);
  assert.equal(canTransition("DEACTIVATED", "ACTIVE"), false);
});

test("validateVersionInput rejects missing title / season / summary / bad url", () => {
  assert.ok(validateVersionInput(input({ titleAr: "" })).length > 0);
  assert.ok(validateVersionInput(input({ season: "" })).length > 0);
  assert.ok(validateVersionInput(input({ changeSummaryAr: "" })).length > 0);
  assert.ok(validateVersionInput(input({ officialSourceUrls: ["ftp://x"] })).length > 0);
  assert.deepEqual(validateVersionInput(input()), []);
});

// -- create a brand-new requirement as DRAFT ------------------------

test("create a new requirement → a DRAFT v1 that is NOT active and NOT canonical truth", () => {
  const s0 = seedRegMgmtState();
  const r = reduceCreateRequirement(s0, "GOV-NEW-001", input(), ACTOR, T0);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const m = r.state.managed.find((x) => x.requirementId === "GOV-NEW-001")!;
  assert.equal(m.origin, "GOVERNMENT_MANAGED");
  assert.equal(m.versions.length, 1);
  assert.equal(m.versions[0].status, "DRAFT");
  assert.equal(m.activeVersion, null); // a DRAFT never becomes effective regulatory truth
  assert.equal(m.draftVersion, 1);
  // audit recorded the creation
  const aud = auditForRequirement(r.state.audit, "GOV-NEW-001");
  assert.equal(aud.length, 1);
  assert.equal(aud[0].action, "REQUIREMENT_CREATED");
});

test("a canonical getRegulatoryRequirements() is never mutated by requirement management", () => {
  const before = JSON.stringify(getRegulatoryRequirements());
  const s0 = seedRegMgmtState();
  const r = reduceCreateRequirement(s0, "GOV-NEW-XYZ", input(), ACTOR, T0);
  assert.equal(r.ok, true);
  assert.equal(JSON.stringify(getRegulatoryRequirements()), before);
});

// -- activation supersedes the prior ACTIVE, keeps history ---------

test("issuing + activating a new version preserves the old version (SUPERSEDED, not deleted)", () => {
  let s = seedRegMgmtState();
  const rid = "HAJ-EXP-05";
  const before = s.managed.find((m) => m.requirementId === rid)!;
  assert.equal(before.versions.length, 1);

  const r1 = reduceIssueVersion(
    s,
    rid,
    input({ titleAr: before.identityTitleAr, changeSummaryAr: "تحديث صياغة مجالات التحقق", effectiveFrom: "1447-05-01" }),
    ACTOR,
    T1,
  );
  assert.equal(r1.ok, true);
  if (!r1.ok) return;
  s = r1.state;
  let m = s.managed.find((x) => x.requirementId === rid)!;
  assert.equal(m.versions.length, 2);
  assert.equal(m.draftVersion, 2);
  assert.equal(m.activeVersion, 1); // v1 still the effective truth until v2 is activated

  const r2 = reduceActivateVersion(s, rid, 2, ACTOR, T2);
  assert.equal(r2.ok, true);
  if (!r2.ok) return;
  s = r2.state;
  m = s.managed.find((x) => x.requirementId === rid)!;
  assert.equal(m.versions.length, 2); // nothing deleted
  const v1 = m.versions.find((v) => v.version === 1)!;
  const v2 = m.versions.find((v) => v.version === 2)!;
  assert.equal(v1.status, "SUPERSEDED");
  assert.equal(v1.supersededByVersion, 2);
  assert.equal(v1.effectiveUntil, "1447-05-01"); // stays attributable to its effective period
  assert.equal(v2.status, "ACTIVE");
  assert.equal(m.activeVersion, 2);
  assert.equal(activeVersionOf(m)!.version, 2);

  // audit preserved across both actions, newest first
  const aud = auditForRequirement(s.audit, rid);
  const actions = aud.map((a) => a.action);
  assert.ok(actions.includes("VERSION_ISSUED"));
  assert.ok(actions.includes("VERSION_SUPERSEDED"));
  assert.ok(actions.includes("VERSION_ACTIVATED"));
});

test("activation requires an effective date; without one it fails safely", () => {
  let s = seedRegMgmtState();
  const rid = "HAJ-EXP-05";
  const r1 = reduceIssueVersion(s, rid, input({ effectiveFrom: null, changeSummaryAr: "بدون تاريخ" }), ACTOR, T1);
  assert.equal(r1.ok, true);
  if (!r1.ok) return;
  s = r1.state;
  const r2 = reduceActivateVersion(s, rid, 2, ACTOR, T2);
  assert.equal(r2.ok, false);
  if (r2.ok) return;
  assert.match(r2.errorAr, /تاريخ السريان/);
});

test("an invalid lifecycle transition fails safely (activate a non-draft; second open draft)", () => {
  let s = seedRegMgmtState();
  const rid = "HAJ-EXP-05";
  // activating the ACTIVE baseline v1 is not allowed
  const bad = reduceActivateVersion(s, rid, 1, ACTOR, T2);
  assert.equal(bad.ok, false);

  const r1 = reduceIssueVersion(s, rid, input({ changeSummaryAr: "أولى" }), ACTOR, T1);
  assert.equal(r1.ok, true);
  if (!r1.ok) return;
  s = r1.state;
  // a second concurrent draft is refused
  const r2 = reduceIssueVersion(s, rid, input({ changeSummaryAr: "ثانية" }), ACTOR, T1);
  assert.equal(r2.ok, false);
});

// -- deactivation preserves history --------------------------------

test("deactivation keeps the version in history (DEACTIVATED, effectiveUntil set), never deletes", () => {
  let s = seedRegMgmtState();
  const rid = "HAJ-EXP-04";
  const r = reduceDeactivate(s, rid, ACTOR, T2, "1447-06-01", "لم يعد مطلوبًا هذا الموسم");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  s = r.state;
  const m = s.managed.find((x) => x.requirementId === rid)!;
  assert.equal(m.versions.length, 1);
  assert.equal(m.versions[0].status, "DEACTIVATED");
  assert.equal(m.versions[0].effectiveUntil, "1447-06-01");
  assert.equal(m.activeVersion, null);
  const aud = auditForRequirement(s.audit, rid);
  assert.equal(aud[0].action, "REQUIREMENT_DEACTIVATED");
  assert.match(aud[0].summaryAr, /1447-06-01/);
  // a deactivated requirement cannot spawn a new version
  const r2 = reduceIssueVersion(s, rid, input(), ACTOR, T2);
  assert.equal(r2.ok, false);
});

test("updating a DRAFT records SOURCE_CHANGED / EFFECTIVE_DATE_CHANGED audit when they actually change", () => {
  let s = seedRegMgmtState();
  const rid = "HAJ-EXP-05";
  const r1 = reduceIssueVersion(s, rid, input({ changeSummaryAr: "مسودة" }), ACTOR, T1);
  assert.equal(r1.ok, true);
  if (!r1.ok) return;
  s = r1.state;
  const r2 = reduceUpdateDraft(
    s,
    rid,
    2,
    input({ changeSummaryAr: "مسودة", officialSourceReferenceAr: "وثيقة أخرى", effectiveFrom: "1447-07-01" }),
    ACTOR,
    T2,
  );
  assert.equal(r2.ok, true);
  if (!r2.ok) return;
  const aud = auditForRequirement(r2.state.audit, rid).map((a) => a.action);
  assert.ok(aud.includes("DRAFT_UPDATED"));
  assert.ok(aud.includes("SOURCE_CHANGED"));
  assert.ok(aud.includes("EFFECTIVE_DATE_CHANGED"));
});

// -- store persistence: versioned envelope + guard -----------------

test("regmgmt store: a valid envelope round-trips; wrong version / bad shape are rejected to the seed", () => {
  const s = seedRegMgmtState();
  const round = deserializeRegMgmt(serializeRegMgmt(s), seedRegMgmtState());
  assert.equal(round.rejected, false);
  assert.equal(round.state.managed.length, s.managed.length);

  assert.equal(deserializeRegMgmt("", seedRegMgmtState()).reason, "empty");
  assert.equal(deserializeRegMgmt("{not json", seedRegMgmtState()).reason, "unparseable");
  assert.equal(deserializeRegMgmt(JSON.stringify({ a: 1 }), seedRegMgmtState()).reason, "not_an_envelope");
  assert.equal(
    deserializeRegMgmt(JSON.stringify({ schemaVersion: 99, state: s }), seedRegMgmtState()).reason,
    "version_mismatch",
  );
  assert.equal(
    deserializeRegMgmt(
      JSON.stringify({ schemaVersion: 1, state: { managed: "x", audit: [], notifications: [] } }),
      seedRegMgmtState(),
    ).reason,
    "bad_shape",
  );
});
