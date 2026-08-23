import { test } from "node:test";
import assert from "node:assert/strict";
import { interpretDecision } from "@/lib/agent/decisionAgent";
import { getRequirements } from "@/lib/data/requirements";
import type { DecisionInput } from "@/lib/types";

function mappingFor(input: DecisionInput, requirementId: string) {
  return interpretDecision(input, getRequirements()).find(
    (m) => m.requirementId === requirementId
  );
}

test("interpretDecision: keyword match + category prior yields High confidence, counted in score", () => {
  const input: DecisionInput = {
    titleAr: "زيادة عدد الحافلات المكوكية خلال أوقات الذروة",
    category: "service_change",
    descriptionAr: "زيادة الحافلات لتقليل وقت الانتظار وتحسين تدفق الحركة.",
    magnitudePercent: 15,
    affectedAreaAr: "نقاط انتظار الحافلات",
  };
  const cr001 = mappingFor(input, "CR-001");
  assert.ok(cr001);
  assert.equal(cr001!.confidence, "high");
  assert.equal(cr001!.includedInScore, true);
  assert.ok(cr001!.sourceRuleAr.length > 0, "must state a source/rule for traceability");
});

test("interpretDecision: keyword match without category support yields Medium confidence, still counted", () => {
  const input: DecisionInput = {
    titleAr: "قرار غير معتاد",
    category: "operational_change", // CR-001 has no category prior under this category
    descriptionAr: "تعديل يذكر تجربة الضيف ورضا الضيف بشكل مباشر.",
    magnitudePercent: 10,
    affectedAreaAr: "منطقة اختبار",
  };
  const cr001 = mappingFor(input, "CR-001");
  assert.ok(cr001);
  assert.equal(cr001!.confidence, "medium");
  assert.equal(cr001!.includedInScore, true);
});

test("interpretDecision: high-tier category prior with no keyword match yields Low confidence, NOT counted", () => {
  const input: DecisionInput = {
    titleAr: "تخفيض عام في نقطة خدمة",
    category: "staffing_change", // CR-004 prior is 0.7 (high tier) under this category
    descriptionAr: "تعديل عام في عدد الموظفين دون أي تفاصيل إضافية.",
    magnitudePercent: -10,
    affectedAreaAr: "نقطة خدمة عامة",
  };
  const cr004 = mappingFor(input, "CR-004");
  assert.ok(cr004, "the category's single high-tier link should still surface as an uncertain possibility");
  assert.equal(cr004!.confidence, "low");
  assert.equal(cr004!.includedInScore, false);
});

test("interpretDecision: no keyword match and low category prior omits the requirement entirely", () => {
  const input: DecisionInput = {
    titleAr: "تحديث تصميم شعار الشركة على الزي الموحد",
    category: "operational_change",
    descriptionAr: "تحديث الشعار المطبوع على الزي الموحد للموظفين الإداريين.",
    magnitudePercent: 0,
    affectedAreaAr: "الزي الموحد الإداري",
  };
  const mappings = interpretDecision(input, getRequirements());
  assert.equal(mappings.length, 0, "no requirement has a defensible relationship to a uniform-logo update");
});

test("interpretDecision: only returns mappings for requirement IDs that exist in the input array — never invents one", () => {
  const requirements = getRequirements();
  const validIds = new Set(requirements.map((r) => r.id));
  const input: DecisionInput = {
    titleAr: "تبسيط آلية التوثيق الدوري للفعاليات",
    category: "evidence_process_change",
    descriptionAr: "تقليل تكرار رفع تقارير التوثيق الدورية للفعاليات.",
    magnitudePercent: -12,
    affectedAreaAr: "دورة توثيق الفعاليات",
  };
  const mappings = interpretDecision(input, requirements);
  assert.ok(mappings.length > 0);
  for (const m of mappings) {
    assert.ok(validIds.has(m.requirementId), `${m.requirementId} must be one of the repo's real requirements`);
  }
});

test("interpretDecision: is deterministic given the same input", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "قرار اختبار",
    category: "guest_experience_process",
    descriptionAr: "إطلاق مبادرة جديدة لتحسين تجربة الضيف",
    magnitudePercent: 10,
    affectedAreaAr: "منطقة اختبار",
  };
  const a = interpretDecision(input, requirements);
  const b = interpretDecision(input, requirements);
  assert.deepEqual(a, b);
});
