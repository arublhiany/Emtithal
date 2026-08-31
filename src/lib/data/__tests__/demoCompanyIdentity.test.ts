// =============================================================================
// Phase 11 — one coherent primary demo company identity across the company
// portal (profile, compliance, evidence, actions, alerts, tickets) and the
// government portfolio.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { CANONICAL_DEMO_COMPANY_ID, DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
import { DEMO_COMPANY_ID, getCompanyProfile } from "@/lib/data/company";
import { getRequirements } from "@/lib/data/requirements";
import { computeCapabilityIndicators } from "@/lib/engine/capabilityEngine";
import { getDemoReadinessValue } from "@/lib/engine/complianceView";
import { getEvidenceRecords } from "@/lib/data/evidence";
import { getSeedActions } from "@/lib/data/actions";
import { getSeedAlerts } from "@/lib/data/alerts";
import { getSeedTickets } from "@/lib/data/tickets";
import { getGaps } from "@/lib/data/gaps";
import { getRisks } from "@/lib/data/risks";
import { getDemoGovernmentPortfolio } from "@/lib/data/demo/governmentPortfolio";

const ROOT = path.resolve(import.meta.dirname, "../../../..");

// -- 1. one canonical id -------------------------------------------------

test("the company portal profile id IS the canonical primary demo company id", () => {
  assert.equal(DEMO_COMPANY_ID, CANONICAL_DEMO_COMPANY_ID);
  assert.equal(getCompanyProfile().id, CANONICAL_DEMO_COMPANY_ID);
  assert.equal(DEMO_COMPANY_PROFILE.companyId, CANONICAL_DEMO_COMPANY_ID);
});

test("the company name shown by the portal comes from the canonical profile source", () => {
  const p = getCompanyProfile();
  assert.equal(p.nameAr, DEMO_COMPANY_PROFILE.legalNameAr);
  assert.equal(/النور/.test(p.nameAr), false); // the retired legacy company name is gone
});

// -- 1b. one fact set: every overlapping fact is derived from the canonical profile

test("the presentation profile's overlapping operational facts match the canonical engine profile", () => {
  const p = getCompanyProfile();
  const c = DEMO_COMPANY_PROFILE;

  assert.equal(p.pilgrimsServed, c.pilgrims.count, "pilgrims served");
  assert.equal(p.workforceSize, c.workforce.count, "workforce size");
  assert.equal(p.serviceLocations, c.locationsAr.length, "service locations count");
  assert.equal(p.city, c.locationsAr[0], "city = first canonical location");
  assert.equal(p.seasonLabel, `موسم ${c.season.replace(/H$/i, "هـ")}`, "season label derived from canonical season");
  assert.match(p.seasonLabel, new RegExp(c.season.replace(/H$/i, "")), "season digits match");
  // the primary demo company is in-scope for the experience track (a fact the engine reads)
  assert.equal(c.declaredFacts.experienceTrackScopeDeclared, true);
});

test("capability indicators are computed from the canonical-derived facts, not a legacy RAW_PROFILE", () => {
  const c = DEMO_COMPANY_PROFILE;
  const workforceSize = c.workforce.count ?? 0;
  const expected = computeCapabilityIndicators(
    {
      pilgrimsServed: c.pilgrims.count ?? 0,
      workforceSize,
      supervisors: Math.ceil(workforceSize / 35),
      serviceLocations: c.locationsAr.length,
    },
    getRequirements(),
    getDemoReadinessValue(),
  );
  assert.deepEqual(getCompanyProfile().capabilityIndicators, expected);
});

test("src/lib/data/company.ts carries no competing hard-coded operational value", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/data/company.ts"), "utf8");
  assert.match(src, /DEMO_COMPANY_PROFILE/);
  // the retired legacy operational literals must be gone
  for (const legacy of ["6200", "260", "RAW_PROFILE"]) {
    assert.equal(src.includes(legacy), false, `company.ts must not contain legacy "${legacy}"`);
  }
  // no hard-coded pilgrims/workforce/locations count assignment
  assert.equal(/pilgrimsServed:\s*\d/.test(src), false);
  assert.equal(/workforceSize:\s*\d/.test(src), false);
  assert.equal(/serviceLocations:\s*\d/.test(src), false);
});

// -- 2. operational demo records align with that identity ---------------

test("evidence / actions / alerts / tickets / gaps / risks all use the canonical company id", () => {
  const groups: Record<string, { companyId: string }[]> = {
    evidence: getEvidenceRecords(),
    actions: getSeedActions(),
    alerts: getSeedAlerts(),
    tickets: getSeedTickets(),
    gaps: getGaps(),
    risks: getRisks(),
  };
  for (const [name, records] of Object.entries(groups)) {
    assert.ok(records.length > 0, `${name} seed is non-empty`);
    for (const r of records) {
      assert.equal(r.companyId, CANONICAL_DEMO_COMPANY_ID, `${name}: ${JSON.stringify(r).slice(0, 60)}`);
    }
  }
});

// -- 3. the government portfolio references the same single identity ----

test("the government portfolio holds exactly one row for the canonical primary company", () => {
  const rows = getDemoGovernmentPortfolio();
  const primary = rows.filter((r) => r.profile.companyId === CANONICAL_DEMO_COMPANY_ID);
  assert.equal(primary.length, 1);
  assert.equal(primary[0].nameAr, DEMO_COMPANY_PROFILE.legalNameAr);
  // the other rows are clearly-labelled synthetic variants, none reusing the id
  for (const r of rows.filter((x) => x.profile.companyId !== CANONICAL_DEMO_COMPANY_ID)) {
    assert.match(r.nameAr, /تجريبي/);
  }
});

// -- 4. no active (non-test) code path uses the retired identity -------

test("no active company-facing code or data path uses the retired 'company-alnoor' identity", () => {
  const roots = ["src/app", "src/components", "src/lib"];
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir)) {
      const full = path.join(dir, e);
      if (statSync(full).isDirectory()) {
        if (full.includes("__tests__")) continue;
        walk(full);
      } else if (/\.(ts|tsx)$/.test(full)) {
        if (readFileSync(full, "utf8").includes("company-alnoor")) {
          offenders.push(path.relative(ROOT, full));
        }
      }
    }
  };
  for (const r of roots) walk(path.join(ROOT, r));
  assert.deepEqual(offenders, []);
});
