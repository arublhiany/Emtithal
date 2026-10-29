// =============================================================================
// Phase 10 tests — landing + auth-entry contract (source-level assertions).
// The repo's test runner covers `src/lib/**`; the landing page's guarantees are
// pinned to constants here + a scan of the page source.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  AI_INTELLIGENCE_LINE_AR,
  COMPANY_ENTRY_ROLE,
  COMPANY_ENTRY_ROLE_LABEL_AR,
  GOVERNMENT_CTA_AR,
  LANDING_HEADLINE_AR,
  LANDING_SUPPORTING_AR,
} from "@/lib/ui/landing";
import { COMPANY_ROLE_LABEL } from "@/lib/labels";
import { COMPANY_REPRESENTATIVE_ROLE } from "@/lib/types";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const landingSrc = readFileSync(path.join(ROOT, "src/app/page.tsx"), "utf8");
const logoSrc = readFileSync(path.join(ROOT, "src/components/ui/Logo.tsx"), "utf8");

// -- CTA + role ---------------------------------------------------------

test("government CTA label is exactly 'دخول الجهات الحكومية'", () => {
  assert.equal(GOVERNMENT_CTA_AR, "دخول الجهات الحكومية");
  assert.ok(landingSrc.includes("GOVERNMENT_CTA_AR"));
});

test("the company-facing entry role is the single canonical COMPANY_REPRESENTATIVE", () => {
  assert.equal(COMPANY_ENTRY_ROLE, "company_representative");
  assert.equal(COMPANY_REPRESENTATIVE_ROLE, "company_representative");
  assert.equal(COMPANY_ENTRY_ROLE_LABEL_AR, "ممثل الشركة");
  assert.equal(COMPANY_ROLE_LABEL["company_representative"], "ممثل الشركة");
  // the landing enters as that role with no role picker
  assert.ok(landingSrc.includes("COMPANY_ENTRY_ROLE"));
  assert.equal(/ROLE_OPTIONS|role picker|اختر دورك/.test(landingSrc), false);
});

// -- no self-registration --------------------------------------------

test("the landing has NO self-registration link / affordance", () => {
  // ignore `//` comments — they document the ABSENCE of self-registration
  const code = landingSrc
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");
  assert.equal(code.includes("سجل الآن"), false);
  assert.equal(code.includes("ليس لديك حساب"), false);
  assert.equal(/إنشاء حساب|تسجيل جديد|register|sign\s*up/i.test(code), false);
  assert.equal(/href=["'][^"']*(register|signup|sign-up)/i.test(code), false);
});

// -- owner-approved landing copy (byte-exact) --------------------

test("the three landing copy strings are byte-exact to the owner-approved copy", () => {
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
  // the page renders the small intelligence line; the old long disclaimer is gone
  assert.ok(landingSrc.includes("AI_INTELLIGENCE_LINE_AR"));
  assert.equal(landingSrc.includes("AI_DISCLAIMER_AR"), false);
  assert.equal(landingSrc.includes("لا تحل محل السلطة التنظيمية"), false);
});

// -- canonical logo asset --------------------------------------

test("the landing uses the current product wordmark", () => {
  assert.ok(landingSrc.includes("<Logo"));
  assert.ok(logoSrc.includes("BRAND_NAME_AR"));
  assert.ok(logoSrc.includes("BRAND_NAME_EN"));
  assert.equal(logoSrc.includes("emtithal-logo.png"), false);
  // the old placeholder logo (a green box with the letters "ام") is gone
  assert.equal(landingSrc.includes('>ام<'), false);
  assert.equal(landingSrc.includes("rounded-xl bg-[var(--color-primary)] text-[var(--color-accent-tint)]"), false);
});

// -- no old Figma / MVP mock content -------------------------

test("the landing carries no stale Figma / MVP mock KPI or marketing content", () => {
  for (const stale of ["71 / 100", "71/100", "73/100", "/ 100", "PIPELINE_STEPS", "VALUE_PROPS", "متوسط الامتثال", "كيف تعمل منصة امتثال"]) {
    assert.equal(landingSrc.includes(stale), false, `stale content leaked: ${stale}`);
  }
});

test("the landing implies no external government SSO integration", () => {
  assert.equal(/SSO|single\s*sign|نفاذ الوطني|تكامل حكومي فعلي|OAuth/i.test(landingSrc), false);
});
