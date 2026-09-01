// =============================================================================
// Phase 12B — final UX polish. Targeted regression guards for the 12 fixes.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { formatSeasonAr } from "@/lib/ui/status";
import { getSeedAlerts } from "@/lib/data/alerts";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");

// -- 1. general "معيار" → "متطلب" in alert copy -------------------------

test("seed alert titles use متطلب, not معيار", () => {
  for (const a of getSeedAlerts()) {
    assert.equal(/معيار|معايير/.test(a.titleAr), false, a.titleAr);
    assert.equal(/معيار|معايير/.test(a.descriptionAr), false, a.descriptionAr);
  }
});

// -- 2. aggregate portfolio KPI wording -------------------------------

test("portfolio average KPI reads 'متوسط مؤشر الجاهزية' with no '(تجريبي)'", () => {
  for (const p of ["src/app/ministry/control-center/page.tsx", "src/app/ministry/companies/page.tsx"]) {
    const src = read(p);
    assert.match(src, /label="متوسط مؤشر الجاهزية"/, p);
    assert.equal(/متوسط \$\{READINESS_INDEX_AR\}/.test(src), false, `${p} still builds the label from the glossary const`);
    assert.equal(src.includes("متوسط مؤشر جاهزية امتثال (تجريبي)"), false, p);
  }
});

// -- 3. no duplicate identical applicability pill --------------------

test("requirement cards suppress an applicability chip that duplicates the status label", () => {
  for (const p of [
    "src/components/requirements/CanonicalRequirementCard.tsx",
    "src/app/company/compliance/[id]/page.tsx",
  ]) {
    const src = read(p).replace(/\s+/g, " ");
    assert.match(
      src,
      /APPLICABILITY_LABEL_AR\[[a-z.]+applicability\] !== STATUS_LABEL_AR\[[a-z.]+status\]/,
      `${p} must guard the applicability chip against the status label`,
    );
  }
});

// -- 4. decision simulation ----------------------------------------

test("decision simulation drops 'النتائج حتمية' and states the analysis basis", () => {
  const page = read("src/app/company/decision-simulation/page.tsx");
  assert.equal(page.includes("النتائج حتمية"), false);
  assert.match(page, /يعتمد التحليل على بيانات الشركة الحالية\./);
});

test("DecisionResult labels an uncounted effect as 'أثر محتمل — غير محتسب في المؤشر' and hides its before/after", () => {
  const src = read("src/components/decision/DecisionResult.tsx");
  assert.match(src, /أثر محتمل — غير محتسب في المؤشر/);
  assert.equal(src.includes("أثر غير مؤكد — لم يُحتسب في المؤشر"), false);
  // the numeric before→after / delta block is rendered only for counted effects
  assert.match(
    src.replace(/\s+/g, " "),
    /\{r\.includedInScore \? \( <> <span[^]*?\{r\.currentScore\} ← \{r\.predictedScore\}/,
  );
});

test("the decision engine's uncounted-effect explanation shows no delta number", () => {
  const src = read("src/lib/engine/decisionEngine.ts");
  assert.match(src, /الأثر غير محتسب في المؤشر/);
  assert.match(src, /reasonAr: "يعتمد التحليل على بيانات الشركة الحالية\."/);
  // the not-included branch no longer interpolates `actualDelta` into user text
  const notIncluded = src.slice(src.indexOf("mapping.includedInScore"), src.indexOf("impacts.push"));
  const uncountedLine = notIncluded.split("\n").find((l) => l.includes("مستوى الثقة منخفض"))!;
  assert.equal(/\$\{actualDelta/.test(uncountedLine), false);
});

// -- 5. Arabic season display ------------------------------------

test("formatSeasonAr: 1447H → 1447هـ (display only)", () => {
  assert.equal(formatSeasonAr("1447H"), "1447هـ");
  assert.equal(formatSeasonAr("1447h"), "1447هـ");
  assert.equal(formatSeasonAr("1448H"), "1448هـ");
  assert.equal(formatSeasonAr(null), "—");
  assert.equal(formatSeasonAr(""), "—");
});

test("the visible season fields route through formatSeasonAr", () => {
  for (const p of [
    "src/app/ministry/requirements/[id]/page.tsx",
    "src/app/ministry/reports/page.tsx",
    "src/app/company/research/page.tsx",
    "src/app/company/compliance/[id]/page.tsx",
  ]) {
    assert.match(read(p), /formatSeasonAr\(/, p);
  }
});

// -- 6. reports subtitle wording -------------------------------

test("reports subtitle uses the RTL-safe «—» wording", () => {
  assert.match(
    read("src/app/ministry/reports/page.tsx"),
    /subtitle="تقرير قابل للتصدير مبني على البيانات المعتمدة\. ليس تقييمًا رسميًا، وتظهر القيم غير المتاحة بالرمز «—»\."/,
  );
});

// -- 7. research: labelled source link, not a raw URL ---------------

test("research results link to the source via a labelled button, not raw URL text", () => {
  const src = read("src/app/company/research/page.tsx");
  assert.match(src, /فتح المصدر الرسمي/);
  // the anchor no longer renders the URL string as its visible child
  assert.equal(/>\s*\{r\.officialUrl\}\s*<\/a>/.test(src.replace(/\s+/g, " ")), false);
  // provenance (the citation string) is still shown
  assert.match(src, /\{r\.officialSourceReference\}/);
});

// -- 8. reviews wording + boundary badges -----------------------

test("reviews uses 'اعتراضات على نتائج التحليل' and natural boundary badges", () => {
  const src = read("src/app/ministry/reviews/page.tsx");
  assert.match(src, /اعتراضات على نتائج التحليل/);
  assert.equal(src.includes("اعتراضات على تفسير الذكاء الاصطناعي"), false);

  const kit = read("src/components/ui/kit.tsx");
  assert.equal(kit.includes("نتيجة تحقق حتمية"), false);
  assert.match(kit, /VERIFICATION: \{ label: "نتيجة تحقق"/);
});

// -- 9. alerts wording ----------------------------------------

test("alerts: 'تحديد كمقروء' and the reworded empty state", () => {
  const card = read("src/components/alerts/AlertCard.tsx");
  assert.match(card, /تحديد كمقروء/);
  assert.equal(card.includes("وضع كمقروء"), false);
  assert.match(
    read("src/app/ministry/alerts/page.tsx"),
    /title="لم تُنشأ إشعارات بتغييرات تنظيمية بعد"/,
  );
});

// -- 10. risks wording --------------------------------------

test("risks subtitle: 'لا تُحتسب درجة مخاطر رسمية.'", () => {
  const src = read("src/app/ministry/risks/page.tsx");
  assert.match(src, /لا تُحتسب درجة مخاطر رسمية\./);
  assert.equal(src.includes("لا يُحتسب تصنيف خطر"), false);
});

// -- 11. secondary-text contrast ---------------------------

test("--color-ink-faint is raised for contrast, still lighter than --color-ink-muted", () => {
  const css = read("src/app/globals.css");
  const faint = css.match(/--color-ink-faint:\s*(#[0-9a-fA-F]{6})/)![1].toLowerCase();
  const muted = css.match(/--color-ink-muted:\s*(#[0-9a-fA-F]{6})/)![1].toLowerCase();
  assert.notEqual(faint, "#8b9089", "ink-faint must be darkened from the old too-faint value");
  const lum = (hex: string) =>
    [1, 3, 5].reduce((s, i) => s + parseInt(hex.slice(i, i + 2), 16), 0);
  assert.ok(lum(faint) < lum("#8b9089"), "new ink-faint is darker (more contrast on paper)");
  assert.ok(lum(faint) > lum(muted), "hierarchy preserved: faint stays lighter than muted");
});

// -- 12. landing: no simulated official identity ------------

test("landing carries no simulated Vision 2030 / national identity text", () => {
  const src = read("src/app/page.tsx");
  assert.equal(src.includes("رؤية 2030"), false);
  assert.equal(src.includes("المملكة العربية السعودية"), false);
  // canonical logo + locked copy references intact
  assert.match(src, /<Logo\b/);
  assert.match(src, /LANDING_HEADLINE_AR/);
  assert.match(src, /AI_INTELLIGENCE_LINE_AR/);
});

// -- 13. repetitive "تجريبي" clutter removed; one global "بيئة عرض" marker ----

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const full = path.join(dir, e);
    if (statSync(full).isDirectory()) {
      if (/__tests__/.test(full)) continue;
      out.push(...walkTsx(full));
    } else if (full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

test("exactly one persistent global environment marker ('موسم 1447هـ — بيئة عرض')", () => {
  const shell = read("src/components/layout/AppShell.tsx");
  assert.match(shell, /موسم 1447هـ — بيئة عرض(?!\s*تجريبي)/);
  assert.equal(shell.includes("بيئة عرض تجريبي"), false);
  // the sidebar no longer carries its own "بيئة تجريبية" marker
  const sidebar = read("src/components/layout/Sidebar.tsx");
  assert.equal(sidebar.includes("بيئة تجريبية"), false);
});

test("no repetitive 'تجريبي' clutter in page titles / KPI labels / company titles", () => {
  const stripComments = (s: string) =>
    s.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l.trim())).join("\n");
  const offenders: string[] = [];
  for (const f of [...walkTsx(path.join(ROOT, "src/app")), ...walkTsx(path.join(ROOT, "src/components"))]) {
    if (f.endsWith("AppShell.tsx")) continue; // the one allowed marker
    if (f.endsWith("Badge.tsx")) continue; // DemoConfigBadge kept as a short "بيانات عرض" label
    const body = stripComments(readFileSync(f, "utf8"));
    if (/\(تجريبي\)|تكوين تجريبي|عرض تجريبي|نموذج تجريبي|بيئة تجريبية|بيانات تجريبية|المحفظة التجريبية|الملف التجريبي/.test(body)) {
      offenders.push(path.relative(ROOT, f));
    }
  }
  assert.deepEqual(offenders, []);
});

test("the primary demo company name carries no '(عرض تجريبي)' prefix", () => {
  const src = read("src/lib/data/demo/companyProfile.ts");
  assert.match(src, /legalNameAr:\s*"شركة نموذج امتثال للحج والعمرة"/);
  assert.equal(src.includes("(عرض تجريبي)"), false);
  const gov = read("src/lib/data/demo/governmentPortfolio.ts");
  assert.equal(gov.includes("(تجريبي)"), false);
});

test("trust boundaries that happened to contain 'تجريبي' are NOT lost", () => {
  assert.match(read("src/app/company/compliance/page.tsx"), /لا توجد درجة إجمالية رسمية/);
  assert.match(read("src/app/ministry/companies/page.tsx"), /دون درجة رسمية/);
  assert.match(read("src/app/company/evidence/page.tsx"), /رفع ملف لا يعني التحقق منه/);
  assert.match(read("src/app/company/gaps/page.tsx"), /نقص الأدلة لا يعني عدم امتثال/);
  assert.match(read("src/app/company/research/page.tsx"), /الدراسات تدعم القرار ولا تُعد اشتراطات تنظيمية\./);
});
