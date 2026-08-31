// =============================================================================
// Canonical regulatory model — Finalist (Phase 1).
//
// Shapes the multi-authority Regulatory Matrix. Every field is populated ONLY
// by transcription from REGULATORY_MATRIX_v1.md — never from model knowledge.
// Where the matrix is silent, the field is null / empty and the gap is listed
// in `unresolved`; a record missing a matrix §16-critical field carries
// `resolution: "UNRESOLVED_REQUIREMENT"` and must not be treated as verified
// regulatory truth.
//
// Additive: nothing in the running app consumes this yet.
// =============================================================================

/** Finalist regulatory scope is 1447H only (locked decision B3). */
export type Season = "1447H";

export type AuthorityId = "MOHU" | "MOH" | "CIVIL_DEFENSE";

export interface Authority {
  id: AuthorityId;
  nameAr: string;
  /** Domains this authority owns — transcribed from the matrix. */
  domainsAr: string[];
  /** Verbatim pointer to the matrix section that introduces this authority. */
  matrixRef: string;
}

/**
 * Internal product risk class (matrix §12). NOT an official regulatory weight.
 * Deliberately unassigned (`null`) for every requirement in Phase 1 — the
 * mapping is drafted for approval and wired only in a later phase. The legacy
 * `criticalGate` flag is never carried over.
 */
export type InternalCriticality = "CRITICAL" | "REQUIRED" | "ADVISORY";

/** Responsible-party model (matrix §5 HAJ-PROVIDERS-01, §19 Provider Responsibility). */
export type ResponsibleParty = "COMPANY" | "EMPLOYEE" | "SERVICE_PROVIDER" | "SHARED";

/**
 * How applicability is expressed.
 * - `EXPRESSION` — the matrix states a machine-evaluable condition verbatim.
 * - `NARRATIVE` — the matrix states applicability in prose only (not yet
 *   machine-evaluable); such records list `applicabilityRule not
 *   machine-evaluable` in `unresolved`.
 * - `DECLARED_SCOPE` — the matrix gives no conditional rule; applicability
 *   depends on whether the company is within the named regulatory scope, which
 *   is DECLARED by the company and evaluated against its profile in Phase 2.
 *   Never assumed applicable to every COMPANY.
 *
 * There is deliberately no "always applicable" variant — no requirement is
 * assumed to apply without a defined basis.
 */
export type ApplicabilityRule =
  | { kind: "EXPRESSION"; expression: string; matrixRef: string }
  | { kind: "NARRATIVE"; textEn: string; matrixRef: string }
  | { kind: "DECLARED_SCOPE"; scopeKey: string; textEn: string; matrixRef: string };

export interface OfficialWeight {
  /** Weight of the parent track in the overall official assessment (matrix §4.1). */
  trackWeightPercent: number;
  /** Weight of this requirement within its track (matrix §4.1). */
  withinTrackWeightPercent: number;
  /** Verbatim pointer to where the matrix publishes these figures. */
  matrixRef: string;
}

/**
 * Explicit canonical verification of the source locator (matrix §3A + §16). This
 * is stored truth, NOT inferred from `locatorNote`:
 * - `VERIFIED_COMPLETE` — a precise page/section locator is established in our
 *   approved documents.
 * - `INCOMPLETE` — it is not; a page number is never invented and an
 *   "officialSource locator" note also appears in the requirement's `unresolved`.
 */
export type LocatorStatus = "VERIFIED_COMPLETE" | "INCOMPLETE";

/**
 * A verified issuing-authority source (matrix §3A). Distinct from
 * `matrixSourceRef`, which only traces back to this implementation matrix.
 */
export interface OfficialSource {
  authorityId: AuthorityId;
  /** Official document / page descriptor, verbatim. */
  reference: string;
  /** Canonical URL(s) for the official document / page. */
  urls: string[];
  /**
   * Explicit canonical locator verification. Consumers MUST read this rather
   * than inferring completeness from `locatorNote`.
   */
  locatorStatus: LocatorStatus;
  /**
   * Precise locator (page / section) text when `locatorStatus` is
   * `VERIFIED_COMPLETE`; a descriptive note otherwise. `null` when there is no
   * text at all. Never a source of completeness truth — `locatorStatus` is.
   */
  locatorNote: string | null;
}

export type RequirementResolution = "SPECIFIED" | "UNRESOLVED_REQUIREMENT";

export interface RegulatoryRequirement {
  /** Canonical stored identity — the Regulatory Matrix ID. Never a legacy ID. */
  id: string;
  /** Backwards-compatible identifiers only. Never used for new storage or lineage. */
  legacyIds: string[];
  /** Non-canonical names allowed ONLY as traceability aliases (matrix §4.1, HAJ-EXP-05). */
  sourceAliasesAr: string[];

  authorityId: AuthorityId;
  domainAr: string;
  trackAr: string | null;
  titleAr: string;

  applicabilityRule: ApplicabilityRule | null;

  /**
   * Where the "required" value / structure comes from. For qualitative / field
   * requirements this is a described source (e.g. the company operational
   * profile → applicable sites/providers), not necessarily a numeric
   * regulator-published target (matrix §3A). `null` only when genuinely unstated.
   */
  targetSource: string | null;
  /** What each applicable unit must satisfy (matrix §3A). `null` when not defined. */
  verificationTarget: string | null;
  /** Matrix "Actual Source" list. */
  actualSource: string[];

  /** Matrix "Verification Rule" / "Verification Method". `null` when none stated. */
  verificationRule: string | null;
  /** Matrix "Verification Areas" list, verbatim. */
  verificationAreasAr: string[];
  /** Matrix "Accepted Evidence" list. Empty when the matrix does not enumerate it. */
  acceptedEvidenceAr: string[];

  responsiblePartyModel: ResponsibleParty[] | null;

  /** Official weight, or `null` where the matrix publishes none (matrix §10). */
  officialWeight: OfficialWeight | null;

  /**
   * INTERNAL product prioritisation only (matrix §12) — NOT an official
   * regulatory weight. Approved values are stored per record. `null` where the
   * requirement is not yet resolved enough to prioritise — currently the
   * `UNRESOLVED_REQUIREMENT` records (HAJ-PROVIDERS-01, MOH-01). The legacy
   * `criticalGate` flag is never carried (HAJ-EXP-03 is REQUIRED, not CRITICAL).
   */
  internalCriticality: InternalCriticality | null;

  season: Season;

  /**
   * Traceability pointer back to the approved implementation matrix section
   * (`REGULATORY_MATRIX_v1.md`). This is NOT an official source — the matrix is
   * our implementation source of truth, not the issuing government authority.
   */
  matrixSourceRef: string;

  /**
   * The verified issuing-authority source (matrix §3A). Distinct from
   * `matrixSourceRef`. `null` only if no verified official source exists — then
   * the gap is also listed in `unresolved`. A missing `locatorNote` is tracked
   * separately (an "officialSource locator" note in `unresolved`) and never
   * makes the record `UNRESOLVED_REQUIREMENT` by itself.
   */
  officialSource: OfficialSource | null;

  /** Verbatim transcription notes: what the matrix does / does not say. */
  matrixNotes: string[];

  /**
   * Specific aspects still underspecified at requirement level (matrix gaps,
   * missing source locators, unresolved responsibility mapping, unverified
   * season continuity, …). A non-empty list means this record is not yet
   * complete regulatory truth, even when `resolution` is `"SPECIFIED"`.
   */
  unresolved: string[];

  /**
   * Whether the record may be treated as verified regulatory truth.
   * `"UNRESOLVED_REQUIREMENT"` when a blocking regulatory gap remains — a
   * missing structural §16 field, an unresolved company-vs-provider
   * responsibility mapping (HAJ-PROVIDERS-01), or unverified current-season
   * continuity (MOH-01). A missing source `locatorNote` alone never flips this.
   */
  resolution: RequirementResolution;
}
