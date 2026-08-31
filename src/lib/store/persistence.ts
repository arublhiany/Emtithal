// =============================================================================
// Demo-store persistence — versioned schema + guarded (de)serialisation.
//
// Phase 0 shipped an unversioned blob at "emtithal-demo-state-v1". Phase 1
// wraps persisted state in an envelope carrying its schema version and rejects
// any payload that is missing, unparseable, the wrong version, or the wrong
// shape — the old shape is never trusted blindly. Rejected payloads fall back
// to the fresh seed.
//
// Phase 11 bumps v2 -> v3: the primary demo company id was unified onto the
// canonical `CANONICAL_DEMO_COMPANY_ID`, retiring an earlier legacy id. The
// persisted state carries `companyId` fields (evidence / actions / alerts /
// tickets) and `selectedMinistryCompanyId` that the shape check does not
// validate, so any v2 blob may still hold the retired id. Bumping the version
// deterministically discards v2 state and reseeds with the unified identity —
// the demo's interactive state is ephemeral by design.
//
// Pure module (no React, no DOM) so it can be unit-tested directly.
// =============================================================================

import type {
  AlertItem,
  CompanyRole,
  DecisionSimulationResult,
  Evidence,
  ImprovementAction,
  SupportTicket,
} from "@/lib/types";

export type SessionView = "company" | "ministry" | null;

export interface DemoState {
  view: SessionView;
  companyRole: CompanyRole | null;
  evidence: Evidence[];
  actions: ImprovementAction[];
  alerts: AlertItem[];
  tickets: SupportTicket[];
  decisionHistory: DecisionSimulationResult[];
  selectedMinistryCompanyId: string;
}

/** Bumped whenever the persisted `DemoState` shape or identity changes incompatibly. */
export const SCHEMA_VERSION = 3;

/** Current storage key. Bumped so stale v1/v2 blobs are ignored. */
export const STORAGE_KEY = "emtithal-demo-state-v3";

/** Older keys, removed on the first successful v3 load. */
export const LEGACY_STORAGE_KEYS = [
  "emtithal-demo-state-v1",
  "emtithal-demo-state-v2",
] as const;

interface PersistedEnvelope {
  schemaVersion: number;
  state: DemoState;
}

export function serialize(state: DemoState): string {
  const envelope: PersistedEnvelope = { schemaVersion: SCHEMA_VERSION, state };
  return JSON.stringify(envelope);
}

export type DeserializeReason =
  | "empty"
  | "unparseable"
  | "not_an_envelope"
  | "version_mismatch"
  | "bad_shape";

export interface DeserializeResult {
  state: DemoState;
  /** true when the stored payload was rejected and `state` is the supplied seed. */
  rejected: boolean;
  reason?: DeserializeReason;
}

function isDemoStateShape(value: unknown): value is DemoState {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  const requiredArrays = ["evidence", "actions", "alerts", "tickets", "decisionHistory"];
  if (!requiredArrays.every((key) => Array.isArray(s[key]))) return false;
  if (typeof s.selectedMinistryCompanyId !== "string") return false;
  if (!("view" in s)) return false;
  if (s.view !== null && s.view !== "company" && s.view !== "ministry") return false;
  if (!("companyRole" in s)) return false;
  return true;
}

/**
 * Parses a raw localStorage string into a `DemoState`. Any problem — missing,
 * unparseable, not a versioned envelope, wrong version, or wrong shape — yields
 * `{ state: seed, rejected: true, reason }` rather than a partial or trusted
 * old-shape object.
 */
export function deserialize(raw: string | null | undefined, seed: DemoState): DeserializeResult {
  if (raw == null || raw === "") return { state: seed, rejected: true, reason: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: seed, rejected: true, reason: "unparseable" };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("schemaVersion" in parsed) ||
    !("state" in parsed)
  ) {
    return { state: seed, rejected: true, reason: "not_an_envelope" };
  }

  const envelope = parsed as Record<string, unknown>;
  if (envelope.schemaVersion !== SCHEMA_VERSION) {
    return { state: seed, rejected: true, reason: "version_mismatch" };
  }
  if (!isDemoStateShape(envelope.state)) {
    return { state: seed, rejected: true, reason: "bad_shape" };
  }

  return { state: envelope.state, rejected: false };
}
