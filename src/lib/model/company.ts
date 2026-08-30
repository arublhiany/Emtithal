// =============================================================================
// Canonical organisation / company model — Finalist (Phase 1 + Phase 2).
//
// Additive. The legacy company-role model (`CompanyRole` in `@/lib/types`) is
// kept only so the pre-Phase-10 landing/store keep compiling; it is NOT the
// canonical model. The canonical company-facing role is the single value
// `COMPANY_REPRESENTATIVE` (locked decision, plan §B / FIGMA rules §9).
//
// Phase 2 adds the fields the deterministic Applicability Engine consumes.
// Every declarable fact defaults to `null` / `[]` — never inferred.
// =============================================================================

import type { DataSource as DataOrigin } from "@/lib/mode";
import type { ResponsibleParty, Season } from "./regulatory";
import type { ValueVerification } from "./verification";

export type OrganizationType = "COMPANY" | "GOVERNMENT_AUTHORITY";

/** The only company-facing user role in the Finalist. */
export type CompanyUserRole = "COMPANY_REPRESENTATIVE";

/**
 * Government-side internal roles may be introduced later (matrix / spec §5.2:
 * MEMBER / REVIEWER / ADMIN). Not part of the login experience; listed here as
 * a forward shape only.
 */
export type GovernmentUserRole = "MEMBER" | "REVIEWER" | "ADMIN";

export type DataSourceKind = "NUSUK" | "WORKERS" | "OPERATIONAL" | "EVIDENCE";

/** No state may be shown as "connected" unless a real integration exists. */
export type DataSourceState = "CONNECTED" | "NOT_CONNECTED" | "IMPORTED" | "PENDING_LINK";

export interface CompanyDataSource {
  kind: DataSourceKind;
  labelAr: string;
  state: DataSourceState;
  /** Where the data comes from — required for every piece of information (spec §9). */
  sourceAr: string | null;
  lastUpdatedAr: string | null;
  verification: ValueVerification | null;
  /** DEMO_DATA vs REAL_DATA. Demo sources are never presented as live integrations. */
  origin: DataOrigin;
}

/**
 * A company-declared count with provenance. `count` is `null` until the company
 * declares it — the Applicability / Target engines never default or invent it.
 */
export interface SourcedCount {
  count: number | null;
  sourceAr: string | null;
  lastUpdatedAr: string | null;
  verification: ValueVerification | null;
}

export const UNDECLARED_COUNT: SourcedCount = {
  count: null,
  sourceAr: null,
  lastUpdatedAr: null,
  verification: null,
};

export interface CompanyCamp {
  id: string;
  nameAr: string;
  /** Declared by the company — never inferred. Drives matrix HAJ-CAMP / CIV applicability. */
  companyResponsible: boolean;
}

export interface CompanyServiceProvider {
  id: string;
  nameAr: string;
  scopeAr: string;
  responsibleParty: ResponsibleParty;
}

/**
 * Explicit company-declared facts consumed by the Applicability Engine. Every
 * field is `null` until the company declares it; a `null` field yields
 * `INSUFFICIENT_DATA`, never an assumed value.
 */
export interface DeclaredCompanyFacts {
  /** HAJ-EXP-01…05 (DECLARED_SCOPE: MOHU_EXPERIENCE_TRACK). */
  experienceTrackScopeDeclared: boolean | null;
  /** HAJ-CAMP-01 + CIV-01…05 (EXPRESSION: company_responsible_for_camp == true). */
  companyResponsibleForCamp: boolean | null;
  /** HAJ-PROVIDERS-01 (NARRATIVE). Regulatory responsibility mapping stays UNRESOLVED. */
  contractsExternalServiceProviders: boolean | null;
  /** HAJ-CATERING-01 (NARRATIVE). */
  providesOrEnsuresCatering: boolean | null;
}

export interface CanonicalCompanyProfile {
  companyId: string;
  legalNameAr: string;
  season: Season;

  /** Total pilgrims served — declared, with provenance. */
  pilgrims: SourcedCount;
  /** Total workforce — declared, with provenance. */
  workforce: SourcedCount;
  /**
   * Subset of workforce whose roles require direct contact with pilgrims /
   * Umrah performers (MOH-01). NOT the whole workforce. `count: null` when not
   * declared → MOH-01 applicability is INSUFFICIENT_DATA.
   */
  directContactWorkers: SourcedCount;
  /**
   * Explicit applicable-person roster/count for Nusuk (HAJ-NUSUK-01). `count:
   * null` when not declared → HAJ-NUSUK-01 applicability is INSUFFICIENT_DATA.
   */
  nusukApplicablePersons: SourcedCount;

  servicesAr: string[];
  locationsAr: string[];
  camps: CompanyCamp[];
  serviceProviders: CompanyServiceProvider[];
  dataSources: CompanyDataSource[];
  declaredFacts: DeclaredCompanyFacts;
}
