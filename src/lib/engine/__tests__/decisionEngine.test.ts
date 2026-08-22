import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateDecision } from "@/lib/engine/decisionEngine";
import { getRequirements } from "@/lib/data/requirements";
import type { DecisionInput } from "@/lib/types";

test("simulateDecision: a staffing cut negatively affects CR-005 (فريق السعادة)", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "خفض عدد الموظفين",
    category: "staffing_change",
    descriptionAr: "تخفيض تجريبي",
    magnitudePercent: -20,
    affectedAreaAr: "نقطة اختبار",
  };
  const result = simulateDecision(input, requirements);

  const cr005Impact = result.affectedRequirements.find((r) => r.requirementId === "CR-005");
  assert.ok(cr005Impact, "CR-005 should be an affected requirement for staffing changes");
  assert.ok(cr005Impact!.delta < 0, "a staffing cut should reduce CR-005's score");
  assert.equal(result.isSimulatedDemo, true);
});

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
    descriptionAr: "وصف اختبار",
    magnitudePercent: 10,
    affectedAreaAr: "منطقة اختبار",
  };
  const result = simulateDecision(input, requirements);
  const recommended = result.alternatives.filter((a) => a.isRecommended);
  assert.equal(recommended.length, 1);
});

test("simulateDecision: a positive-magnitude decision does not report negative impacts as its only outcome", () => {
  const requirements = getRequirements();
  const input: DecisionInput = {
    titleAr: "مبادرة تحسين",
    category: "guest_experience_process",
    descriptionAr: "وصف اختبار",
    magnitudePercent: 20,
    affectedAreaAr: "منطقة اختبار",
  };
  const result = simulateDecision(input, requirements);
  assert.ok(result.positiveImpactsAr.length > 0);
});
