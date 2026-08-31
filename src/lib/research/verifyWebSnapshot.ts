// =============================================================================
// Local official-web snapshot verification (Phase 8). Server-side only.
//
// The two real UQU web sources in the corpus are captured verbatim in a local
// markdown snapshot. This module re-hashes that file and checks it still matches
// the SHA-256 baked into the corpus — the snapshot is a provenance-preserving
// LOCAL CAPTURE, never the publisher. It never fetches the web.
// =============================================================================

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { WEB_SNAPSHOT_SHA256, WEB_SNAPSHOT_SOURCE_FILE } from "./corpus";

if (typeof window !== "undefined") {
  throw new Error("verifyWebSnapshot is server-only and must not run in the browser.");
}

/** SHA-256 hex of arbitrary snapshot bytes. */
export function hashSnapshotBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export interface WebSnapshotVerification {
  /** Repo-relative path that was hashed. */
  path: string;
  /** SHA-256 hex of the file on disk. */
  sha256: string;
  /** Whether the on-disk hash matches the SHA-256 baked into the corpus. */
  matchesCorpus: boolean;
}

/**
 * Reads `WEB_SNAPSHOT_SOURCE_FILE` under `rootDir`, hashes it, and compares to
 * `WEB_SNAPSHOT_SHA256`. Throws only if the file cannot be read.
 */
export function verifyWebSnapshot(rootDir: string): WebSnapshotVerification {
  const abs = path.join(rootDir, WEB_SNAPSHOT_SOURCE_FILE);
  const bytes = readFileSync(abs);
  const sha256 = hashSnapshotBytes(bytes);
  return {
    path: WEB_SNAPSHOT_SOURCE_FILE,
    sha256,
    matchesCorpus: sha256 === WEB_SNAPSHOT_SHA256,
  };
}
