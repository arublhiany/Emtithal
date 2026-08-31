// =============================================================================
// Government regulatory-management domain — barrel (Phase 10). Pure / testable.
// No React, no DOM. UI providers wrap `store.ts` reducers.
// =============================================================================

export type {
  ReqLifecycleStatus,
  RequirementOrigin,
  RequirementVersionRecord,
  ManagedRequirement,
  AuditAction,
  AuditEntry,
  RegChangeType,
  CompanyImpactState,
  CompanyImpact,
  ImpactAnalysis,
  RegChangeNotification,
  RequirementVersionInput,
} from "./types";

export {
  LIFECYCLE_TRANSITIONS,
  LIFECYCLE_LABEL_AR,
  canTransition,
  validateVersionInput,
  createNewRequirementDraft,
  issueNewVersionDraft,
  updateDraft,
  activateVersion,
  deactivateRequirement,
  type LifecycleResult,
} from "./lifecycle";

export { AUDIT_ACTION_LABEL_AR, newAuditEntry, auditForRequirement } from "./audit";

export {
  REGMGMT_STORAGE_KEY,
  REGMGMT_SCHEMA_VERSION,
  REGMGMT_LEGACY_KEYS,
  type RegMgmtState,
  type ReducerResult,
  seedRegMgmtState,
  serializeRegMgmt,
  deserializeRegMgmt,
  reduceCreateRequirement,
  reduceIssueVersion,
  reduceUpdateDraft,
  reduceActivateVersion,
  reduceDeactivate,
  reduceRecordNotifications,
  activeVersionOf,
  draftVersionOf,
} from "./store";

export {
  analyzeImpact,
  IMPACT_STATE_LABEL_AR,
  type PortfolioCompany,
} from "./impact";

export {
  REG_CHANGE_TYPE_LABEL_AR,
  buildRegChangeNotifications,
} from "./notifications";

export {
  type ComplianceReport,
  type ReportRequirementRow,
  type BuildReportInput,
  displayValue,
  buildComplianceReport,
  toReportCsv,
  toReportHtml,
} from "./report";
