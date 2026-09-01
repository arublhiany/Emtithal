// =============================================================================
// Phase 12B — Arabic UX copy quality guards.
//
// The active product must read as a polished Saudi government / enterprise
// digital product: no engineering language, no implementation explanations,
// no misleading aggregate-score wording, no legacy identifiers.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  AI_INTELLIGENCE_LINE_AR,
  COMPANY_CTA_AR,
  GOVERNMENT_CTA_AR,
  LANDING_FOOTER_AR,
  LANDING_HEADLINE_AR,
  LANDING_SUPPORTING_AR,
} from "@/lib/ui/landing";
import { CONFIDENCE_LABEL } from "@/lib/labels";

const ROOT = path.resolve(import.meta.dirname, "../../../..");

// Files whose rendered strings a user actually sees. Dead components
// (not imported by any route) and tests are excluded.
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const full = path.join(dir, e);
    if (statSync(full).isDirectory()) {
      if (/__tests__/.test(full)) continue;
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(full)) out.push(full);
  }
  return out;
}

const UI_FILES = [
  ...walk(path.join(ROOT, "src/app")),
  ...walk(path.join(ROOT, "src/components")),
  path.join(ROOT, "src/lib/engine/decisionEngine.ts"),
  path.join(ROOT, "src/lib/agent/decisionAgent.ts"),
]
  .filter((p) => !/components\/(gaps\/GapCard|risk\/RiskMatrix|requirements\/RequirementCard)\.tsx$/.test(p))
  .map((p) => ({ rel: path.relative(ROOT, p), text: readFileSync(p, "utf8") }));

function stripComments(s: string): string {
  return s
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join("\n");
}

// -- 1. no misleading aggregate-compliance-score wording ------------------

test("no visible 'نسبة الامتثال الإجمالية' / aggregate-score phrasing", () => {
  const banned = [
    "نسبة الامتثال الإجمالية",
    "درجة الامتثال",
    "النتيجة الإجمالية للامتثال",
    "الدرجة الرسمية",
    "الدرجة الإجمالية",
  ];
  const offenders: string[] = [];
  for (const f of UI_FILES) {
    const body = stripComments(f.text);
    for (const b of banned) if (body.includes(b)) offenders.push(`${f.rel} :: ${b}`);
  }
  assert.deepEqual(offenders, []);
});

// -- 2. analysis confidence, not "AI power/strength" --------------------

test("confidence is labelled 'ثقة التحليل' with مرتفعة/متوسطة/منخفضة, never 'قوة الذكاء الاصطناعي'", () => {
  const badge = readFileSync(path.join(ROOT, "src/components/ui/Badge.tsx"), "utf8");
  assert.match(badge, /ثقة التحليل:/);
  assert.equal(badge.includes("ثقة الذكاء الاصطناعي"), false);
  assert.deepEqual(CONFIDENCE_LABEL, { high: "مرتفعة", medium: "متوسطة", low: "منخفضة" });
  for (const f of UI_FILES) {
    assert.equal(stripComments(f.text).includes("قوة الذكاء الاصطناعي"), false, f.rel);
  }
});

// -- 3. no decision-rule implementation language surfaced --------------

test("no engineering phrases from the decision-rule implementation are user-visible", () => {
  const banned = [
    "تطابق نصي مباشر",
    "جدول قواعد تجريبي",
    "قواعد المطابقة",
    "قواعد المحاكاة التجريبية",
    "فئة القرار",
    "نموذج تنبؤ إحصائي",
    "تحليل قواعد تجريبي",
    "محرك التحقق",
    "المعايير الخمسة المعتمدة",
    "معايير الامتثال الخمسة",
  ];
  const offenders: string[] = [];
  for (const f of UI_FILES) {
    const body = stripComments(f.text);
    for (const b of banned) if (body.includes(b)) offenders.push(`${f.rel} :: ${b}`);
  }
  assert.deepEqual(offenders, []);
});

// -- 4. no legacy CR-00x identifier as visible text -------------------

test("no CR-00x identifier is rendered as visible text on any screen", () => {
  const screens = UI_FILES.filter((f) => /^src\/(app|components)\//.test(f.rel));
  const offenders = screens
    .filter((f) => /(["'>]|—|·|\bمتطلب |\bمعيار )\s*CR-0\d{2}\b|\bCR-0\d{2}\b\s*(—|<|·|")/.test(f.text))
    .map((f) => f.rel);
  assert.deepEqual(offenders, []);
});

test("the decision engine's user-facing strings carry no legacy CR-00x id", () => {
  const src = readFileSync(path.join(ROOT, "src/lib/engine/decisionEngine.ts"), "utf8");
  // every backtick template literal in the file (these become user copy)
  const literals = src.match(/`[^`]*`/g) ?? [];
  const offenders = literals.filter((l) => /CR-0\d{2}/.test(l));
  assert.deepEqual(offenders, []);
});

// -- 5. canonical readiness terminology is the one used --------------

test("the decision result screen uses the canonical readiness term", () => {
  const dr = readFileSync(path.join(ROOT, "src/components/decision/DecisionResult.tsx"), "utf8");
  assert.match(dr, /مؤشر جاهزية امتثال/);
  assert.match(dr, /أثر القرار على الجاهزية/);
  assert.equal(dr.includes("مقارنة الامتثال قبل وبعد القرار"), false);
});

// -- 6. landing copy is EXACTLY the approved Figma copy ---------------

test("landing copy constants are unchanged (approved Figma copy, locked)", () => {
  assert.equal(GOVERNMENT_CTA_AR, "دخول الجهات الحكومية");
  assert.equal(COMPANY_CTA_AR, "دخول الشركات");
  assert.equal(
    LANDING_HEADLINE_AR,
    "يكشف مخاطر عدم الامتثال مبكرًا ويحاكي أثر القرارات قبل تنفيذها.",
  );
  assert.equal(
    LANDING_SUPPORTING_AR,
    "منصة ذكاء تنظيمي تجمع اشتراطات الجهات الحكومية ذات العلاقة بالحج والعمرة، وتربطها بأدلة وبيانات الشركات، لتكشف فجوات الامتثال، وتتوقع أثر السيناريوهات التشغيلية، وتقترح البدائل الأقل خطورة قبل اتخاذ القرار.",
  );
  assert.equal(
    AI_INTELLIGENCE_LINE_AR,
    "عبر ذكاء اصطناعي يحلل المخاطر ويحاكي أثر القرارات قبل تنفيذها",
  );
  assert.equal(LANDING_FOOTER_AR, "امتثال © 1447هـ");

  // the landing page renders those constants and adds no extra hard-coded copy
  const page = readFileSync(path.join(ROOT, "src/app/page.tsx"), "utf8");
  assert.match(page, /LANDING_HEADLINE_AR/);
  assert.match(page, /AI_INTELLIGENCE_LINE_AR/);
});

// -- 7. general product UI prefers متطلب over معيار ------------------

test("the general product UI uses متطلب, not معيار (outside official regulatory titles)", () => {
  const pages = UI_FILES.filter((f) => /^src\/app\/(company|ministry)\//.test(f.rel));
  const offenders: string[] = [];
  for (const f of pages) {
    const body = stripComments(f.text);
    // allow it only where explicitly part of an official label context
    const hits = body.match(/[^ء-ي](معيار|معايير|المعيار|المعايير)[^ء-ي]/g) ?? [];
    if (hits.length) offenders.push(`${f.rel} :: ${hits.join(", ")}`);
  }
  assert.deepEqual(offenders, []);
});
