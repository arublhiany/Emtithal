// =============================================================================
// EMTITHAL — Core domain types (LEGACY MVP shapes)
//
// These shapes still drive every current screen. Phase 1 introduces the
// canonical Finalist model in `@/lib/model`; consumers migrate off these
// legacy shapes in later phases via the adapters in `@/lib/legacy/compat`.
//
// IMPORTANT: weights in this legacy MVP are a DEMO CONFIGURATION (20% × 5
// criteria), not an official Ministry weighting model.
// =============================================================================

/**
 * Legacy lowercase compliance vocabulary. The canonical Finalist statuses are
 * the six uppercase values re-exported below as `ComplianceStatus` (matrix §3).
 * Bridged by `LEGACY_TO_CANONICAL_STATUS` in `@/lib/legacy/compat`.
 * @deprecated migrate to the canonical `ComplianceStatus` in the Phase 3 work.
 */
export type LegacyComplianceStatus =
  | "compliant" // ملتزم
  | "partially_compliant" // ملتزم جزئيًا
  | "non_compliant" // غير ملتزم
  | "needs_review" // يحتاج مراجعة
  | "not_assessed"; // غير مقيّم

/** Canonical Finalist compliance statuses (matrix §3). */
export type { ComplianceStatus } from "@/lib/model";

export type RiskLevel = "critical" | "high" | "medium" | "low" | "none";

export type ConfidenceLevel = "high" | "medium" | "low";

export type EvidenceDimensionState =
  | "found"
  | "missing"
  | "unclear"
  | "pending_verification";

export type EvidenceDimensionKey =
  | "execution"
  | "documentation"
  | "measurement"
  | "supporting_evidence"
  | "completeness";

export type EvidenceFileType = "pdf" | "excel" | "csv" | "word" | "image" | "other";

export type EvidenceValidationStatus =
  | "verified"
  | "pending_verification"
  | "needs_review"
  | "rejected";

export type ActionStatus = "not_started" | "in_progress" | "completed"; // لم يبدأ / قيد التنفيذ / مكتمل

export type ActionPriority = "critical" | "high" | "medium" | "low";

/**
 * Legacy multi-role company model. The Finalist canonical company-facing role
 * is the single value `COMPANY_REPRESENTATIVE` (`CompanyUserRole` in
 * `@/lib/model`). Kept only so the pre-Phase-10 landing page and demo store
 * keep compiling; removed when Phase 10 rebuilds authentication.
 * @deprecated use the canonical `CompanyUserRole`.
 */
export type CompanyRole =
  | "compliance_officer" // مسؤول الامتثال
  | "operations_manager" // مدير العمليات
  | "decision_maker" // صانع القرار
  | "ministry_user"; // مستخدم الوزارة / الجهة الرقابية

export type StandardLifecycleStatus =
  | "draft"
  | "approved"
  | "active"
  | "superseded"
  | "retired";

// -----------------------------------------------------------------------------
// Requirement (regulatory standard / criterion)
// -----------------------------------------------------------------------------

export interface EvidenceDimensionAssessment {
  key: EvidenceDimensionKey;
  labelAr: string;
  state: EvidenceDimensionState;
  note?: string;
}

export interface RequirementVersion {
  version: number;
  effectiveFrom: string; // Hijri or Gregorian label as provided in source docs
  effectiveTo?: string;
  weight: number; // demo points out of 100 total
  status: StandardLifecycleStatus;
  changeNote: string;
}

export interface Requirement {
  id: string; // e.g. CR-001
  nameAr: string;
  descriptionAr: string;
  category: "happiness_team_experience_compliance"; // single MVP track
  source: string;
  sourceReference: string;
  weight: number; // demo points, out of 100 across the 5 criteria
  weightIsOfficial: false; // MVP demo config only — never claim official
  severity: "standard" | "critical";
  assessmentMethod: "hybrid"; // evidence + AI analysis + deterministic rules
  criticalGate: boolean;
  version: number;
  versionHistory: RequirementVersion[];
  status: StandardLifecycleStatus;
  effectiveDate: string;
  lastUpdated: string;

  // Computed / assessed fields (populated by the compliance engine from
  // company evidence — see lib/engine/scoringEngine.ts)
  score: number; // 0-100 achievement for this criterion
  complianceStatus: LegacyComplianceStatus;
  riskLevel: RiskLevel;
  evidenceStatus: EvidenceValidationStatus | "missing";
  lastEvaluation: string;
  gapExplanationAr: string;
  recommendedActionAr: string;
  evidenceDimensions: EvidenceDimensionAssessment[];
  evidenceIds: string[];
  confidence: ConfidenceLevel;
  confidenceReasonAr: string;

  /**
   * Canonical Verification Engine readiness (Phase 3), set when the card is
   * adapted from a canonical result. `null` = not assessable
   * (PENDING_VERIFICATION / INSUFFICIENT_DATA / regulatory-pending) — the UI
   * must render "—" / "بيانات غير كافية", NEVER 0. `undefined` = not adapted.
   */
  canonicalReadiness?: number | null;
}

// -----------------------------------------------------------------------------
// Evidence
// -----------------------------------------------------------------------------

export interface EvidenceExtractedField {
  labelAr: string;
  value: string;
  locationAr?: string; // e.g. "صفحة 4" / "ورقة العمل: staff"
}

export interface EvidenceAIAnalysis {
  summaryAr: string;
  extractedFields: EvidenceExtractedField[];
  matchedRequirementIds: string[];
  missingAr: string[];
  confidence: ConfidenceLevel;
  confidenceReasonAr: string;
}

export interface Evidence {
  id: string;
  companyId: string;
  requirementIds: string[];
  fileName: string;
  fileType: EvidenceFileType;
  uploadedAtLabel: string; // demo label, e.g. "قبل 3 أيام"
  uploadedAt: string; // ISO date
  sizeLabel: string;
  status: "found" | "missing" | "outdated" | "needs_review";
  validationStatus: EvidenceValidationStatus;
  analysis: EvidenceAIAnalysis;
  isDemoUpload?: boolean; // true if added client-side during this demo session
}

// -----------------------------------------------------------------------------
// Gaps & Risks — LEGACY_DEMO_ONLY
//
// These hand-authored demo records feed only the legacy `/company/gaps` and
// `/ministry/risks` pages, kept for visual compatibility until Phase 11. They
// MUST NOT drive canonical dashboard KPIs, readiness, status, or blockers — the
// Verification Engine (`verificationEngine.ts`) is authoritative for those.
// -----------------------------------------------------------------------------

export interface Gap {
  id: string;
  companyId: string;
  requirementId: string;
  titleAr: string;
  currentStateAr: string;
  requiredStateAr: string;
  gapDescriptionAr: string;
  severity: RiskLevel;
  evidenceDeficiencyAr: string;
  operationalImpactAr: string;
  regulatoryRiskAr: string;
  reasonAr: string;
  priority: ActionPriority;
  suggestedActionAr: string;
  detectedAtLabel: string;
  /** Always true — this record is demo-only and never a canonical fact. */
  legacyDemoOnly: true;
}

export interface Risk {
  id: string;
  companyId: string;
  requirementId: string;
  gapId?: string;
  titleAr: string;
  impact: RiskLevel; // severity of consequence
  probability: "high" | "medium" | "low";
  level: RiskLevel; // combined risk level shown on the matrix
  descriptionAr: string;
  methodologyNoteAr: string;
  /** Always true — LEGACY_DEMO_ONLY, never a canonical fact. */
  legacyDemoOnly: true;
}

// -----------------------------------------------------------------------------
// Improvement actions
// -----------------------------------------------------------------------------

export interface ImprovementAction {
  id: string;
  companyId: string;
  gapId: string;
  requirementId: string;
  titleAr: string;
  problemAr: string;
  recommendedActionAr: string;
  priority: ActionPriority;
  responsibleRoleAr: string;
  targetDateLabel: string;
  status: ActionStatus;
  expectedImprovement: number; // expected overall score points gained
}

// -----------------------------------------------------------------------------
// Alerts
// -----------------------------------------------------------------------------

export type AlertType =
  | "critical_gap"
  | "missing_evidence"
  | "evidence_expiring"
  | "requirement_deterioration"
  | "action_overdue"
  | "high_risk_decision";

export interface AlertItem {
  id: string;
  companyId: string;
  type: AlertType;
  titleAr: string;
  descriptionAr: string;
  severity: RiskLevel;
  requirementId?: string;
  createdAtLabel: string;
  isRead: boolean;
}

// -----------------------------------------------------------------------------
// Decision Intelligence
// -----------------------------------------------------------------------------

export type DecisionCategory =
  | "staffing_change"
  | "service_change"
  | "guest_experience_process"
  | "evidence_process_change"
  | "operational_change";

export interface DecisionInput {
  titleAr: string;
  category: DecisionCategory;
  descriptionAr: string;
  magnitudePercent: number; // e.g. -20 for a 20% staffing reduction, +15 for an increase
  affectedAreaAr: string; // e.g. service point / process name
}

export type DecisionImpactDirection = "positive" | "negative" | "uncertain";

export interface RequirementImpact {
  requirementId: string;
  requirementNameAr: string;
  currentScore: number;
  predictedScore: number;
  delta: number;
  riskLevel: RiskLevel;
  explanationAr: string;
  /** Direction of impact — "uncertain" when the mapping lacks strong-enough evidence to assert positive/negative. */
  direction: DecisionImpactDirection;
  /** How confident the mapping between this decision and this requirement is (MASTER_SPEC §27). */
  confidence: ConfidenceLevel;
  /** Which rule/signal justified including this requirement — shown for traceability/auditability. */
  sourceRuleAr: string;
  /**
   * Whether this impact was counted toward `predictedOverallScore`. Low-confidence/"uncertain"
   * impacts are shown for transparency but never move the deterministic overall score
   * (see lib/engine/decisionEngine.ts — a decision can't be presumed to improve or worsen a
   * requirement it has no defensible, content-backed relationship to).
   */
  includedInScore: boolean;
}

export interface DecisionAlternative {
  id: string;
  labelAr: string;
  descriptionAr: string;
  complianceImpact: "positive" | "neutral" | "low_negative" | "high_negative";
  operationalRisk: RiskLevel;
  feasibilityAr: string;
  predictedOverallScore: number;
  isRecommended: boolean;
}

export interface DecisionSimulationResult {
  id: string;
  createdAtLabel: string;
  decision: DecisionInput;
  affectedRequirements: RequirementImpact[];
  currentOverallScore: number;
  predictedOverallScore: number;
  riskLevel: RiskLevel;
  positiveImpactsAr: string[];
  negativeImpactsAr: string[];
  regulatoryGapsAr: string[];
  alternatives: DecisionAlternative[];
  recommendedAlternativeId: string;
  preventiveActionsAr: string[];
  explanationAr: string;
  confidence: ConfidenceLevel;
  confidenceReasonAr: string;
  isSimulatedDemo: true; // always true in MVP — never an official Ministry determination
}

// -----------------------------------------------------------------------------
// Company / capability profile
// -----------------------------------------------------------------------------

export interface CapabilityIndicator {
  key: string;
  labelAr: string;
  value: number; // 0-100, computed from structured fields — never invented by AI
}

export interface CompanyProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  license: string;
  city: string;
  pilgrimsServed: number;
  workforceSize: number;
  supervisors: number;
  serviceLocations: number;
  seasonLabel: string;
  capabilityIndicators: CapabilityIndicator[];
}

export interface MinistryCompanySummary {
  id: string;
  nameAr: string;
  /**
   * LEGACY-COMPAT display number for the current portfolio table. For the demo
   * company this is the canonical Readiness Index (floored to 0 only when the
   * type forbids null). Prefer `readiness` below. Removed at the Phase 10/11
   * government-UI migration.
   */
  overallScore: number;
  /**
   * COMPATIBILITY-ONLY. The Emtithal Readiness Index is NOT a company-wide
   * regulatory compliance status and no approved rule maps it to one — so this
   * is a neutral `"not_assessed"` for canonically-derived rows. Removed at the
   * Phase 10/11 government-UI migration.
   */
  status: LegacyComplianceStatus;
  riskLevel: RiskLevel;
  criticalGaps: number;
  pendingVerification: number;
  correctiveActionsOpen: number;
  lastAssessmentLabel: string;

  // --- Canonical facts (Phase 3), populated for canonically-derived rows -----
  readiness?: number | null;
  verificationCoverage?: number | null;
  criticalBlockerCount?: number;
  regulatoryPendingCount?: number;
  applicabilityPendingCount?: number;
}

// -----------------------------------------------------------------------------
// Support tickets / AI disputes
// -----------------------------------------------------------------------------

export type SupportTicketIssueType =
  | "wrong_document_interpretation"
  | "wrong_requirement_matching"
  | "wrong_extracted_info"
  | "inappropriate_recommendation"
  | "wrong_analysis"
  | "missing_context"
  | "other";

export type SupportTicketStatus =
  | "open"
  | "under_review"
  | "waiting_for_user"
  | "resolved"
  | "closed";

export interface SupportTicket {
  id: string;
  companyId: string;
  createdByRoleAr: string;
  aiResultRefAr: string; // e.g. "تقييم CR-005" or "محاكاة القرار #DS-2"
  issueType: SupportTicketIssueType;
  descriptionAr: string;
  status: SupportTicketStatus;
  createdAtLabel: string;
}

// -----------------------------------------------------------------------------
// Audit trail
// -----------------------------------------------------------------------------

export interface AuditEvent {
  id: string;
  entityRefAr: string;
  previousValueAr: string;
  newValueAr: string;
  userAr: string;
  timestampLabel: string;
  reasonAr: string;
}
