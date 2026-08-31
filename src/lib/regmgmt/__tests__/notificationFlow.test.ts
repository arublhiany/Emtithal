// =============================================================================
// Phase 11 — end-to-end regulatory-change notification flow.
//
// Government issues a change → deterministic applicability → scoped
// notifications → the SAME notification is visible to the primary demo company
// (the one the company portal uses) and to no unrelated company.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  analyzeImpact,
  buildRegChangeNotifications,
  seedRegMgmtState,
} from "@/lib/regmgmt";
import { getRequirementByCanonicalId } from "@/lib/data/regulatory";
import { getDemoGovernmentPortfolio } from "@/lib/data/demo/governmentPortfolio";
import { CANONICAL_DEMO_COMPANY_ID } from "@/lib/data/demo/companyProfile";
import { DEMO_COMPANY_ID } from "@/lib/data/company";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const EXPERIENCE_REQ = "HAJ-EXP-01"; // experience-track → applicable to the primary demo company
const NOT_APPLICABLE_VARIANT = "demo-gov-var-03";

function baselineVersion(reqId: string) {
  const m = seedRegMgmtState().managed.find((x) => x.requirementId === reqId)!;
  return m.versions.find((v) => v.version === m.activeVersion)!;
}

function impactForNewVersion() {
  const version = baselineVersion(EXPERIENCE_REQ);
  const ia = analyzeImpact(
    version,
    "NEW_VERSION",
    getDemoGovernmentPortfolio(),
    getRequirementByCanonicalId(EXPERIENCE_REQ),
  );
  const notifs = buildRegChangeNotifications(
    version,
    "NEW_VERSION",
    ia,
    "2026-09-01T00:00:00.000Z",
  );
  return { version, ia, notifs };
}

// -- 1. one canonical identity, shared by both portals ---------------------

test("the company portal and the canonical source agree on the primary demo company id", () => {
  assert.equal(DEMO_COMPANY_ID, CANONICAL_DEMO_COMPANY_ID);
});

test("the government demo portfolio contains exactly one representation of that identity", () => {
  const ids = getDemoGovernmentPortfolio().map((c) => c.profile.companyId);
  assert.ok(ids.includes(CANONICAL_DEMO_COMPANY_ID), "portfolio must include the primary demo company");
  assert.equal(ids.filter((id) => id === CANONICAL_DEMO_COMPANY_ID).length, 1);
});

// -- 2. an applicable change notifies that identity -----------------------

test("an applicable regulatory change notifies the primary demo company under the SAME id", () => {
  const { ia, notifs } = impactForNewVersion();
  const primaryImpact = ia.impacts.find((i) => i.companyId === CANONICAL_DEMO_COMPANY_ID)!;
  assert.equal(primaryImpact.applicability, "APPLICABLE");
  assert.notEqual(primaryImpact.state, "NO_IMPACT");
  assert.equal(primaryImpact.makesNonCompliant, false); // truth boundary preserved

  const forPrimary = notifs.filter((n) => n.companyId === CANONICAL_DEMO_COMPANY_ID);
  assert.equal(forPrimary.length, 1);
  assert.equal(forPrimary[0].requirementId, EXPERIENCE_REQ);
  assert.equal(forPrimary[0].targetHref, `/company/compliance/${EXPERIENCE_REQ}`);
});

// -- 3. /company/alerts filters the reg-change feed by that same id -------

test("/company/alerts filters reg-change notifications by the canonical primary demo id", () => {
  const src = readFileSync(path.join(ROOT, "src/app/company/alerts/page.tsx"), "utf8");
  assert.match(src, /CANONICAL_DEMO_COMPANY_ID/);
  assert.match(
    src.replace(/\s+/g, " "),
    /reg\.notifications .*\.filter\(\(n\) => n\.companyId === CANONICAL_DEMO_COMPANY_ID\)/,
  );

  const { notifs } = impactForNewVersion();
  const shown = notifs.filter((n) => n.companyId === CANONICAL_DEMO_COMPANY_ID);
  assert.equal(shown.length, 1);
});

// -- 4. an unrelated company's change never reaches the company portal ---

test("a NOT_APPLICABLE synthetic company produces no notification and never leaks to the primary company", () => {
  const { ia, notifs } = impactForNewVersion();
  const notApplicable = ia.impacts.find((i) => i.companyId === NOT_APPLICABLE_VARIANT)!;
  assert.equal(notApplicable.applicability, "NOT_APPLICABLE");
  assert.equal(notApplicable.state, "NO_IMPACT");

  assert.equal(
    notifs.some((n) => n.companyId === NOT_APPLICABLE_VARIANT),
    false,
    "no notification for a NOT_APPLICABLE company",
  );
  const foreign = notifs.filter((n) => n.companyId !== CANONICAL_DEMO_COMPANY_ID);
  assert.equal(foreign.some((n) => n.companyId === CANONICAL_DEMO_COMPANY_ID), false);
});

// -- 5. deterministic scoping -------------------------------------------

test("notification scoping is deterministic across repeated runs", () => {
  const scope = () => impactForNewVersion().notifs.map((n) => n.companyId).sort();
  assert.deepEqual(scope(), scope());
  const ids = scope();
  assert.ok(ids.includes(CANONICAL_DEMO_COMPANY_ID));
  assert.ok(!ids.includes(NOT_APPLICABLE_VARIANT));
});
