// =============================================================================
// Phase 1 integrity tests — versioned demo-store persistence.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  LEGACY_STORAGE_KEYS,
  SCHEMA_VERSION,
  STORAGE_KEY,
  deserialize,
  serialize,
  type DemoState,
} from "@/lib/store/persistence";

function seed(): DemoState {
  return {
    view: null,
    companyRole: null,
    evidence: [],
    actions: [],
    alerts: [],
    tickets: [],
    decisionHistory: [],
    selectedMinistryCompanyId: "company-demo",
  };
}

test("storage key and legacy keys reflect the version bump", () => {
  assert.equal(SCHEMA_VERSION, 2);
  assert.match(STORAGE_KEY, /v2$/);
  const legacyKeys: readonly string[] = LEGACY_STORAGE_KEYS;
  assert.ok(legacyKeys.includes("emtithal-demo-state-v1"));
  assert.ok(!legacyKeys.includes(STORAGE_KEY));
});

test("a valid v2 envelope round-trips and is accepted", () => {
  const s = seed();
  s.view = "company";
  s.selectedMinistryCompanyId = "company-x";
  const result = deserialize(serialize(s), seed());
  assert.equal(result.rejected, false);
  assert.deepEqual(result.state, s);
});

test("missing payload is rejected and falls back to the seed", () => {
  const s = seed();
  for (const raw of [null, undefined, ""]) {
    const result = deserialize(raw, s);
    assert.equal(result.rejected, true);
    assert.equal(result.reason, "empty");
    assert.equal(result.state, s);
  }
});

test("unparseable payload is rejected", () => {
  const result = deserialize("{ not json", seed());
  assert.equal(result.rejected, true);
  assert.equal(result.reason, "unparseable");
});

test("a bare (unversioned) v1-shaped blob is rejected — old shape is never trusted", () => {
  const bareV1 = JSON.stringify(seed()); // no { schemaVersion, state } envelope
  const result = deserialize(bareV1, seed());
  assert.equal(result.rejected, true);
  assert.equal(result.reason, "not_an_envelope");
});

test("a wrong schema version is rejected", () => {
  const raw = JSON.stringify({ schemaVersion: 1, state: seed() });
  const result = deserialize(raw, seed());
  assert.equal(result.rejected, true);
  assert.equal(result.reason, "version_mismatch");
});

test("a right-version but wrong-shape state is rejected", () => {
  const raw = JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    state: { view: "company", evidence: "not-an-array" },
  });
  const result = deserialize(raw, seed());
  assert.equal(result.rejected, true);
  assert.equal(result.reason, "bad_shape");
});

test("an unknown view value is rejected as bad shape", () => {
  const bad = { ...seed(), view: "administrator" };
  const raw = JSON.stringify({ schemaVersion: SCHEMA_VERSION, state: bad });
  const result = deserialize(raw, seed());
  assert.equal(result.rejected, true);
  assert.equal(result.reason, "bad_shape");
});
