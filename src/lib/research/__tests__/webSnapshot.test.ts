// =============================================================================
// Phase 8 tests — local official-web snapshot verification.
//
// The two real UQU web sources are captured verbatim in a local markdown
// snapshot. Its SHA-256 is baked into the corpus; this suite re-hashes the file
// on disk and proves it still matches, and that the local file is treated as a
// capture container — never as the publisher.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  WEB_SNAPSHOT_SOURCE_FILE,
  WEB_SNAPSHOT_SHA256,
  WEB_SNAPSHOT_VERIFIED_AT,
  WEB_SOURCE_SIMULATION_UNIT,
  WEB_SOURCE_BRT_STUDY,
  hashSnapshotBytes,
  verifyWebSnapshot,
} from "@/lib/research";

const ROOT = path.resolve(import.meta.dirname, "../../../..");

test("the on-disk snapshot re-hashes to the SHA-256 baked into the corpus", () => {
  const bytes = readFileSync(path.join(ROOT, WEB_SNAPSHOT_SOURCE_FILE));
  const recomputed = createHash("sha256").update(bytes).digest("hex");
  assert.equal(recomputed, WEB_SNAPSHOT_SHA256);
  assert.equal(hashSnapshotBytes(bytes), WEB_SNAPSHOT_SHA256);
});

test("verifyWebSnapshot(root) confirms the local capture matches the corpus", () => {
  const v = verifyWebSnapshot(ROOT);
  assert.equal(v.path, WEB_SNAPSHOT_SOURCE_FILE);
  assert.match(v.sha256, /^[0-9a-f]{64}$/);
  assert.equal(v.matchesCorpus, true);
});

test("both web sources carry the same snapshot hash + a real local verification time (not ingestion time)", () => {
  for (const e of [WEB_SOURCE_SIMULATION_UNIT, WEB_SOURCE_BRT_STUDY]) {
    assert.equal(e.snapshotHash, WEB_SNAPSHOT_SHA256);
    // ingestedAt is reserved for actual PDF ingestion — null for a web snapshot
    assert.equal(e.ingestedAt, null);
    // snapshotVerifiedAt = when the local snapshot was verified in this repo
    assert.equal(e.snapshotVerifiedAt, WEB_SNAPSHOT_VERIFIED_AT);
    assert.match(e.snapshotVerifiedAt ?? "", /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
    assert.equal(e.documentHash, null); // not a PDF
  }
});

test("WEB_SNAPSHOT_VERIFIED_AT is a fixed real UTC timestamp, not a placeholder midnight value", () => {
  assert.match(WEB_SNAPSHOT_VERIFIED_AT, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  assert.notEqual(WEB_SNAPSHOT_VERIFIED_AT, "2026-08-31T00:00:00.000Z");
  assert.notEqual(WEB_SNAPSHOT_VERIFIED_AT, "2026-08-31T00:00:00Z");
  assert.equal(Number.isNaN(Date.parse(WEB_SNAPSHOT_VERIFIED_AT)), false);
});

test("the snapshot file is only a container — canonical publisher stays UQU / the Institute", () => {
  const snapshot = readFileSync(path.join(ROOT, WEB_SNAPSHOT_SOURCE_FILE), "utf8");
  // the file names itself a snapshot, not a source of authority
  assert.match(snapshot, /NOT a reconstructed PDF/i);
  for (const e of [WEB_SOURCE_SIMULATION_UNIT, WEB_SOURCE_BRT_STUDY]) {
    assert.match(e.publisherAr, /جامعة أم القرى|معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة/);
    assert.equal(e.approvedSourceLocator.includes("uqu_research_web_sources.md"), true);
    assert.match(e.approvedSourceLocator, /حاوية محلية فقط/);
  }
});

test("exact preserved officialUrl per source", () => {
  assert.equal(WEB_SOURCE_SIMULATION_UNIT.officialUrl, "https://uqu.edu.sa/hajj/70777");
  assert.equal(WEB_SOURCE_BRT_STUDY.officialUrl, "https://uqu.edu.sa/App/News/178082");
});
