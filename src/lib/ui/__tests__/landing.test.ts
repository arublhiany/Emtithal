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
  AI_DISCLAIMER_AR,
  COMPANY_ENTRY_ROLE,
  COMPANY_ENTRY_ROLE_LABEL_AR,
  GOVERNMENT_CTA_AR,
  LOGO_ASSET_PATH,
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

// -- AI disclaimer pill present -----------------------------------

test("the approved AI-disclaimer pill is present and concise", () => {
  assert.ok(AI_DISCLAIMER_AR.length > 0 && AI_DISCLAIMER_AR.length <= 140);
  assert.match(AI_DISCLAIMER_AR, /الذكاء الاصطناعي/);
  assert.match(AI_DISCLAIMER_AR, /السلطة التنظيمية/);
  assert.ok(landingSrc.includes("AI_DISCLAIMER_AR"));
});

// -- canonical logo asset --------------------------------------

test("the landing uses the canonical <Logo> asset, not a text/emoji recreation", () => {
  assert.equal(LOGO_ASSET_PATH, "/emtithal-logo.png");
  assert.ok(landingSrc.includes("<Logo"));
  assert.ok(logoSrc.includes("LOGO_ASSET_PATH"));
  assert.ok(logoSrc.includes("next/image"));
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
