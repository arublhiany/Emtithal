// =============================================================================
// Company onboarding — data-capture LOGIC (Phase 2).
//
// Turns a raw declared draft into a `CanonicalCompanyProfile`. It NEVER infers
// an undeclared fact: anything the draft omits becomes `null` / `[]` / an
// undeclared `SourcedCount`. There is no UI here — the onboarding screen is
// Phase 10/11. `getMissingApplicabilityInputs` reports what still has to be
// declared (drives onboarding progress and the "UI-pending" list).
// =============================================================================

import type {
  CanonicalCompanyProfile,
  CompanyCamp,
  CompanyDataSource,
  CompanyServiceProvider,
  DeclaredCompanyFacts,
  Season,
  SourcedCount,
} from "@/lib/model";
import { UNDECLARED_COUNT } from "@/lib/model";

/** Optional-everywhere input. Absent fields are treated as "not declared". */
export interface CompanyProfileDraft {
  companyId: string;
  legalNameAr: string;
  season: Season;
  pilgrims?: Partial<SourcedCount> | null;
  workforce?: Partial<SourcedCount> | null;
  directContactWorkers?: Partial<SourcedCount> | null;
  nusukApplicablePersons?: Partial<SourcedCount> | null;
  servicesAr?: string[] | null;
  locationsAr?: string[] | null;
  camps?: CompanyCamp[] | null;
  serviceProviders?: CompanyServiceProvider[] | null;
  dataSources?: CompanyDataSource[] | null;
  declaredFacts?: Partial<DeclaredCompanyFacts> | null;
}

function toSourcedCount(input: Partial<SourcedCount> | null | undefined): SourcedCount {
  if (!input || input.count == null || typeof input.count !== "number") {
    // No declared count → fully undeclared. Never keep a partial/dangling source.
    return { ...UNDECLARED_COUNT };
  }
  return {
    count: input.count,
    sourceAr: input.sourceAr ?? null,
    lastUpdatedAr: input.lastUpdatedAr ?? null,
    verification: input.verification ?? null,
  };
}

function toDeclaredFacts(input: Partial<DeclaredCompanyFacts> | null | undefined): DeclaredCompanyFacts {
  const pick = (v: boolean | null | undefined): boolean | null => (typeof v === "boolean" ? v : null);
  return {
    experienceTrackScopeDeclared: pick(input?.experienceTrackScopeDeclared),
    companyResponsibleForCamp: pick(input?.companyResponsibleForCamp),
    contractsExternalServiceProviders: pick(input?.contractsExternalServiceProviders),
    providesOrEnsuresCatering: pick(input?.providesOrEnsuresCatering),
  };
}

/**
 * Builds the canonical profile. No inference — an omitted field is `null`/`[]`,
 * never a guessed value.
 */
export function buildCompanyProfile(draft: CompanyProfileDraft): CanonicalCompanyProfile {
  return {
    companyId: draft.companyId,
    legalNameAr: draft.legalNameAr,
    season: draft.season,
    pilgrims: toSourcedCount(draft.pilgrims),
    workforce: toSourcedCount(draft.workforce),
    directContactWorkers: toSourcedCount(draft.directContactWorkers),
    nusukApplicablePersons: toSourcedCount(draft.nusukApplicablePersons),
    servicesAr: [...(draft.servicesAr ?? [])],
    locationsAr: [...(draft.locationsAr ?? [])],
    camps: [...(draft.camps ?? [])],
    serviceProviders: [...(draft.serviceProviders ?? [])],
    dataSources: [...(draft.dataSources ?? [])],
    declaredFacts: toDeclaredFacts(draft.declaredFacts),
  };
}

/** Applicability-relevant inputs the company has not declared yet. */
export function getMissingApplicabilityInputs(profile: CanonicalCompanyProfile): string[] {
  const missing: string[] = [];
  const f = profile.declaredFacts;
  if (f.experienceTrackScopeDeclared == null) missing.push("declaredFacts.experienceTrackScopeDeclared");
  if (f.companyResponsibleForCamp == null) missing.push("declaredFacts.companyResponsibleForCamp");
  if (f.contractsExternalServiceProviders == null)
    missing.push("declaredFacts.contractsExternalServiceProviders");
  if (f.providesOrEnsuresCatering == null) missing.push("declaredFacts.providesOrEnsuresCatering");
  if (profile.directContactWorkers.count == null) missing.push("directContactWorkers.count");
  if (profile.nusukApplicablePersons.count == null) missing.push("nusukApplicablePersons.count");
  return missing;
}
