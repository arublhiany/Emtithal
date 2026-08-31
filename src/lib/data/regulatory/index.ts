// =============================================================================
// Multi-authority Regulatory Matrix — canonical accessors (Phase 1).
//
// Source of truth: REGULATORY_MATRIX_v1.md. Nothing here is consumed by the
// running UI yet — the legacy path (`@/lib/data/requirements`) still drives
// every screen until the Phase 3 verification migration.
// =============================================================================

import type { Authority, RegulatoryRequirement } from "@/lib/model";
import { AUTHORITIES } from "./authorities";
import { HAJJ_EXPERIENCE_REQUIREMENTS } from "./hajjExperience";
import { HAJJ_OPERATIONAL_REQUIREMENTS } from "./hajjOperational";
import { HEALTH_REQUIREMENTS } from "./health";
import { CIVIL_DEFENSE_REQUIREMENTS } from "./civilDefense";

const ALL_REQUIREMENTS: RegulatoryRequirement[] = [
  ...HAJJ_EXPERIENCE_REQUIREMENTS,
  ...HAJJ_OPERATIONAL_REQUIREMENTS,
  ...HEALTH_REQUIREMENTS,
  ...CIVIL_DEFENSE_REQUIREMENTS,
];

export function getAuthorities(): Authority[] {
  return AUTHORITIES.map((a) => ({ ...a }));
}

export function getRegulatoryRequirements(): RegulatoryRequirement[] {
  return ALL_REQUIREMENTS.map((r) => ({ ...r }));
}

export function getRequirementByCanonicalId(id: string): RegulatoryRequirement | undefined {
  const found = ALL_REQUIREMENTS.find((r) => r.id === id);
  return found ? { ...found } : undefined;
}

/**
 * Resolves a canonical matrix ID or a legacy ID (e.g. "CR-001") to the
 * canonical matrix ID. Returns `undefined` for an unknown identifier.
 */
export function resolveRequirementId(idOrLegacy: string): string | undefined {
  const direct = ALL_REQUIREMENTS.find((r) => r.id === idOrLegacy);
  if (direct) return direct.id;
  const viaLegacy = ALL_REQUIREMENTS.find((r) => r.legacyIds.includes(idOrLegacy));
  return viaLegacy?.id;
}

/** Reverse of `resolveRequirementId` — canonical ID → first legacy alias, if any. */
export function toLegacyRequirementId(canonicalId: string): string | undefined {
  return ALL_REQUIREMENTS.find((r) => r.id === canonicalId)?.legacyIds[0];
}

/**
 * Canonical ID for display/links. Maps a legacy `CR-00x` reference held in the
 * demo operational fixtures to the canonical matrix ID; passes an already
 * canonical ID (or an unknown one) through unchanged. The UI never shows a
 * legacy ID as the primary identifier.
 */
export function displayRequirementId(idOrLegacy: string): string {
  return resolveRequirementId(idOrLegacy) ?? idOrLegacy;
}

/** Records the matrix leaves underspecified on a structural §16 field. */
export function getUnresolvedRequirements(): RegulatoryRequirement[] {
  return getRegulatoryRequirements().filter((r) => r.resolution === "UNRESOLVED_REQUIREMENT");
}

/**
 * Records with no established official (issuing-authority) source. Now empty —
 * every record carries a verified `officialSource` (matrix §3A).
 */
export function getRequirementsMissingOfficialSource(): RegulatoryRequirement[] {
  return getRegulatoryRequirements().filter((r) => r.officialSource === null);
}

/**
 * Records whose verified official source has an explicit `locatorStatus` of
 * `INCOMPLETE` (a page number is never invented — an "officialSource locator"
 * note is kept in `unresolved` instead). Read from the explicit canonical field,
 * not inferred from `locatorNote`.
 */
export function getRequirementsMissingSourceLocator(): RegulatoryRequirement[] {
  return getRegulatoryRequirements().filter(
    (r) => r.officialSource !== null && r.officialSource.locatorStatus === "INCOMPLETE",
  );
}

/** Records carrying any open transcription question (superset of the above). */
export function getRequirementsWithOpenQuestions(): RegulatoryRequirement[] {
  return getRegulatoryRequirements().filter(
    (r) => r.resolution === "UNRESOLVED_REQUIREMENT" || r.unresolved.length > 0,
  );
}

export {
  AUTHORITIES,
  HAJJ_EXPERIENCE_REQUIREMENTS,
  HAJJ_OPERATIONAL_REQUIREMENTS,
  HEALTH_REQUIREMENTS,
  CIVIL_DEFENSE_REQUIREMENTS,
};
