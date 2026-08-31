// =============================================================================
// Phase 4 tests — code-level AI guardrails.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SHARED_GUARDRAIL_SYSTEM_PROMPT,
  scanForForbiddenContent,
  scanTextForForbiddenContent,
  withSharedGuardrails,
} from "@/lib/ai/guardrails/sharedGuardrails";

function kinds(value: unknown, ctx = {}) {
  const r = scanForForbiddenContent(value, ctx);
  return r.ok ? [] : r.violations.map((v) => v.kind).sort();
}

test("clean agent-style output passes", () => {
  const r = scanForForbiddenContent({
    requirementIds: ["HAJ-EXP-01"],
    authorityId: "MOHU",
    reason: "The decision affects an operational area linked to this requirement.",
    sources: [],
    confidence: "HIGH",
    unresolved: [],
  });
  assert.equal(r.ok, true);
});

test("attempted compliance status is rejected (key or nested value)", () => {
  assert.deepEqual(kinds({ complianceStatus: "NON_COMPLIANT" }), ["compliance_status_judgment"]);
  assert.deepEqual(kinds({ affectedStatuses: { "HAJ-EXP-01": "COMPLIANT" } }), [
    "compliance_status_judgment",
  ]);
  assert.deepEqual(kinds({ status: "PARTIALLY_COMPLIANT" }), ["compliance_status_judgment"]);
});

test("attempted official weight is rejected (incl. nested track weights)", () => {
  assert.ok(kinds({ officialWeight: 20 }).includes("official_weight"));
  assert.ok(
    kinds({ w: { trackWeightPercent: 3, withinTrackWeightPercent: 20 } }).includes("official_weight"),
  );
});

test("attempted penalty / fine / sanction is rejected", () => {
  assert.deepEqual(kinds({ penalty: "1000 SAR" }), ["penalty"]);
  assert.deepEqual(kinds({ fine: 500 }), ["penalty"]);
  assert.deepEqual(kinds({ sanction: "suspension" }), ["penalty"]);
});

test("attempted internal criticality / critical gate is rejected", () => {
  assert.deepEqual(kinds({ internalCriticality: "CRITICAL" }), ["internal_criticality"]);
  assert.deepEqual(kinds({ criticalGate: true }), ["internal_criticality"]);
});

test("numeric target presented as truth is rejected; a described basis string is not", () => {
  assert.deepEqual(kinds({ targetValue: 320 }), ["target_value_as_truth"]);
  assert.deepEqual(kinds({ requiredPopulation: 45 }), ["target_value_as_truth"]);
  assert.equal(scanForForbiddenContent({ targetValue: "declared: nusukApplicablePersons" }).ok, true);
});

test("asserted integration/connection state is rejected; NOT_CONNECTED is fine", () => {
  assert.deepEqual(kinds({ isConnected: true }), ["integration_state"]);
  assert.deepEqual(kinds({ integrationState: "CONNECTED" }), ["integration_state"]);
  assert.equal(scanForForbiddenContent({ integrationState: "NOT_CONNECTED" }).ok, true);
});

test("invented requirement / authority is rejected when an approved corpus is supplied", () => {
  assert.deepEqual(
    kinds(
      { requirementIds: ["HAJ-EXP-01", "MADE-UP-99"] },
      { approvedRequirementIds: ["HAJ-EXP-01", "HAJ-EXP-02"] },
    ),
    ["invented_requirement"],
  );
  assert.deepEqual(
    kinds({ authorityId: "FAKE_MINISTRY" }, { approvedAuthorityIds: ["MOHU", "MOH"] }),
    ["invented_authority"],
  );
  assert.equal(
    scanForForbiddenContent({ authorityId: "MOHU" }, { approvedAuthorityIds: ["MOHU"] }).ok,
    true,
  );
});

test("forbidden content is detected deep inside nested structures", () => {
  const r = scanForForbiddenContent({
    scenarios: [{ regulatoryEffects: [{ officialWeight: 1 }], notes: [{ penalty: "x" }] }],
  });
  assert.equal(r.ok, false);
  assert.ok((r as { violations: { kind: string }[] }).violations.some((v) => v.kind === "official_weight"));
  assert.ok((r as { violations: { kind: string }[] }).violations.some((v) => v.kind === "penalty"));
});

test("free-text scan flags forbidden field assertions", () => {
  assert.equal(scanTextForForbiddenContent('the "officialWeight": 20 for this').ok, false);
  assert.equal(scanTextForForbiddenContent("internalCriticality = CRITICAL here").ok, false);
  assert.equal(scanTextForForbiddenContent("This requirement needs more evidence.").ok, true);
});

test("withSharedGuardrails('json') wraps the agent prompt with the shared rules + a JSON-only instruction", () => {
  const wrapped = withSharedGuardrails("Do the regulatory retrieval.", "json");
  assert.ok(wrapped.includes(SHARED_GUARDRAIL_SYSTEM_PROMPT));
  assert.ok(wrapped.includes("Do the regulatory retrieval."));
  assert.ok(/ONLY one JSON object/i.test(wrapped));
  assert.equal(/plain text/i.test(wrapped), false);
});

test("withSharedGuardrails('text') wraps the agent prompt with the shared rules + a plain-text instruction", () => {
  const wrapped = withSharedGuardrails("Summarise the readiness gap.", "text");
  assert.ok(wrapped.includes(SHARED_GUARDRAIL_SYSTEM_PROMPT));
  assert.ok(wrapped.includes("Summarise the readiness gap."));
  assert.ok(/plain text/i.test(wrapped));
  assert.equal(/ONLY one JSON object/i.test(wrapped), false);
});

test("the shared guardrail system prompt itself carries no output-format instruction", () => {
  assert.equal(/ONLY one JSON object/i.test(SHARED_GUARDRAIL_SYSTEM_PROMPT), false);
  assert.equal(/plain text/i.test(SHARED_GUARDRAIL_SYSTEM_PROMPT), false);
});
