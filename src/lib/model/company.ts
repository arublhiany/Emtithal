// =============================================================================
// Canonical organisation / company model — Finalist (Phase 1).
//
// Additive. The legacy company-role model (`CompanyRole` in `@/lib/types`) is
// kept only so the pre-Phase-10 landing/store keep compiling; it is NOT the
// canonical model. The canonical company-facing role is the single value
// `COMPANY_REPRESENTATIVE` (locked decision, plan §B / FIGMA rules §9).
// =============================================================================

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
}

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
 * Explicit company-declared facts consumed by the (Phase 2) Applicability
 * Engine. Every field is `null` until the company declares it; a `null` field
 * yields `INSUFFICIENT_DATA`, never an assumed value.
 */
export interface DeclaredCompanyFacts {
  companyResponsibleForCamp: boolean | null;
  contractsExternalServiceProviders: boolean | null;
  providesOrEnsuresCatering: boolean | null;
}

export interface CanonicalCompanyProfile {
  companyId: string;
  legalNameAr: string;
  season: Season;
  pilgrimsCount: number | null;
  workforceCount: number | null;
  servicesAr: string[];
  locationsAr: string[];
  camps: CompanyCamp[];
  serviceProviders: CompanyServiceProvider[];
  dataSources: CompanyDataSource[];
  declaredFacts: DeclaredCompanyFacts;
}
