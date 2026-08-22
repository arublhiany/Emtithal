import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeRequirementScore,
  computeComplianceStatus,
  computeEvidenceStatus,
  computeRiskLevel,
  computeConfidence,
  computeOverallScore,
  computeReadinessLabel,
} from "@/lib/engine/scoringEngine";
import type { EvidenceDimensionAssessment } from "@/lib/types";

function dim(state: EvidenceDimensionAssessment["state"]): EvidenceDimensionAssessment {
  return { key: "execution", labelAr: "التنفيذ", state };
}

test("computeRequirementScore: all dimensions found = 100", () => {
  const dims = Array.from({ length: 5 }, () => dim("found"));
  assert.equal(computeRequirementScore(dims), 100);
});

test("computeRequirementScore: all dimensions missing = 0", () => {
  const dims = Array.from({ length: 5 }, () => dim("missing"));
  assert.equal(computeRequirementScore(dims), 0);
});

test("computeRequirementScore: mixed dimensions matches CR-002 seed (70)", () => {
  const dims = [dim("found"), dim("found"), dim("unclear"), dim("found"), dim("missing")];
  // found(20) + found(20) + unclear(10) + found(20) + missing(0) = 70
  assert.equal(computeRequirementScore(dims), 70);
});

test("computeRequirementScore is deterministic and reproducible", () => {
  const dims = [dim("found"), dim("unclear"), dim("pending_verification"), dim("found"), dim("missing")];
  const a = computeRequirementScore(dims);
  const b = computeRequirementScore(dims);
  assert.equal(a, b);
});

test("computeComplianceStatus: >=85 is compliant", () => {
  const dims = Array.from({ length: 5 }, () => dim("found"));
  assert.equal(computeComplianceStatus(90, dims), "compliant");
});

test("computeComplianceStatus: 60-84 is partially_compliant", () => {
  const dims = [dim("found"), dim("found"), dim("unclear"), dim("found"), dim("missing")];
  assert.equal(computeComplianceStatus(70, dims), "partially_compliant");
});

test("computeComplianceStatus: 1-59 is non_compliant", () => {
  const dims = [dim("found"), dim("unclear"), dim("missing"), dim("unclear"), dim("missing")];
  assert.equal(computeComplianceStatus(40, dims), "non_compliant");
});

test("computeComplianceStatus: all missing is not_assessed regardless of score", () => {
  const dims = Array.from({ length: 5 }, () => dim("missing"));
  assert.equal(computeComplianceStatus(0, dims), "not_assessed");
});

test("computeEvidenceStatus: any missing dimension yields 'missing'", () => {
  const dims = [dim("found"), dim("found"), dim("found"), dim("found"), dim("missing")];
  assert.equal(computeEvidenceStatus(dims), "missing");
});

test("computeEvidenceStatus: all found yields 'verified'", () => {
  const dims = Array.from({ length: 5 }, () => dim("found"));
  assert.equal(computeEvidenceStatus(dims), "verified");
});

test("computeRiskLevel: critical gate below 50 is critical", () => {
  const dims = [dim("found"), dim("unclear"), dim("missing"), dim("unclear"), dim("missing")];
  assert.equal(computeRiskLevel(40, true, dims), "critical");
});

test("computeRiskLevel: same score without critical gate is high, not critical", () => {
  const dims = [dim("found"), dim("unclear"), dim("missing"), dim("unclear"), dim("missing")];
  assert.equal(computeRiskLevel(40, false, dims), "high");
});

test("computeRiskLevel: high score with clean evidence is low", () => {
  const dims = Array.from({ length: 5 }, () => dim("found"));
  assert.equal(computeRiskLevel(95, false, dims), "low");
});

test("computeConfidence: two or more missing dimensions is low confidence", () => {
  const dims = [dim("found"), dim("missing"), dim("missing"), dim("found"), dim("found")];
  const result = computeConfidence(dims);
  assert.equal(result.confidence, "low");
});

test("computeConfidence: all found is high confidence", () => {
  const dims = Array.from({ length: 5 }, () => dim("found"));
  assert.equal(computeConfidence(dims).confidence, "high");
});

test("computeOverallScore: equal weights average the scores", () => {
  const { overallScore } = computeOverallScore([
    { id: "A", weight: 20, score: 90 },
    { id: "B", weight: 20, score: 70 },
    { id: "C", weight: 20, score: 40 },
    { id: "D", weight: 20, score: 65 },
    { id: "E", weight: 20, score: 90 },
  ]);
  // (90+70+40+65+90)/5 = 71
  assert.equal(overallScore, 71);
});

test("computeOverallScore: weighted contribution matches spec example (20% weight, 90% score = 18 contribution)", () => {
  const { contributions } = computeOverallScore([{ id: "A", weight: 20, score: 90 }]);
  assert.equal(contributions[0].weightedContribution, 18);
});

test("computeReadinessLabel: unresolved critical gate always forces critical tone, even with a high score", () => {
  const result = computeReadinessLabel(95, true);
  assert.equal(result.tone, "critical");
});

test("computeReadinessLabel: high score without critical gate is good", () => {
  const result = computeReadinessLabel(90, false);
  assert.equal(result.tone, "good");
});
