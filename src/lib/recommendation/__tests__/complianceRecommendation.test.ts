// =============================================================================
// Phase 12B — per-requirement "توصية امتثال": deterministic, personalised to the
// approved company capability profile, one concise action. Plus the
// content-reduction boundary guards.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  CAPABILITY_ASPECT_BY_REQUIREMENT,
  RECOMMENDATION_BASIS_AR,
  RECOMMENDATION_HEADING_AR,
  buildComplianceRecommendation,
  type ComplianceRecommendationInput,
  type RecommendationCompanyContext,
} from "@/lib/recommendation/complianceRecommendation";
import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");

// The real approved company context (as the detail page assembles it).
const COMPANY: RecommendationCompanyContext = {
  servicesAr: DEMO_COMPANY_PROFILE.servicesAr,
  locationsAr: DEMO_COMPANY_PROFILE.locationsAr,
  workforceSize: DEMO_COMPANY_PROFILE.workforce.count,
  pilgrimsServed: DEMO_COMPANY_PROFILE.pilgrims.count,
  usesExternalProviders: DEMO_COMPANY_PROFILE.declaredFacts.contractsExternalServiceProviders,
  companyResponsibleForCamp: DEMO_COMPANY_PROFILE.declaredFacts.companyResponsibleForCamp,
};

const base: ComplianceRecommendationInput = {
  requirementId: "HAJ-EXP-03",
  titleAr: "ضمان حفظ حقوق ضيف الرحمن",
  status: "PARTIALLY_COMPLIANT",
  applicability: "APPLICABLE",
  isUnresolvedRegulatory: false,
  isCriticalBlocker: false,
  recommendedActionAr: null,
  incompleteEvidenceAr: [],
  company: COMPANY,
};
const rec = (o: Partial<ComplianceRecommendationInput>) =>
  buildComplianceRecommendation({ ...base, ...o });

const CORRECTIVE_VERB = /نفّذ|عالج|أغلِق|استكمل|وفّر|أكمل|حافظ/;
const CAPABILITY_TERMS = /خدمات الشركة|مواقع خدمة الشركة|القوى العاملة|مزوّدي الخدمة|المخيّم/;

// -- framing ------------------------------------------------------

test("framed as 'توصية امتثال', never as an AI recommendation, no model/provider wording", () => {
  assert.equal(RECOMMENDATION_HEADING_AR, "توصية امتثال");
  assert.equal(RECOMMENDATION_BASIS_AR, "مبنية على بيانات الشركة الحالية وقدراتها التشغيلية.");
  const mod = read("src/lib/recommendation/complianceRecommendation.ts");
  assert.equal(/from ["']@\/lib\/ai|fetch\(|https?:\/\//i.test(mod), false); // pure, no AI, no network
  const literals = (mod.match(/"[^"]*"|`[^`]*`/g) ?? []).join(" ");
  assert.equal(/gemini|claude|anthropic|AI_PROVIDER|AI_MODEL|توصية ذكاء اصطناعي/i.test(literals), false);
  assert.equal(read("src/app/company/compliance/[id]/page.tsx").includes("توصية ذكاء اصطناعي"), false);
});

// -- capability personalization is real -------------------------

test("the canonical company capability profile is passed into the builder from the detail page", () => {
  const src = read("src/app/company/compliance/[id]/page.tsx");
  assert.match(src, /import \{ DEMO_COMPANY_PROFILE \} from "@\/lib\/data\/demo\/companyProfile"/);
  assert.match(src, /company:\s*\{/);
  assert.match(src, /servicesAr: DEMO_COMPANY_PROFILE\.servicesAr/);
  assert.match(src, /locationsAr: DEMO_COMPANY_PROFILE\.locationsAr/);
  assert.match(src, /workforceSize: DEMO_COMPANY_PROFILE\.workforce\.count/);
  assert.match(src, /usesExternalProviders:/);
});

test("HAJ-EXP-04 (journey monitoring) scopes the action across the company's real service locations", () => {
  assert.equal(CAPABILITY_ASPECT_BY_REQUIREMENT["HAJ-EXP-04"], "MULTI_LOCATION");
  const action = "رفع سجلات رصد ميداني كاملة.";
  const withCtx = rec({ requirementId: "HAJ-EXP-04", status: "PARTIALLY_COMPLIANT", recommendedActionAr: action });
  const noCtx = buildComplianceRecommendation({
    ...base,
    requirementId: "HAJ-EXP-04",
    recommendedActionAr: action,
    company: undefined,
  });

  assert.notEqual(withCtx.actionAr, noCtx.actionAr, "context must change the action");
  assert.equal(withCtx.capabilityAspectUsed, "MULTI_LOCATION");
  assert.equal(noCtx.capabilityAspectUsed, null);
  // it names the company's ACTUAL locations, not a generic phrase
  for (const loc of DEMO_COMPANY_PROFILE.locationsAr) assert.ok(withCtx.actionAr.includes(loc), loc);
});

test("HAJ-EXP-01 scopes to the services the company actually provides", () => {
  assert.equal(CAPABILITY_ASPECT_BY_REQUIREMENT["HAJ-EXP-01"], "SERVICE_SCOPED");
  const r = rec({ requirementId: "HAJ-EXP-01", recommendedActionAr: "استكمال مؤشر القياس." });
  assert.equal(r.capabilityAspectUsed, "SERVICE_SCOPED");
  for (const s of DEMO_COMPANY_PROFILE.servicesAr) assert.ok(r.actionAr.includes(s), s);
});

test("HAJ-EXP-02 scopes to the company workforce; HAJ-EXP-05 adds provider follow-up", () => {
  const r2 = rec({ requirementId: "HAJ-EXP-02", recommendedActionAr: "تنفيذ برنامج تدريبي." });
  assert.equal(r2.capabilityAspectUsed, "WORKFORCE_SCALED");
  assert.ok(r2.actionAr.includes(String(DEMO_COMPANY_PROFILE.workforce.count)));

  const r5 = rec({ requirementId: "HAJ-EXP-05", recommendedActionAr: "استكمال التقرير الموسمي." });
  assert.equal(r5.capabilityAspectUsed, "PROVIDER_SPLIT"); // company contracts external providers
  assert.match(r5.actionAr, /مزوّدي الخدمة/);
});

// -- personalization is relevant, not forced ------------------

test("a requirement with no capability aspect gets NO company facts inserted", () => {
  assert.equal(CAPABILITY_ASPECT_BY_REQUIREMENT["HAJ-EXP-03"] ?? "NONE", "NONE");
  const r = rec({ requirementId: "HAJ-EXP-03", recommendedActionAr: "رفع سجلات التوعية بالحقوق." });
  assert.equal(r.capabilityAspectUsed, null);
  assert.equal(CAPABILITY_TERMS.test(r.actionAr), false, "no forced company facts");
  assert.equal(r.actionAr, "رفع سجلات التوعية بالحقوق.");
});

test("a scoping clause is dropped when the data does not support it", () => {
  // MULTI_LOCATION but only one location declared → no clause
  const oneLoc = buildComplianceRecommendation({
    ...base,
    requirementId: "HAJ-EXP-04",
    recommendedActionAr: "رفع سجلات الرصد.",
    company: { ...COMPANY, locationsAr: ["مكة المكرمة"] },
  });
  assert.equal(oneLoc.capabilityAspectUsed, null);
  assert.equal(oneLoc.actionAr, "رفع سجلات الرصد.");

  // PROVIDER_SPLIT but company does not contract providers → no clause
  const noProviders = buildComplianceRecommendation({
    ...base,
    requirementId: "HAJ-EXP-05",
    recommendedActionAr: "استكمال التقرير.",
    company: { ...COMPANY, usesExternalProviders: false },
  });
  assert.equal(noProviders.capabilityAspectUsed, null);
});

test("no invented regulatory threshold appears (numbers are contextual, not limits)", () => {
  const r = rec({ requirementId: "HAJ-EXP-02", recommendedActionAr: "تنفيذ برنامج." });
  assert.equal(/الحد الأدنى|يجب ألا يقل|النسبة المطلوبة|العتبة|threshold/.test(r.actionAr), false);
});

// -- per-state safety (unchanged) --------------------------

test("NOT_APPLICABLE → informational, no corrective verb, no company facts", () => {
  const r = rec({ requirementId: "HAJ-EXP-04", applicability: "NOT_APPLICABLE", status: "NOT_APPLICABLE" });
  assert.equal(r.informationalOnly, true);
  assert.equal(r.capabilityAspectUsed, null);
  assert.equal(CORRECTIVE_VERB.test(r.actionAr), false);
  assert.equal(CAPABILITY_TERMS.test(r.actionAr), false);
});

test("regulatory-pending → informational, does not blame or task the company", () => {
  const r = rec({ isUnresolvedRegulatory: true, status: "INSUFFICIENT_DATA" });
  assert.equal(r.informationalOnly, true);
  assert.match(r.actionAr, /على مستوى التنظيم/);
  assert.equal(/نفّذ|عالج|أغلِق الفجوة/.test(r.actionAr), false);
});

test("NON_COMPLIANT critical blocker → priority message, not diluted by a scope clause", () => {
  const r = rec({
    requirementId: "HAJ-EXP-04",
    status: "NON_COMPLIANT",
    isCriticalBlocker: true,
    recommendedActionAr: "نفّذ الإجراء X.",
  });
  assert.match(r.actionAr, /عائق حرج/);
  assert.match(r.actionAr, /أولوية قصوى/);
  assert.equal(r.capabilityAspectUsed, null);
});

test("PARTIALLY_COMPLIANT reuses the approved corrective action, plus a scope clause where relevant", () => {
  const action = "استكمال مؤشر القياس النهائي ورفعه كدليل محدث."; // trailing period
  const r = rec({ requirementId: "HAJ-EXP-01", status: "PARTIALLY_COMPLIANT", recommendedActionAr: action });
  assert.ok(r.actionAr.startsWith("استكمال مؤشر القياس النهائي ورفعه كدليل محدث"));
  assert.equal(r.capabilityAspectUsed, "SERVICE_SCOPED");
  // the approved action's trailing period is absorbed — still ONE sentence
  assert.equal((r.actionAr.match(/[.]/g) ?? []).length, 1);
  assert.ok(r.actionAr.endsWith("."));
});

test("the recommendation is always ONE sentence", () => {
  for (const [rid] of Object.entries(CAPABILITY_ASPECT_BY_REQUIREMENT)) {
    for (const status of [
      "COMPLIANT",
      "PARTIALLY_COMPLIANT",
      "NON_COMPLIANT",
      "PENDING_VERIFICATION",
      "INSUFFICIENT_DATA",
    ] as const) {
      const r = rec({ requirementId: rid, status, recommendedActionAr: "إجراء مرجعي" });
      // no hard line breaks; at most one sentence-final period, and it's the last char
      assert.equal(r.actionAr.includes("\n"), false);
      const periods = (r.actionAr.match(/[.]/g) ?? []).length;
      assert.ok(periods <= 1, `${rid}/${status}: "${r.actionAr}"`);
    }
  }
});

// -- content-reduction guards --------------------------------

test("content reduction kept regulatory provenance + the essential trust boundaries", () => {
  const detail = read("src/app/company/compliance/[id]/page.tsx");
  assert.match(detail, /officialSource\?\.reference/);
  assert.match(detail, /matrixSourceRef/);
  assert.match(detail, /OFFICIAL_WEIGHT_NOTE_AR/);

  assert.match(read("src/app/company/compliance/page.tsx"), /لا توجد درجة إجمالية رسمية/);
  assert.match(read("src/app/company/evidence/page.tsx"), /رفع ملف لا يعني التحقق منه/);
  assert.match(read("src/app/company/gaps/page.tsx"), /نقص الأدلة لا يعني عدم امتثال/);
  assert.match(
    read("src/app/company/research/page.tsx"),
    /الدراسات تدعم القرار ولا تُعد اشتراطات تنظيمية\./,
  );
});

test("overview requirement cards stay concise — no recommendation paragraph", () => {
  const card = read("src/components/requirements/CanonicalRequirementCard.tsx");
  assert.equal(card.includes("توصية امتثال"), false);
  assert.equal(card.includes("buildComplianceRecommendation"), false);
  assert.match(card, /التفاصيل ←/);
});
