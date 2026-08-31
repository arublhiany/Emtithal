// =============================================================================
// Applicability Engine — pure, deterministic (Phase 2).
//
// For each regulatory requirement it returns exactly one ApplicabilityOutcome
// (APPLICABLE | NOT_APPLICABLE | INSUFFICIENT_DATA) from EXPLICITLY DECLARED
// company facts only.
//
// Hard rules:
//  - Missing / undeclared company data NEVER becomes APPLICABLE. A missing
//    required input → INSUFFICIENT_DATA.
//  - The engine NEVER invents a target population. It only points at the
//    declared source a target would come from (`targetPopulationBasis`), or
//    reports there is none.
//  - It NEVER reads or produces a compliance/verification result — that is
//    Phase 3. It carries each requirement's regulatory `resolution` straight
//    through, so an UNRESOLVED_REQUIREMENT stays unresolved even when the
//    matrix rule marks it potentially applicable.
// =============================================================================

import type {
  ApplicabilityOutcome,
  CanonicalCompanyProfile,
  RegulatoryRequirement,
  RequirementResolution,
} from "@/lib/model";

export interface ApplicabilityResult {
  /** Canonical matrix ID. */
  requirementId: string;
  outcome: ApplicabilityOutcome;
  /** Short diagnostic explanation. */
  reason: string;
  /** The applicability rule / expression that was evaluated. */
  ruleEvaluated: string;
  /** Company profile field paths the decision consulted (present or absent). */
  companyFieldsUsed: string[];
  /**
   * ONLY the company profile inputs that are actually absent AND required to
   * resolve applicability. Distinct from `companyFieldsUsed`. Always `[]` for
   * APPLICABLE / NOT_APPLICABLE; for INSUFFICIENT_DATA it is the exact set of
   * undeclared inputs that block a decision (never a conflict, never a field
   * that is present).
   */
  missingCompanyFields: string[];
  /**
   * The requirement's regulatory resolution, carried through unchanged. Phase 2
   * never resolves regulatory truth — `"UNRESOLVED_REQUIREMENT"` stays so.
   */
  regulatoryResolution: RequirementResolution;
  /** Why the requirement is still regulatorily unresolved, if it is. */
  regulatoryUnresolvedNote: string | null;
  /**
   * Description of the DECLARED source a target population would come from, or
   * `null` when no declared source establishes one. Never a manufactured number.
   */
  targetPopulationBasis: string | null;
}

function unresolvedNote(requirement: RegulatoryRequirement): string | null {
  if (requirement.resolution !== "UNRESOLVED_REQUIREMENT") return null;
  return requirement.unresolved[0] ?? "UNRESOLVED_REQUIREMENT";
}

function result(
  requirement: RegulatoryRequirement,
  outcome: ApplicabilityOutcome,
  reason: string,
  ruleEvaluated: string,
  companyFieldsUsed: string[],
  targetPopulationBasis: string | null = null,
  missingCompanyFields: string[] = [],
): ApplicabilityResult {
  return {
    requirementId: requirement.id,
    outcome,
    reason,
    ruleEvaluated,
    companyFieldsUsed,
    missingCompanyFields: outcome === "INSUFFICIENT_DATA" ? missingCompanyFields : [],
    regulatoryResolution: requirement.resolution,
    regulatoryUnresolvedNote: unresolvedNote(requirement),
    targetPopulationBasis,
  };
}

/** Describes a declared count source without exposing / inventing a number. */
function declaredCountBasis(
  fieldPath: string,
  count: number | null,
  sourceAr: string | null,
): string | null {
  if (count == null) return null;
  return `declared: ${fieldPath}${sourceAr ? ` (source: ${sourceAr})` : ""}`;
}

/** Evaluates one requirement against one company profile. */
export function evaluateApplicability(
  requirement: RegulatoryRequirement,
  profile: CanonicalCompanyProfile,
): ApplicabilityResult {
  const rule = requirement.applicabilityRule;

  // -- DECLARED_SCOPE: the company must declare it is within the named scope ---
  if (rule?.kind === "DECLARED_SCOPE") {
    const ruleEvaluated = `DECLARED_SCOPE(${rule.scopeKey})`;
    const fields = ["declaredFacts.experienceTrackScopeDeclared"];
    const declared = profile.declaredFacts.experienceTrackScopeDeclared;
    if (declared === true) {
      return result(requirement, "APPLICABLE", `Company declared it is within ${rule.scopeKey}.`, ruleEvaluated, fields);
    }
    if (declared === false) {
      return result(
        requirement,
        "NOT_APPLICABLE",
        `Company declared it is NOT within ${rule.scopeKey}.`,
        ruleEvaluated,
        fields,
      );
    }
    return result(
      requirement,
      "INSUFFICIENT_DATA",
      `Scope membership for ${rule.scopeKey} is not declared. Not inferred.`,
      ruleEvaluated,
      fields,
      null,
      fields,
    );
  }

  // -- EXPRESSION: company_responsible_for_camp == true (HAJ-CAMP-01, CIV-*) ---
  if (rule?.kind === "EXPRESSION" && rule.expression === "company_responsible_for_camp == true") {
    const ruleEvaluated = rule.expression;
    const fields = ["declaredFacts.companyResponsibleForCamp"];
    const declared = profile.declaredFacts.companyResponsibleForCamp;
    const camps = profile.camps.filter((c) => c.companyResponsible).map((c) => c.id);
    const basis =
      declared === true && camps.length > 0
        ? `declared: camps[] where companyResponsible == true (${camps.join(", ")})`
        : declared === true
          ? "declared: declaredFacts.companyResponsibleForCamp == true (no camp records listed yet)"
          : null;
    if (declared === true) {
      return result(
        requirement,
        "APPLICABLE",
        "Company declared it is responsible for a camp/site.",
        ruleEvaluated,
        camps.length > 0 ? [...fields, "camps[]"] : fields,
        basis,
      );
    }
    if (declared === false) {
      return result(
        requirement,
        "NOT_APPLICABLE",
        "Company declared it is NOT responsible for any camp/site.",
        ruleEvaluated,
        fields,
      );
    }
    return result(
      requirement,
      "INSUFFICIENT_DATA",
      "companyResponsibleForCamp is not declared. Not inferred.",
      ruleEvaluated,
      fields,
      null,
      fields,
    );
  }

  // -- NARRATIVE: per-requirement handling ------------------------------------
  if (rule?.kind === "NARRATIVE") {
    switch (requirement.id) {
      case "HAJ-CATERING-01": {
        const fields = ["declaredFacts.providesOrEnsuresCatering"];
        const declared = profile.declaredFacts.providesOrEnsuresCatering;
        if (declared === true) {
          return result(
            requirement,
            "APPLICABLE",
            "Company declared it provides or ensures the required catering service.",
            "NARRATIVE(catering responsibility)",
            fields,
          );
        }
        if (declared === false) {
          return result(
            requirement,
            "NOT_APPLICABLE",
            "Company declared it is NOT responsible for providing/ensuring catering.",
            "NARRATIVE(catering responsibility)",
            fields,
          );
        }
        return result(
          requirement,
          "INSUFFICIENT_DATA",
          "Catering responsibility is not declared. Not inferred.",
          "NARRATIVE(catering responsibility)",
          fields,
          null,
          fields,
        );
      }

      case "HAJ-PROVIDERS-01": {
        const fields = ["declaredFacts.contractsExternalServiceProviders", "serviceProviders[]"];
        const declared = profile.declaredFacts.contractsExternalServiceProviders;
        const hasProviderRecords = profile.serviceProviders.length > 0;
        const providerBasis = hasProviderRecords
          ? `declared: serviceProviders[] (${profile.serviceProviders.map((p) => p.id).join(", ")})`
          : declared === true
            ? "declared: declaredFacts.contractsExternalServiceProviders == true (no provider records listed yet)"
            : null;

        if (declared === false && hasProviderRecords) {
          return result(
            requirement,
            "INSUFFICIENT_DATA",
            "Conflict: contractsExternalServiceProviders == false but provider records exist. Not resolved.",
            "NARRATIVE(contracts external service providers)",
            fields,
            null,
            // A conflict, not an absence — no field is "missing".
            [],
          );
        }
        if (declared === false) {
          return result(
            requirement,
            "NOT_APPLICABLE",
            "Company declared it does NOT contract external service providers.",
            "NARRATIVE(contracts external service providers)",
            fields,
          );
        }
        if (declared === true || hasProviderRecords) {
          return result(
            requirement,
            "APPLICABLE",
            "Company contracts external service providers (matrix rule met). NOTE: regulatory company-vs-provider responsibility mapping is UNRESOLVED — no compliance result may be derived in Phase 2.",
            "NARRATIVE(contracts external service providers)",
            fields,
            providerBasis,
          );
        }
        return result(
          requirement,
          "INSUFFICIENT_DATA",
          "Whether the company contracts external service providers is not declared, and no provider records exist. Not inferred.",
          "NARRATIVE(contracts external service providers)",
          fields,
          null,
          // Only the undeclared input blocks the decision; an empty
          // serviceProviders[] is a declared state, not an absent field.
          ["declaredFacts.contractsExternalServiceProviders"],
        );
      }

      case "HAJ-NUSUK-01": {
        const fields = ["nusukApplicablePersons.count"];
        const { count, sourceAr } = profile.nusukApplicablePersons;
        if (count != null) {
          return result(
            requirement,
            "APPLICABLE",
            "Company declared an explicit Nusuk applicable-person roster/count.",
            "NARRATIVE(Nusuk applicable persons) — declared roster/count required",
            fields,
            declaredCountBasis("nusukApplicablePersons", count, sourceAr),
          );
        }
        return result(
          requirement,
          "INSUFFICIENT_DATA",
          "No explicit Nusuk applicable-person roster/count is declared, and the matrix applicability rule is prose-only. Not inferred.",
          "NARRATIVE(Nusuk applicable persons) — declared roster/count required",
          fields,
          null,
          fields,
        );
      }

      case "MOH-01": {
        const fields = ["directContactWorkers.count"];
        const { count, sourceAr } = profile.directContactWorkers;
        if (count != null) {
          return result(
            requirement,
            "APPLICABLE",
            "Company declared a direct-contact worker subset. Applicability is limited to that subset — NOT the whole workforce.",
            "NARRATIVE(direct-contact workers only)",
            fields,
            declaredCountBasis("directContactWorkers", count, sourceAr),
          );
        }
        return result(
          requirement,
          "INSUFFICIENT_DATA",
          "The subset of workers whose roles require direct contact with pilgrims / Umrah performers is not declared. Whole-workforce is NOT assumed.",
          "NARRATIVE(direct-contact workers only)",
          fields,
          null,
          fields,
        );
      }

      default:
        return result(
          requirement,
          "INSUFFICIENT_DATA",
          "Prose-only applicability rule with no declared input mapped for this requirement.",
          "NARRATIVE(unmapped)",
          [],
        );
    }
  }

  // -- No usable applicability rule -----------------------------------------
  return result(
    requirement,
    "INSUFFICIENT_DATA",
    "No machine-evaluable applicability rule is available for this requirement.",
    rule ? `${rule.kind}(unhandled)` : "none",
    [],
  );
}

export function evaluateAllApplicability(
  requirements: RegulatoryRequirement[],
  profile: CanonicalCompanyProfile,
): ApplicabilityResult[] {
  return requirements.map((r) => evaluateApplicability(r, profile));
}

// -- Downstream selectors (Phase 3 exclusion / summaries) -------------------
export function getApplicableRequirementIds(results: ApplicabilityResult[]): string[] {
  return results.filter((r) => r.outcome === "APPLICABLE").map((r) => r.requirementId);
}

export function getNotApplicableRequirementIds(results: ApplicabilityResult[]): string[] {
  return results.filter((r) => r.outcome === "NOT_APPLICABLE").map((r) => r.requirementId);
}

export function getInsufficientDataRequirementIds(results: ApplicabilityResult[]): string[] {
  return results.filter((r) => r.outcome === "INSUFFICIENT_DATA").map((r) => r.requirementId);
}

export function summariseApplicability(results: ApplicabilityResult[]): {
  applicable: string[];
  notApplicable: string[];
  insufficientData: string[];
  stillRegulatorilyUnresolved: string[];
} {
  return {
    applicable: getApplicableRequirementIds(results),
    notApplicable: getNotApplicableRequirementIds(results),
    insufficientData: getInsufficientDataRequirementIds(results),
    stillRegulatorilyUnresolved: results
      .filter((r) => r.regulatoryResolution === "UNRESOLVED_REQUIREMENT")
      .map((r) => r.requirementId),
  };
}
