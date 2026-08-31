// =============================================================================
// Phase 11 tests — product-UI contracts (source-level + pure helpers).
// The repo test runner covers `src/lib/**`; UI guarantees are pinned here.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  show,
  officialWeightText,
  STATUS_LABEL_AR,
  APPLICABILITY_LABEL_AR,
  READINESS_INDEX_AR,
  VERIFICATION_COVERAGE_AR,
} from "@/lib/ui/status";
import { displayRequirementId, getRegulatoryRequirements } from "@/lib/data/regulatory";

const ROOT = path.resolve(import.meta.dirname, "../../../..");

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const full = path.join(dir, e);
    if (statSync(full).isDirectory()) {
      if (/node_modules|__tests__/.test(full)) continue;
      out.push(...walk(full, exts));
    } else if (exts.some((x) => full.endsWith(x))) out.push(full);
  }
  return out;
}

const APP_FILES = [
  ...walk(path.join(ROOT, "src/app"), [".tsx"]),
  ...walk(path.join(ROOT, "src/components"), [".tsx"]),
].map((p) => ({ rel: path.relative(ROOT, p), text: readFileSync(p, "utf8") }));

const PICTO = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{2B05}-\u{2B07}\u{25B2}\u{25BC}\u{25B6}\u{25C0}]/u;

// -- 1. no Unicode / color emoji in any active UI file ---------------

test("no Unicode/color emoji in any src/app or src/components file", () => {
  const bad = APP_FILES.filter((f) => PICTO.test(f.text)).map((f) => f.rel);
  assert.deepEqual(bad, []);
});

// -- 2. canonical readiness/coverage terminology, no Official Score ---

test("the approved canonical terms are the ones wired", () => {
  assert.equal(READINESS_INDEX_AR, "مؤشر جاهزية امتثال");
  assert.equal(VERIFICATION_COVERAGE_AR, "نسبة التحقق");
});

test("no 'Official Score' / 'الدرجة الرسمية' anywhere in the UI", () => {
  const bad = APP_FILES.filter(
    (f) => /official\s*score/i.test(f.text) || f.text.includes("الدرجة الرسمية"),
  ).map((f) => f.rel);
  assert.deepEqual(bad, []);
});

// -- 3. no stale Figma mock KPI values on the rebuilt hero screens ---

test("dashboard / compliance / mission-control carry no stale 71 or 73 mock KPI", () => {
  const hero = APP_FILES.filter((f) =>
    /src\/app\/(company\/dashboard|company\/compliance\/page|ministry\/control-center)/.test(f.rel),
  );
  assert.ok(hero.length >= 3);
  for (const f of hero) {
    assert.equal(/\b71\s*\/\s*100\b|71 من 100|\b73\s*\/\s*100\b|73 من 100/.test(f.text), false, f.rel);
    // and they bind to a canonical hook, not a hardcoded number
  }
  const dash = hero.find((f) => f.rel.includes("company/dashboard"))!;
  assert.ok(dash.text.includes("useCompanyCompliance"));
  const mc = hero.find((f) => f.rel.includes("control-center"))!;
  assert.ok(mc.text.includes("useGovernmentPortfolio"));
  assert.equal(mc.text.includes("getMinistryCompanies"), false);
});

// -- 4. no raw internal enum leaked as user-facing UI text ----------

test("no raw internal engineering enum is rendered in the UI", () => {
  const RAW = [
    "AI_PROVIDER",
    "CORPUS_LOADED",
    "GUARDRAIL_REJECTED",
    "PROVIDER_ERROR",
    "PENDING_LOCAL_INGESTION",
    "AI_UNAVAILABLE",
    "SCHEMA_VALIDATION_FAILED",
  ];
  const offenders: string[] = [];
  for (const f of APP_FILES) {
    for (const r of RAW) {
      if (f.text.includes(r)) offenders.push(`${f.rel}:${r}`);
    }
  }
  assert.deepEqual(offenders, []);
});

// -- 5. standards route redirects to the canonical requirements surface --

test("/ministry/standards redirects to /ministry/requirements", () => {
  const src = readFileSync(path.join(ROOT, "src/app/ministry/standards/page.tsx"), "utf8");
  assert.match(src, /redirect\(["']\/ministry\/requirements["']\)/);
});

test("the Phase 10 government requirement-management routes still exist", () => {
  for (const p of [
    "src/app/ministry/requirements/page.tsx",
    "src/app/ministry/requirements/new/page.tsx",
    "src/app/ministry/requirements/[id]/page.tsx",
    "src/app/ministry/reports/page.tsx",
  ]) {
    assert.ok(statSync(path.join(ROOT, p)).isFile(), p);
  }
});

// -- 6. null/missing never renders as a fake zero ------------------

test("show(): null/undefined → '—', 0 stays '0'", () => {
  assert.equal(show(null), "—");
  assert.equal(show(undefined), "—");
  assert.equal(show(0), "0");
  assert.equal(show(64), "64");
});

test("status + applicability label maps are complete and Arabic", () => {
  assert.equal(STATUS_LABEL_AR.COMPLIANT, "ملتزم");
  assert.equal(STATUS_LABEL_AR.PARTIALLY_COMPLIANT, "ملتزم جزئيًا");
  assert.equal(STATUS_LABEL_AR.NON_COMPLIANT, "غير ملتزم");
  assert.equal(STATUS_LABEL_AR.PENDING_VERIFICATION, "بانتظار التحقق");
  assert.equal(STATUS_LABEL_AR.INSUFFICIENT_DATA, "بيانات غير كافية");
  assert.equal(STATUS_LABEL_AR.NOT_APPLICABLE, "لا ينطبق");
  assert.equal(APPLICABILITY_LABEL_AR.APPLICABLE, "منطبق");
  for (const v of [...Object.values(STATUS_LABEL_AR), ...Object.values(APPLICABILITY_LABEL_AR)]) {
    assert.equal(/[A-Za-z_]/.test(v), false, `not a raw enum: ${v}`);
  }
});

// -- 7. company role unchanged; no self-registration ------------

test("company entry role stays COMPANY_REPRESENTATIVE and landing has no self-registration", () => {
  const landing = readFileSync(path.join(ROOT, "src/app/page.tsx"), "utf8");
  assert.ok(landing.includes("COMPANY_ENTRY_ROLE"));
  assert.equal(landing.includes("سجل الآن"), false);
  assert.equal(landing.includes("ROLE_OPTIONS"), false);
  const code = landing.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.equal(/register|sign\s*up|إنشاء حساب/i.test(code), false);
});

// -- 8. official weight = published regulatory metadata, never invented -------

test("officialWeightText(): a published percent renders, null renders '—', never invented", () => {
  assert.equal(officialWeightText(20), "20%");
  assert.equal(officialWeightText(null), "—");
  assert.equal(officialWeightText(undefined), "—");
  assert.equal(officialWeightText(0), "0%");
});

test("HAJ-EXP-01…05 carry the VERIFIED published 20% within-track weight; the other 10 publish none", () => {
  const reqs = getRegulatoryRequirements();
  const exp = reqs.filter((r) => /^HAJ-EXP-0[1-5]$/.test(r.id));
  assert.equal(exp.length, 5);
  for (const r of exp) {
    assert.ok(r.officialWeight, `${r.id} must carry an official weight`);
    assert.equal(r.officialWeight!.withinTrackWeightPercent, 20, `${r.id} within-track weight`);
    assert.equal(officialWeightText(r.officialWeight!.withinTrackWeightPercent), "20%");
  }
  for (const r of reqs.filter((x) => !/^HAJ-EXP-0[1-5]$/.test(x.id))) {
    assert.equal(r.officialWeight, null, `${r.id} publishes no official weight`);
  }
  assert.equal(officialWeightText(null), "—");
});

test("the requirement cards read the official weight, not a legacy demo `weight` field", () => {
  for (const p of [
    "src/components/requirements/RequirementCard.tsx",
    "src/components/requirements/CanonicalRequirementCard.tsx",
  ]) {
    const src = readFileSync(path.join(ROOT, p), "utf8");
    assert.match(src, /officialWeightText|OFFICIAL_WEIGHT_LABEL_AR/, p);
    assert.equal(/\{requirement\.weight\}/.test(src), false, `${p} must not print requirement.weight`);
    assert.equal(src.includes("(تكوين تجريبي)"), false, `${p} must not qualify weight as demo`);
  }
});

// -- 9. readiness value is never hidden by its tone/colour -------------------

test("no screen gates a readiness value on its tone (tone must not decide existence)", () => {
  const offenders = APP_FILES.filter((f) =>
    /tone\s*===\s*["']warning["']\s*\?\s*null/.test(f.text.replace(/\s+/g, " ")) ||
    /["']warning["']\s*\?\s*null\s*:\s*readiness/.test(f.text.replace(/\s+/g, " ")),
  ).map((f) => f.rel);
  assert.deepEqual(offenders, []);
});

test("the readiness Donut is fed by availability, not by label tone", () => {
  for (const p of [
    "src/app/company/dashboard/page.tsx",
    "src/app/company/compliance/page.tsx",
  ]) {
    const src = readFileSync(path.join(ROOT, p), "utf8").replace(/\s+/g, " ");
    assert.match(src, /Donut[^>]*value=\{\s*readinessAvailable\s*\?\s*readinessValue\s*:\s*null\s*\}/, p);
  }
});

// -- 10. the company compliance UI represents the whole canonical universe ---

test("company compliance renders every authority's requirements, not only the 5 experience criteria", () => {
  const src = readFileSync(path.join(ROOT, "src/app/company/compliance/page.tsx"), "utf8");
  assert.match(src, /authoritiesView\.map/);
  assert.match(src, /canonicalRequirements/);
  assert.match(src, /CanonicalRequirementCard/);
  // it must NOT destructure the legacy 5-card `requirements` array from the hook
  const destructure = src.match(/const\s*\{([\s\S]*?)\}\s*=\s*\n?\s*useCompanyCompliance\(\)/);
  assert.ok(destructure, "expected a useCompanyCompliance() destructure");
  assert.equal(/(^|[\s,{])requirements([\s,}])/.test(destructure![1]), false);
});

test("dashboard criteria overview is scoped/labelled to the canonical universe", () => {
  const src = readFileSync(path.join(ROOT, "src/app/company/dashboard/page.tsx"), "utf8");
  assert.match(src, /authoritiesView|canonicalRequirements/);
});

// -- 11. legacy CR-00x is never the primary requirement identifier ----------

test("displayRequirementId maps a legacy CR-00x reference to its canonical ID", () => {
  assert.equal(displayRequirementId("CR-001"), "HAJ-EXP-01");
  assert.equal(displayRequirementId("CR-003"), "HAJ-EXP-03");
  assert.equal(displayRequirementId("HAJ-EXP-02"), "HAJ-EXP-02");
  assert.equal(displayRequirementId("MOH-01"), "MOH-01");
  assert.equal(displayRequirementId("does-not-exist"), "does-not-exist");
});

test("every surface that renders a demo requirement reference maps it through displayRequirementId", () => {
  for (const p of [
    "src/components/alerts/AlertCard.tsx",
    "src/components/decision/DecisionResult.tsx",
    "src/app/company/dashboard/page.tsx",
    "src/app/company/improvement-plan/page.tsx",
    "src/app/ministry/reviews/page.tsx",
  ]) {
    const src = readFileSync(path.join(ROOT, p), "utf8");
    assert.match(src, /displayRequirementId/, `${p} must canonicalise the id it shows`);
    // no raw .requirementId rendered as visible text (a React key={} is fine)
    assert.equal(
      /(>|—|·|\bمتطلب |\bمعيار )\s*\{[a-z]+\.requirementId\}|\{[a-z]+\.requirementId\}\s*(—|<|·)/.test(src),
      false,
      `${p} must not print a raw .requirementId as text`,
    );
  }
});

test("no active UI file hardcodes a CR-00x token as a visible identifier", () => {
  const offenders = APP_FILES.filter((f) => /["'>\s]CR-0\d{2}\b/.test(f.text)).map((f) => f.rel);
  assert.deepEqual(offenders, []);
});
