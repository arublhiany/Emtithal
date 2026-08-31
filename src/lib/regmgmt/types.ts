// =============================================================================
// Government regulatory-management domain — types (Phase 10).
//
// A MANAGEMENT LAYER around the canonical Phase-1 Regulatory Matrix. Canonical
// requirements seed an ACTIVE v1 baseline (origin CANONICAL_BASELINE) that is
// never mutated. Government users create DRAFTs, issue new versions, activate,
// and deactivate ON TOP of that baseline. Regulatory history is never deleted:
// a superseded / deactivated version stays in `versions[]` and stays
// attributable to the period it was effective.
// =============================================================================

export type ReqLifecycleStatus = "DRAFT" | "ACTIVE" | "SUPERSEDED" | "DEACTIVATED";

export type RequirementOrigin = "CANONICAL_BASELINE" | "GOVERNMENT_MANAGED";

/** One immutable version record of a requirement. Appended, never rewritten. */
export interface RequirementVersionRecord {
  /** Stable requirement identity (canonical matrix id, or a government-issued id). */
  requirementId: string;
  /** 1-based version number. */
  version: number;
  status: ReqLifecycleStatus;
  season: string; // "1447H"
  titleAr: string;
  authorityId: string | null;
  domainAr: string;
  trackAr: string | null;
  /** ISO date or Hijri label as provided. `null` until an ACTIVE version sets it. */
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  officialSourceReferenceAr: string | null;
  officialSourceUrls: string[];
  officialSourceLocatorNoteAr: string | null;
  verificationAreasAr: string[];
  changeSummaryAr: string;
  origin: RequirementOrigin;
  createdAtIso: string;
  createdByAr: string;
  updatedAtIso: string;
  /** When SUPERSEDED — the version that replaced this one. */
  supersededByVersion: number | null;
}

export interface ManagedRequirement {
  requirementId: string;
  /** Stable display identity (from v1). */
  identityTitleAr: string;
  origin: RequirementOrigin;
  /** Append-only, ordered by `version` ascending. */
  versions: RequirementVersionRecord[];
  /** Currently ACTIVE version number, or `null` (all draft / deactivated). */
  activeVersion: number | null;
  /** An open DRAFT version number, or `null`. */
  draftVersion: number | null;
}

// -- audit trail ------------------------------------------------------------

export type AuditAction =
  | "REQUIREMENT_CREATED"
  | "DRAFT_UPDATED"
  | "VERSION_ISSUED"
  | "VERSION_ACTIVATED"
  | "VERSION_SUPERSEDED"
  | "REQUIREMENT_DEACTIVATED"
  | "SOURCE_CHANGED"
  | "EFFECTIVE_DATE_CHANGED";

export interface AuditEntry {
  id: string;
  requirementId: string;
  version: number | null;
  action: AuditAction;
  atIso: string;
  actorAr: string;
  summaryAr: string;
  fromValueAr: string | null;
  toValueAr: string | null;
}

// -- regulatory-change impact + notifications -----------------------------

export type RegChangeType =
  | "NEW_REQUIREMENT"
  | "UPDATED_REQUIREMENT"
  | "NEW_VERSION"
  | "DEACTIVATED_REQUIREMENT"
  | "UPCOMING_EFFECTIVE_DATE"
  | "ACTION_REQUIRED";

export type CompanyImpactState =
  | "APPLICABILITY_REEVALUATION_REQUIRED"
  | "NEW_EVIDENCE_REQUIRED"
  | "PENDING_VERIFICATION"
  | "COMPANY_ACTION_REQUIRED"
  | "NO_IMPACT";

export type ApplicabilityOutcome = "APPLICABLE" | "NOT_APPLICABLE" | "INSUFFICIENT_DATA";

export interface CompanyImpact {
  companyId: string;
  companyNameAr: string;
  applicability: ApplicabilityOutcome;
  state: CompanyImpactState;
  /** ENFORCED invariant — a regulatory change never itself makes a company non-compliant. */
  makesNonCompliant: false;
  reasonAr: string;
}

export interface ImpactAnalysis {
  requirementId: string;
  version: number;
  changeType: RegChangeType;
  potentiallyAffectedCompanyIds: string[];
  companiesRequiringActionIds: string[];
  pendingVerificationCompanyIds: string[];
  impacts: CompanyImpact[];
  /** ENFORCED invariant. */
  autoNonComplianceApplied: false;
}

export interface RegChangeNotification {
  id: string;
  companyId: string;
  requirementId: string;
  version: number;
  type: RegChangeType;
  titleAr: string;
  bodyAr: string;
  effectiveFrom: string | null;
  actionRequired: boolean;
  /** In-app deep link to the affected requirement / required action. */
  targetHref: string;
  createdAtIso: string;
}

// -- new-requirement / new-version input --------------------------------

export interface RequirementVersionInput {
  requirementId?: string; // omitted for a brand-new requirement
  titleAr: string;
  authorityId: string | null;
  domainAr: string;
  trackAr: string | null;
  season: string;
  effectiveFrom: string | null;
  officialSourceReferenceAr: string | null;
  officialSourceUrls: string[];
  officialSourceLocatorNoteAr: string | null;
  verificationAreasAr: string[];
  changeSummaryAr: string;
}
