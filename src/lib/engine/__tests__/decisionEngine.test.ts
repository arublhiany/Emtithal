import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateDecision } from "@/lib/engine/decisionEngine";
import { getRequirements } from "@/lib/data/requirements";
import type { DecisionInput, RequirementImpact } from "@/lib/types";

function impactFor(impacts: RequirementImpact[], id: string) {
  return impacts.find((i) => i.requirementId === id);
}

// -----------------------------------------------------------------------------
// Scenario 1 — increasing shuttle buses (the reported bug)
// -----------------------------------------------------------------------------
test("shuttle-bus increase: maps to CR-001 (guest experience/flow), not to unrelated CR-003/CR-005", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "زيادة عدد الحافلات المكوكية خلال أوقات الذروة",
    category: "service_change",
    descriptionAr:
      "زيادة عدد الحافلات المكوكية بنسبة 15% خلال أوقات الذروة لتقليل وقت الانتظار وتحسين تدفق الحركة.",
    magnitudePercent: 15,
    affectedAreaAr: "نقاط انتظار الحافلات",
  };
  const result = simulateDecision(input, requirements);

  const cr001 = impactFor(result.affectedRequirements, "CR-001");
  assert.ok(cr001, "CR-001 should be linked — the decision's own text matches its guest-experience/wait-time anchors");
  assert.equal(cr001!.includedInScore, true);
  assert.equal(cr001!.direction, "positive");
  assert.ok(cr001!.confidence === "high" || cr001!.confidence === "medium");

  // The previously buggy category-flat mapping linked every "operational" or
  // "service" decision to CR-003 (pilgrim rights) and CR-005 (Happiness
  // Team) regardless of content. Neither has any defensible connection to a
  // shuttle-bus capacity decision, so neither should be counted in the score.
  const cr003 = impactFor(result.affectedRequirements, "CR-003");
  const cr005 = impactFor(result.affectedRequirements, "CR-005");
  assert.ok(!cr003 || cr003.includedInScore === false, "CR-003 must not be confidently linked to a bus-capacity decision");
  assert.ok(!cr005 || cr005.includedInScore === false, "CR-005 must not be confidently linked to a bus-capacity decision");

  // Guardrail: the overall score can only move because of justified (counted) impacts.
  const countedDelta = result.affectedRequirements
    .filter((i) => i.includedInScore)
    .reduce((sum) => sum + 1, 0);
  assert.ok(countedDelta >= 1);
});

// -----------------------------------------------------------------------------
// Scenario 2 — reducing staffing at a service point
// -----------------------------------------------------------------------------
test("staffing reduction with field-monitoring context: justifiably links to CR-004, not automatically to CR-005", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "خفض عدد الموظفين في نقطة استقبال الحجاج",
    category: "staffing_change",
    descriptionAr:
      "تخفيض عدد الموظفين في نقطة الاستقبال بنسبة 20%، مما قد يقلل قدرة الفريق على متابعة ورصد ملاحظات ميدانية عن تجربة الضيوف.",
    magnitudePercent: -20,
    affectedAreaAr: "نقطة استقبال الحجاج",
  };
  const result = simulateDecision(input, requirements);

  const cr004 = impactFor(result.affectedRequirements, "CR-004");
  assert.ok(cr004, "CR-004 should be linked — staffing_change's primary category prior plus explicit field-monitoring wording");
  assert.equal(cr004!.includedInScore, true);
  assert.equal(cr004!.direction, "negative");
  assert.ok(cr004!.delta < 0);

  // Regression guard for the original bug: staffing_change previously gave
  // CR-005 (Happiness Team) the *highest* sensitivity (1.0) unconditionally.
  // A generic staffing cut with no Happiness Team wording must not
  // confidently move CR-005.
  const cr005 = impactFor(result.affectedRequirements, "CR-005");
  assert.ok(!cr005 || cr005.includedInScore === false, "CR-005 must not be confidently linked without Happiness Team-specific content");
});

test("staffing reduction explicitly about the Happiness Team does link to CR-005", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "تقليص عدد أعضاء فريق السعادة الميداني",
    category: "staffing_change",
    descriptionAr: "تقليل عدد الأعضاء المشاركين في جولات فريق السعادة الميدانية بنسبة 25%.",
    magnitudePercent: -25,
    affectedAreaAr: "جولات فريق السعادة",
  };
  const result = simulateDecision(input, requirements);

  const cr005 = impactFor(result.affectedRequirements, "CR-005");
  assert.ok(cr005, "CR-005 should be linked once the decision explicitly names Happiness Team rounds");
  assert.equal(cr005!.includedInScore, true);
  assert.equal(cr005!.direction, "negative");
});

// -----------------------------------------------------------------------------
// Scenario 3 — changing the evidence/documentation process
// -----------------------------------------------------------------------------
test("documentation-process change links to the requirements whose own evidence expectations name documentation", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "تبسيط آلية التوثيق الدوري للفعاليات",
    category: "evidence_process_change",
    descriptionAr: "تقليل تكرار رفع تقارير التوثيق الدورية للفعاليات من أسبوعي إلى شهري.",
    magnitudePercent: -12,
    affectedAreaAr: "دورة توثيق الفعاليات",
  };
  const result = simulateDecision(input, requirements);

  const cr002 = impactFor(result.affectedRequirements, "CR-002");
  const cr005 = impactFor(result.affectedRequirements, "CR-005");
  assert.ok(cr002 && cr002.includedInScore, "CR-002 names implementation documentation in its own evidence expectations");
  assert.ok(cr005 && cr005.includedInScore, "CR-005's own name is literally about documenting Happiness Team activities");
  assert.equal(cr002!.direction, "negative");
  assert.equal(cr005!.direction, "negative");
});

// -----------------------------------------------------------------------------
// Scenario 4 — a decision with no meaningful compliance impact
// -----------------------------------------------------------------------------
test("an unrelated, zero-magnitude decision produces no counted impacts and no score change", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "تحديث تصميم شعار الشركة على الزي الموحد للموظفين الإداريين",
    category: "operational_change",
    descriptionAr: "تحديث تصميم الشعار المطبوع على الزي الموحد لموظفي الإدارة دون أي تغيير تشغيلي آخر.",
    magnitudePercent: 0,
    affectedAreaAr: "الزي الموحد الإداري",
  };
  const result = simulateDecision(input, requirements);

  const counted = result.affectedRequirements.filter((i) => i.includedInScore);
  assert.equal(counted.length, 0, "no requirement has a defensible relationship to a uniform-logo update");
  assert.equal(result.predictedOverallScore, result.currentOverallScore);
  assert.equal(result.confidence, "low");
});

// -----------------------------------------------------------------------------
// Guardrail — an unrelated decision cannot randomly IMPROVE an unrelated criterion
// -----------------------------------------------------------------------------
test("guardrail: a positive-magnitude decision does not spuriously improve a criterion it has no relationship to", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "زيادة عدد الحافلات المكوكية",
    category: "operational_change",
    descriptionAr: "زيادة عدد الحافلات المكوكية بنسبة 15% لتحسين تدفق الحركة وتقليل وقت الانتظار.",
    magnitudePercent: 15,
    affectedAreaAr: "نقاط انتظار الحافلات",
  };
  const result = simulateDecision(input, requirements);

  const cr005 = impactFor(result.affectedRequirements, "CR-005");
  assert.ok(
    !cr005 || (cr005.includedInScore === false && cr005.direction === "uncertain"),
    "CR-005 (Happiness Team) must never be confidently improved by a bus-capacity decision"
  );
});

// -----------------------------------------------------------------------------
// General determinism / shape guarantees (carried over from the previous suite)
// -----------------------------------------------------------------------------
test("simulateDecision: is deterministic given the same input and requirement state", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "قرار اختبار",
    category: "operational_change",
    descriptionAr: "وصف اختبار",
    magnitudePercent: -15,
    affectedAreaAr: "منطقة اختبار",
  };
  const a = simulateDecision(input, requirements);
  const b = simulateDecision(input, requirements);
  assert.equal(a.predictedOverallScore, b.predictedOverallScore);
  assert.deepEqual(
    a.affectedRequirements.map((r) => r.predictedScore),
    b.affectedRequirements.map((r) => r.predictedScore)
  );
});

test("simulateDecision: always produces at least one alternative marked as recommended", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "قرار اختبار",
    category: "guest_experience_process",
    descriptionAr: "إطلاق مبادرة جديدة لتحسين تجربة الضيف",
    magnitudePercent: 10,
    affectedAreaAr: "منطقة اختبار",
  };
  const result = simulateDecision(input, requirements);
  const recommended = result.alternatives.filter((a) => a.isRecommended);
  assert.equal(recommended.length, 1);
});

test("simulateDecision: isSimulatedDemo is always true — never presented as an official determination", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "قرار اختبار",
    category: "guest_experience_process",
    descriptionAr: "إطلاق مبادرة جديدة لتحسين تجربة الضيف",
    magnitudePercent: 10,
    affectedAreaAr: "منطقة اختبار",
  };
  const result = simulateDecision(input, requirements);
  assert.equal(result.isSimulatedDemo, true);
});

// -----------------------------------------------------------------------------
// Fallback — Decision Simulation must keep working if the agent is unavailable
// -----------------------------------------------------------------------------
test("simulateDecision: falls back to a valid, non-crashing zero-impact result if the agent throws", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "زيادة عدد الحافلات المكوكية خلال أوقات الذروة",
    category: "service_change",
    descriptionAr: "زيادة الحافلات لتقليل وقت الانتظار وتحسين تدفق الحركة.",
    magnitudePercent: 15,
    affectedAreaAr: "نقاط انتظار الحافلات",
  };

  const throwingAgent = () => {
    throw new Error("simulated agent failure");
  };

  const result = simulateDecision(input, requirements, throwingAgent);

  assert.equal(result.affectedRequirements.length, 0);
  assert.equal(result.predictedOverallScore, result.currentOverallScore);
  assert.equal(result.isSimulatedDemo, true);
  assert.ok(result.explanationAr.length > 0);
  assert.ok(Array.isArray(result.alternatives) && result.alternatives.length > 0);
});

test("simulateDecision: falls back the same way if the agent returns a malformed (non-array) result", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "قرار اختبار",
    category: "operational_change",
    descriptionAr: "وصف اختبار",
    magnitudePercent: -10,
    affectedAreaAr: "منطقة اختبار",
  };

  // Deliberately malformed (non-array) return, to exercise the fallback's shape guard.
  const malformedAgent = (() => null) as unknown as Parameters<typeof simulateDecision>[2];

  const result = simulateDecision(input, requirements, malformedAgent);

  assert.equal(result.affectedRequirements.length, 0);
  assert.equal(result.predictedOverallScore, result.currentOverallScore);
});

// -----------------------------------------------------------------------------
// Custom decision safe fallback — no fabricated recommendation when a free-text
// decision has no materially affected requirement (regression: "تنفيذ مبادرة
// دعم نفسي" produced 0 impact but still recommended "تأجيل القرار").
// -----------------------------------------------------------------------------

const UNLINKED_CUSTOM_INPUT: DecisionInput = {
  titleAr: "تنفيذ مبادرة دعم نفسي",
  category: "staffing_change",
  descriptionAr: "",
  magnitudePercent: 0,
  affectedAreaAr: "",
  isCustom: true,
};

test("custom decision with no material linkage returns a neutral state, not a recommendation", () => {
  const r = simulateDecision(UNLINKED_CUSTOM_INPUT, getRequirements());

  assert.equal(r.noMaterialImpact, true);
  assert.equal(r.recommendedAlternativeId, "");
  assert.deepEqual(r.alternatives, []);
  assert.deepEqual(r.preventiveActionsAr, []);
  assert.deepEqual(r.positiveImpactsAr, []);
  assert.deepEqual(r.negativeImpactsAr, []);
  assert.deepEqual(r.regulatoryGapsAr, []);
  assert.equal(r.riskLevel, "none");
  // deterministic calculations are untouched — zero movement, not a silent guess
  assert.equal(r.predictedOverallScore, r.currentOverallScore);
});

test("zero mapped impact is phrased as 'لم يتم تحديد أثر', never 'لا يوجد أثر'", () => {
  const r = simulateDecision(UNLINKED_CUSTOM_INPUT, getRequirements());
  assert.match(r.explanationAr, /لم يرتبط القرار الحالي بمتطلبات متأثرة بشكل كافٍ/);
  assert.equal(r.explanationAr.includes("لا يوجد أثر"), false);
  assert.equal(r.confidenceReasonAr.includes("لا يوجد أثر"), false);
});

test("unrelated existing company gaps cannot produce a generic 'defer the decision' recommendation", () => {
  const r = simulateDecision(UNLINKED_CUSTOM_INPUT, getRequirements());
  // no alternative at all — in particular not the "تأجيل القرار" (defer) option
  assert.equal(
    r.alternatives.some((a) => a.id === "defer" || /تأجيل/.test(a.labelAr)),
    false,
  );
  assert.notEqual(r.recommendedAlternativeId, "defer");
});

test("a custom decision that DOES map materially still gets a normal recommendation", () => {
  const r = simulateDecision(
    {
      titleAr: "زيادة عدد الحافلات المكوكية خلال أوقات الذروة",
      category: "service_change",
      descriptionAr:
        "زيادة عدد الحافلات المكوكية لتقليل وقت الانتظار وتحسين تدفق الحركة وتخفيف الازدحام.",
      magnitudePercent: 15,
      affectedAreaAr: "نقاط انتظار الحافلات",
      isCustom: true,
    },
    getRequirements(),
  );
  assert.equal(r.noMaterialImpact, false);
  assert.ok(r.alternatives.length > 0);
  assert.equal(r.alternatives.filter((a) => a.isRecommended).length, 1);
  assert.ok(r.recommendedAlternativeId.length > 0);
});

test("preset scenarios are unchanged: mapped impacts still yield a recommendation and calculations", () => {
  const presetLike: DecisionInput = {
    titleAr: "زيادة عدد الحافلات المكوكية خلال أوقات الذروة",
    category: "service_change",
    descriptionAr:
      "زيادة عدد الحافلات المكوكية لتقليل وقت الانتظار وتحسين تدفق الحركة.",
    magnitudePercent: 15,
    affectedAreaAr: "نقاط انتظار الحافلات",
  };
  for (const input of [presetLike, { ...presetLike, isCustom: false }]) {
    const r = simulateDecision(input, getRequirements());
    assert.equal(r.noMaterialImpact, false);
    assert.equal(r.alternatives.filter((a) => a.isRecommended).length, 1);
    assert.ok(r.affectedRequirements.some((i) => i.includedInScore && i.delta !== 0));
  }

  // the safe fallback is scoped to custom decisions only: a NON-custom decision
  // with no material linkage keeps the legacy behaviour (still recommends).
  const flatNonCustom = simulateDecision(
    { ...UNLINKED_CUSTOM_INPUT, isCustom: false },
    getRequirements(),
  );
  assert.equal(flatNonCustom.noMaterialImpact, false);
  assert.ok(flatNonCustom.alternatives.length > 0);
});
