// =============================================================================
// Emtithal Recommendation — the per-requirement "توصية امتثال".
//
// Pure, deterministic, rule-based. Answers "ما الإجراء الأنسب لهذه الشركة الآن؟"
// for one requirement, from the company's CURRENT context:
//   - the deterministic verification status, applicability, critical-blocker state
//   - the approved per-requirement corrective action (`recommendedActionAr`)
//   - which evidence dimensions are still incomplete
//   - the approved company capability profile (services provided, service
//     locations, workforce, use of external providers, camp responsibility),
//     applied ONLY where it materially scopes the recommended action.
//
// It never invents a capability, never fabricates a regulatory threshold from a
// company number, never contradicts applicability / regulatory truth, and never
// exposes model names, prompts, matching rules or the numbers behind the
// assessment. It is NOT labelled as an AI recommendation.
// =============================================================================

import type { ComplianceStatus } from "@/lib/model";

/** Section label + basis line — the only user-facing framing for the feature. */
export const RECOMMENDATION_HEADING_AR = "توصية امتثال";
export const RECOMMENDATION_BASIS_AR =
  "مبنية على بيانات الشركة الحالية وقدراتها التشغيلية.";

/**
 * Which approved capability fact (if any) materially scopes THIS requirement's
 * corrective action. Requirement metadata, not company data — the value chosen
 * per requirement is fixed; whether it actually fires depends on the company
 * profile passed in.
 */
export type CapabilityAspect =
  | "NONE"
  | "SERVICE_SCOPED" // the action should cover the services the company provides
  | "MULTI_LOCATION" // the action should cover the company's service locations
  | "WORKFORCE_SCALED" // the action covers/scales with the company workforce
  | "PROVIDER_SPLIT" // distinguish company-direct work from provider follow-up
  | "CAMP_RESPONSIBILITY"; // the action depends on who runs the camp

/** Fixed per-requirement capability aspect (canonical IDs). Absent → "NONE". */
export const CAPABILITY_ASPECT_BY_REQUIREMENT: Record<string, CapabilityAspect> = {
  "HAJ-EXP-01": "SERVICE_SCOPED", // صناعة التجربة تمتد عبر الخدمات المقدَّمة فعليًا
  "HAJ-EXP-02": "WORKFORCE_SCALED", // برامج التدريب والترسيخ المعرفي تغطّي القوى العاملة
  "HAJ-EXP-04": "MULTI_LOCATION", // رصد الرحلة يمتد عبر مواقع خدمة الشركة
  "HAJ-EXP-05": "PROVIDER_SPLIT", // توثيق الفعاليات يشمل ما يُنفَّذ عبر المزوّدين
  "HAJ-CAMP-01": "CAMP_RESPONSIBILITY",
};

/** Approved company capability facts (subset actually used here). */
export interface RecommendationCompanyContext {
  servicesAr?: string[];
  locationsAr?: string[];
  workforceSize?: number | null;
  pilgrimsServed?: number | null;
  usesExternalProviders?: boolean | null;
  companyResponsibleForCamp?: boolean | null;
}

export interface ComplianceRecommendationInput {
  /** Canonical requirement ID — selects the capability aspect. */
  requirementId: string;
  /** The requirement's title (canonical wording preferred). */
  titleAr: string;
  /** Deterministic verification status. */
  status: ComplianceStatus;
  applicability: "APPLICABLE" | "NOT_APPLICABLE" | "INSUFFICIENT_DATA";
  /** The requirement is still pending at the regulatory layer (not the company's fault). */
  isUnresolvedRegulatory: boolean;
  /** The requirement is an unresolved critical blocker for this company. */
  isCriticalBlocker: boolean;
  /** The approved deterministic corrective action for this requirement, if any. */
  recommendedActionAr?: string | null;
  /** Labels of evidence dimensions currently missing / unclear for this company. */
  incompleteEvidenceAr?: string[];
  /** Approved company capability profile. */
  company?: RecommendationCompanyContext;
}

export interface ComplianceRecommendationView {
  /** One concise, actionable Arabic sentence. */
  actionAr: string;
  /** true = "no corrective action needed" (informational); false = the company should act. */
  informationalOnly: boolean;
  /** Non-null only when a company-capability fact actually scoped the action. */
  capabilityAspectUsed: Exclude<CapabilityAspect, "NONE"> | null;
}

function evidenceClause(labels: string[] | undefined): string {
  const list = (labels ?? []).filter(Boolean);
  if (list.length === 0) return "الأدلة والبيانات الناقصة";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} و${list[1]}`;
  return `${list[0]} و${list[1]} وبقية العناصر الناقصة`;
}

function joinAr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join("، ")} و${items[items.length - 1]}`;
}

/**
 * A SHORT scoping clause derived from the company profile — added to a corrective
 * action only when the aspect is relevant AND the data supports it. Returns
 * `null` (no clause) otherwise.
 */
function capabilityScopeClause(
  aspect: CapabilityAspect,
  c: RecommendationCompanyContext | undefined,
): { clauseAr: string; aspect: Exclude<CapabilityAspect, "NONE"> } | null {
  if (!c || aspect === "NONE") return null;

  switch (aspect) {
    case "SERVICE_SCOPED": {
      const s = (c.servicesAr ?? []).filter(Boolean);
      return s.length >= 1
        ? { clauseAr: `بما يغطّي خدمات الشركة (${joinAr(s)})`, aspect }
        : null;
    }
    case "MULTI_LOCATION": {
      const l = (c.locationsAr ?? []).filter(Boolean);
      if (l.length < 2) return null; // only meaningful across multiple locations
      return {
        clauseAr:
          l.length <= 3
            ? `عبر مواقع خدمة الشركة (${joinAr(l)})`
            : `عبر مواقع خدمة الشركة الـ${l.length}`,
        aspect,
      };
    }
    case "WORKFORCE_SCALED": {
      const n = c.workforceSize ?? null;
      return n && n > 0
        ? { clauseAr: `بما يشمل تغطية القوى العاملة (${n} موظفًا)`, aspect }
        : null;
    }
    case "PROVIDER_SPLIT": {
      return c.usesExternalProviders
        ? { clauseAr: "مع متابعة ما يُنفَّذ عبر مزوّدي الخدمة", aspect }
        : null;
    }
    case "CAMP_RESPONSIBILITY": {
      if (c.companyResponsibleForCamp == null) return null;
      return {
        clauseAr: c.companyResponsibleForCamp
          ? "باعتبار المخيّم من مسؤولية الشركة المباشرة"
          : "بالتنسيق مع الجهة المسؤولة عن تشغيل المخيّم",
        aspect,
      };
    }
    default:
      return null;
  }
}

/** Appends a scoping clause to a base action, keeping it one sentence. */
function withScope(
  baseAr: string,
  scope: { clauseAr: string; aspect: Exclude<CapabilityAspect, "NONE"> } | null,
): { actionAr: string; capabilityAspectUsed: Exclude<CapabilityAspect, "NONE"> | null } {
  if (!scope) return { actionAr: baseAr, capabilityAspectUsed: null };
  const trimmed = baseAr.replace(/[.،]\s*$/u, "");
  return { actionAr: `${trimmed} ${scope.clauseAr}.`, capabilityAspectUsed: scope.aspect };
}

export function buildComplianceRecommendation(
  input: ComplianceRecommendationInput,
): ComplianceRecommendationView {
  const t = input.titleAr;
  const action = input.recommendedActionAr?.trim() || null;
  const aspect =
    CAPABILITY_ASPECT_BY_REQUIREMENT[input.requirementId] ?? "NONE";
  const scope = capabilityScopeClause(aspect, input.company);

  // Not applicable → no corrective recommendation.
  if (input.applicability === "NOT_APPLICABLE") {
    return {
      actionAr: "هذا المتطلب لا ينطبق على الشركة وفق ملفها الحالي، ولا يتطلب إجراءً.",
      informationalOnly: true,
      capabilityAspectUsed: null,
    };
  }

  // Pending at the regulatory layer → do not tell the company to "fix" it.
  if (input.isUnresolvedRegulatory) {
    return {
      actionAr:
        "المتطلب قيد الاستكمال على مستوى التنظيم؛ لا يلزم من الشركة إجراء تصحيحي حاليًا، وتُتابَع النسخة المعتمدة عند صدورها.",
      informationalOnly: true,
      capabilityAspectUsed: null,
    };
  }

  // Applicability itself could not be established → ask for the profile data.
  if (input.applicability === "INSUFFICIENT_DATA") {
    return {
      actionAr: `أكمل بيانات ملف الشركة المتعلقة بـ«${t}» ليتسنى تحديد انطباق هذا المتطلب.`,
      informationalOnly: false,
      capabilityAspectUsed: null,
    };
  }

  switch (input.status) {
    case "NON_COMPLIANT": {
      if (input.isCriticalBlocker) {
        // Priority is the message — do not dilute with a scoping clause.
        return {
          actionAr: `عائق حرج — ${action ?? `نفّذ الإجراء التصحيحي لمتطلب «${t}»`} كأولوية قصوى قبل أي إجراء آخر.`,
          informationalOnly: false,
          capabilityAspectUsed: null,
        };
      }
      const scoped = withScope(
        action ?? `نفّذ الإجراء التصحيحي ذا الأولوية لمتطلب «${t}» ووثّقه`,
        scope,
      );
      return {
        actionAr: scoped.actionAr.endsWith(".") ? scoped.actionAr : `${scoped.actionAr}.`,
        informationalOnly: false,
        capabilityAspectUsed: scoped.capabilityAspectUsed,
      };
    }

    case "PARTIALLY_COMPLIANT": {
      const scoped = withScope(
        action ?? `أغلِق الفجوة الأبرز في «${t}» ووثّق الإجراء المتّخذ`,
        scope,
      );
      return {
        actionAr: scoped.actionAr.endsWith(".") ? scoped.actionAr : `${scoped.actionAr}.`,
        informationalOnly: false,
        capabilityAspectUsed: scoped.capabilityAspectUsed,
      };
    }

    case "PENDING_VERIFICATION": {
      const scoped = withScope(
        `استكمل اعتماد ${evidenceClause(input.incompleteEvidenceAr)} المرتبطة بـ«${t}» قبل موعد التحقق القادم`,
        scope,
      );
      return {
        actionAr: scoped.actionAr.endsWith(".") ? scoped.actionAr : `${scoped.actionAr}.`,
        informationalOnly: false,
        capabilityAspectUsed: scoped.capabilityAspectUsed,
      };
    }

    case "INSUFFICIENT_DATA":
      return {
        actionAr: `وفّر ${evidenceClause(input.incompleteEvidenceAr)} اللازمة لتقييم «${t}».`,
        informationalOnly: false,
        capabilityAspectUsed: null,
      };

    case "COMPLIANT":
      return {
        actionAr: `حافظ على تحديث السجلات والأدلة المرتبطة بـ«${t}» قبل مواعيد التحقق الدورية.`,
        informationalOnly: false,
        capabilityAspectUsed: null,
      };

    case "NOT_APPLICABLE":
    default:
      return {
        actionAr: "لا يلزم إجراء تصحيحي لهذا المتطلب حاليًا.",
        informationalOnly: true,
        capabilityAspectUsed: null,
      };
  }
}
