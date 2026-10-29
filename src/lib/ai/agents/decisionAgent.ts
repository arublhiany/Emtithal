// =============================================================================
// Decision Intelligence Agent — Phase 7. Server-side only.
//
// Two AI tasks, INTERPRETATION and RECOMMENDATION — nothing numeric:
//
//   interpretDecision(text)          — natural language → requested operational
//                                       changes (validated against the closed
//                                       canonical field catalog) + assumptions
//                                       + ambiguity. No calculation.
//   simulateDecisionScenarios(text)  — interpret → build CURRENT + up to 3
//                                       scenarios deterministically → run the
//                                       Phase 2/3 engines on cloned profiles →
//                                       deterministic diff → ask the model ONLY
//                                       to explain / recommend among the
//                                       already-computed scenarios.
//
// Deterministic code is authoritative for applicability, verification status,
// readiness, Verification Coverage, critical blockers, gaps, and pending counts.
// The AI never overwrites them, never invents a requirement / weight / penalty /
// integration, never resolves an UNRESOLVED_REQUIREMENT, never marks anything
// verified, and no Official Score is ever computed.
// =============================================================================

import type { AICallMeta, AIClient, AIFailureCode } from "@/lib/ai/client/types";
import type { AIConfidence, CanonicalCompanyProfile } from "@/lib/model";
import { getAuthorities, getRegulatoryRequirements } from "@/lib/data/regulatory";
import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
import { DEMO_VERIFICATION_INPUTS } from "@/lib/data/demo/verificationInputs";
import { getAIClient } from "@/lib/ai/client";
import { scanEvidenceProseForVerdict } from "@/lib/ai/guardrails/sharedGuardrails";
import {
  decisionInterpretationSchema,
  decisionRecommendationSchema,
} from "@/lib/ai/schemas";
import {
  DECISION_FIELD_KIND,
  DECISION_FIELD_LABEL_AR,
  MUTABLE_DECISION_FIELDS,
  buildWhyChangedAr,
  diffAgainst,
  mutationViolatesConstraint,
  readProfileField,
  runDeterministicState,
  validateConstraint,
  validateMutation,
  type DeterministicScenarioState,
  type MutableDecisionField,
  type MutationRejection,
  type ScenarioDiff,
  type ValidatedConstraint,
  type ValidatedMutation,
} from "@/lib/engine/decisionScenarioEngine";

// -- result shapes ---------------------------------------------------

export type DecisionAgentFailureCode =
  | AIFailureCode
  | "UNSUPPORTED_DECISION"
  | "INSUFFICIENT_DECISION_DATA";

export interface DecisionInterpretationView {
  ok: boolean;
  decisionTitleAr: string | null;
  decisionSummaryAr: string | null;
  /** ONLY catalog-valid changes (never a no-op), each with a provenance source. */
  requestedChanges: ValidatedMutation[];
  /** User-stated "keep/same" values. Catalog-validated. Never a scenario mutation. */
  constraints: ValidatedConstraint[];
  /** Changes / constraints the model asked for that were rejected — never silently dropped. */
  rejectedChanges: MutationRejection[];
  assumptionsAr: string[];
  ambiguitiesAr: string[];
  missingInfoAr: string[];
  interpretationConfidence: AIConfidence;
  needsHumanReview: boolean;
  failureCode: DecisionAgentFailureCode | null;
  message: string | null;
  meta: AICallMeta | null;
}

export type ScenarioProvenance = "USER_PROPOSED" | "PHASED_ASSUMPTION" | "CAPACITY_ADJUSTED_ASSUMPTION";

export interface DecisionScenarioView {
  scenarioId: string;
  provenance: ScenarioProvenance;
  titleAr: string;
  state: DeterministicScenarioState;
  diff: ScenarioDiff;
  /** DETERMINISTIC "why did the result change?" — authoritative, built from the diff. */
  whyChangedAr: string[];
  /** Optional supplementary model note (prose-guarded). `null` when none / rejected. */
  aiNoteAr: string | null;
}

export interface DecisionRecommendationView {
  available: boolean;
  recommendedScenarioId: string | null;
  recommendationAr: string | null;
  tradeoffsAr: string[];
  assumptionsAr: string[];
  scenarioExplanations: { scenarioId: string; whyChangedAr: string }[];
  needsHumanReview: boolean;
  failureCode: AIFailureCode | null;
  meta: AICallMeta | null;
}

export interface DecisionSimulationOutput {
  ok: boolean;
  interpretation: DecisionInterpretationView;
  /** CURRENT is deterministic — never AI-generated. */
  current: DeterministicScenarioState;
  scenarios: DecisionScenarioView[];
  recommendation: DecisionRecommendationView;
  /** Enforced invariant. */
  officialScoreComputed: false;
  failureCode: DecisionAgentFailureCode | null;
  message: string | null;
}

export interface DecisionAgentInput {
  /** The company's decision, in natural language (Arabic or English). */
  textAr: string;
  /** Defaults to the canonical demo company profile. Never mutated. */
  profile?: CanonicalCompanyProfile;
}

export interface DecisionAgentOptions {
  client?: AIClient;
}

// -- shared guardrail context -------------------------------------

const APPROVED_REQUIREMENT_IDS = getRegulatoryRequirements().map((r) => r.id);
const APPROVED_AUTHORITY_IDS = getAuthorities().map((a) => a.id);
const GUARDRAIL = {
  approvedRequirementIds: APPROVED_REQUIREMENT_IDS,
  approvedAuthorityIds: APPROVED_AUTHORITY_IDS,
};

// -- 1. interpretation --------------------------------------------

export async function interpretDecision(
  input: DecisionAgentInput,
  opts: DecisionAgentOptions = {},
): Promise<DecisionInterpretationView> {
  const profile = input.profile ?? DEMO_COMPANY_PROFILE;
  const client = opts.client ?? getAIClient();

  const call = await client.generateStructured({
    purpose: "decision-agent-interpret",
    schema: decisionInterpretationSchema,
    system: buildInterpretSystemPrompt(),
    input: buildInterpretContext(profile, input.textAr),
    maxTokens: 2048,
    guardrail: GUARDRAIL,
  });

  if (!call.ok) {
    return {
      ok: false,
      decisionTitleAr: null,
      decisionSummaryAr: null,
      requestedChanges: [],
      constraints: [],
      rejectedChanges: [],
      assumptionsAr: [],
      ambiguitiesAr: [],
      missingInfoAr: [],
      interpretationConfidence: "LOW",
      needsHumanReview: true,
      failureCode: call.failureCode,
      message: "The decision interpretation model call failed.",
      meta: call.meta,
    };
  }

  const llm = call.data;
  const requestedChanges: ValidatedMutation[] = [];
  const constraints: ValidatedConstraint[] = [];
  const rejectedChanges: MutationRejection[] = [];
  let constraintConflict = false;

  // explicit user-stated "keep/same" constraints
  for (const c of llm.constraints) {
    const v = validateConstraint(profile, c.fieldPath, c.expectedValue, c.intentAr);
    if (v.ok) {
      if (!constraints.some((x) => x.fieldPath === v.constraint.fieldPath)) constraints.push(v.constraint);
    } else rejectedChanges.push(v.rejection);
  }

  // requested changes — a value that already equals the current value is NOT a
  // change: fold it in as a USER_STATED constraint instead.
  for (const change of llm.requestedChanges) {
    const v = validateMutation(profile, change.fieldPath, change.toValue, "USER_STATED");
    if (!v.ok) {
      rejectedChanges.push(v.rejection);
      continue;
    }
    const m = v.mutation;
    if (m.scenarioValue === m.currentValue) {
      if (!constraints.some((c) => c.fieldPath === m.fieldPath)) {
        constraints.push({
          fieldPath: m.fieldPath,
          kind: m.kind,
          expectedValue: m.currentValue,
          source: "USER_STATED",
          intentAr: change.intentAr || `الإبقاء على ${m.fieldPath} كما هو`,
        });
      }
      continue;
    }
    requestedChanges.push(m);
  }

  // an explicit change on a field overrides any "keep" constraint on the same field.
  for (const m of requestedChanges) {
    const idx = constraints.findIndex((c) => c.fieldPath === m.fieldPath);
    if (idx !== -1) {
      constraints.splice(idx, 1);
      constraintConflict = true;
    }
  }

  const noValidChange = requestedChanges.length === 0;
  const onlyUnsupported =
    noValidChange &&
    rejectedChanges.length > 0 &&
    rejectedChanges.every((r) => r.code === "UNSUPPORTED_DECISION_VARIABLE");

  const failureCode: DecisionAgentFailureCode | null = noValidChange
    ? onlyUnsupported
      ? "UNSUPPORTED_DECISION"
      : "INSUFFICIENT_DECISION_DATA"
    : null;

  return {
    ok: failureCode === null,
    decisionTitleAr: llm.decisionTitleAr,
    decisionSummaryAr: llm.decisionSummaryAr,
    requestedChanges,
    constraints,
    rejectedChanges,
    assumptionsAr: llm.assumptionsAr,
    ambiguitiesAr: llm.ambiguitiesAr,
    missingInfoAr: llm.missingInfoAr,
    interpretationConfidence: llm.interpretationConfidence,
    needsHumanReview:
      llm.needsHumanReview ||
      rejectedChanges.length > 0 ||
      constraintConflict ||
      llm.ambiguitiesAr.length > 0 ||
      llm.interpretationConfidence === "LOW" ||
      failureCode !== null,
    failureCode,
    message:
      failureCode === "UNSUPPORTED_DECISION"
        ? "The decision does not reference any supported operational variable."
        : failureCode === "INSUFFICIENT_DECISION_DATA"
          ? "No valid operational change could be derived from the decision."
          : null,
    meta: call.meta,
  };
}

// -- 2. full simulation -----------------------------------------

export async function simulateDecisionScenarios(
  input: DecisionAgentInput,
  opts: DecisionAgentOptions = {},
): Promise<DecisionSimulationOutput> {
  const profile = input.profile ?? DEMO_COMPANY_PROFILE;

  // CURRENT is deterministic and always available, even if AI fails entirely.
  const current = runDeterministicState("CURRENT", profile, [], DEMO_VERIFICATION_INPUTS);

  const interpretation = await interpretDecision(input, opts);

  const emptyRecommendation: DecisionRecommendationView = {
    available: false,
    recommendedScenarioId: null,
    recommendationAr: null,
    tradeoffsAr: [],
    assumptionsAr: [],
    scenarioExplanations: [],
    needsHumanReview: true,
    failureCode: null,
    meta: null,
  };

  if (!interpretation.ok) {
    return {
      ok: false,
      interpretation,
      current,
      scenarios: [],
      recommendation: emptyRecommendation,
      officialScoreComputed: false,
      failureCode: interpretation.failureCode,
      message: interpretation.message,
    };
  }

  // -- build up to three scenarios deterministically -----------------
  const specs = buildScenarioSpecs(profile, interpretation.requestedChanges, interpretation.constraints);
  const scenarios: DecisionScenarioView[] = specs.map((spec) => {
    const state = runDeterministicState(spec.scenarioId, profile, spec.mutations, DEMO_VERIFICATION_INPUTS);
    const diff = diffAgainst(current, state);
    return {
      scenarioId: spec.scenarioId,
      provenance: spec.provenance,
      titleAr: spec.titleAr,
      state,
      diff,
      whyChangedAr: buildWhyChangedAr(diff), // deterministic + authoritative
      aiNoteAr: null,
    };
  });

  // -- recommendation / explanation (AI, non-authoritative) ---------
  const client = opts.client ?? getAIClient();
  const recCall = await client.generateStructured({
    purpose: "decision-agent-recommend",
    schema: decisionRecommendationSchema,
    system: buildRecommendSystemPrompt(),
    input: buildRecommendContext(current, scenarios),
    maxTokens: 2048,
    guardrail: GUARDRAIL,
  });

  let recommendation: DecisionRecommendationView;
  if (!recCall.ok) {
    // Deterministic scenarios + diffs are RETAINED; no fabricated prose.
    recommendation = { ...emptyRecommendation, failureCode: recCall.failureCode, meta: recCall.meta };
  } else {
    // -- prose guard: no compliance verdict, no invented KPI number ------
    const proseFields: { path: string; text: string }[] = [
      { path: "recommendationAr", text: recCall.data.recommendationAr },
      ...recCall.data.tradeoffsAr.map((t, i) => ({ path: `tradeoffsAr[${i}]`, text: t })),
      ...recCall.data.assumptionsAr.map((t, i) => ({ path: `assumptionsAr[${i}]`, text: t })),
      ...recCall.data.scenarioExplanations.map((e, i) => ({
        path: `scenarioExplanations[${i}].whyChangedAr`,
        text: e.whyChangedAr,
      })),
    ];
    const verdict = scanEvidenceProseForVerdict(proseFields);
    const kpiClaimField = proseFields.find((f) => proseClaimsKpiNumber(f.text));

    if (!verdict.ok || kpiClaimField) {
      // Discard the whole AI recommendation; keep deterministic scenarios + diffs.
      recommendation = {
        ...emptyRecommendation,
        failureCode: "GUARDRAIL_REJECTED",
        meta: recCall.meta,
      };
    } else {
      const validIds = new Set(scenarios.map((s) => s.scenarioId));
      const recId =
        recCall.data.recommendedScenarioId && validIds.has(recCall.data.recommendedScenarioId)
          ? recCall.data.recommendedScenarioId
          : null;
      const recScenario = scenarios.find((s) => s.scenarioId === recId) ?? null;
      const explanations = recCall.data.scenarioExplanations.filter((e) => validIds.has(e.scenarioId));

      // attach the optional model note to its scenario view
      for (const e of explanations) {
        const view = scenarios.find((s) => s.scenarioId === e.scenarioId);
        if (view) view.aiNoteAr = e.whyChangedAr;
      }

      const recUsesAssumption =
        recScenario?.state.mutations.some((m) => m.source === "SCENARIO_ASSUMPTION") ?? false;

      recommendation = {
        available: true,
        recommendedScenarioId: recId,
        recommendationAr: recCall.data.recommendationAr,
        tradeoffsAr: recCall.data.tradeoffsAr,
        assumptionsAr: recCall.data.assumptionsAr,
        scenarioExplanations: explanations,
        // review follows the RECOMMENDED scenario — not an unselected alternative.
        needsHumanReview:
          recCall.data.needsHumanReview ||
          interpretation.needsHumanReview ||
          recId === null ||
          recUsesAssumption ||
          (recScenario?.diff.blockersAdded.length ?? 0) > 0 ||
          (recScenario?.diff.unresolvedRequirementIds.length ?? 0) > 0,
        failureCode: null,
        meta: recCall.meta,
      };
    }
  }

  return {
    ok: true,
    interpretation,
    current,
    scenarios,
    recommendation,
    officialScoreComputed: false,
    failureCode: null,
    message: null,
  };
}

// -- deterministic scenario specs ------------------------------

interface ScenarioSpec {
  scenarioId: "A" | "B" | "C";
  provenance: ScenarioProvenance;
  titleAr: string;
  mutations: ValidatedMutation[];
}

/**
 * True when recommendation/explanation prose asserts a readiness / coverage
 * number (or any bare percentage). The UI already carries the deterministic KPI
 * values; the AI must not restate or invent them.
 */
function proseClaimsKpiNumber(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  if (/\d{1,3}\s*%/.test(t)) return true;
  const KPI = "الجاهزيه|الجاهزية|جاهزيه|جاهزية|readiness|التغطيه|التغطية|تغطيه|تغطية|coverage|نسبه التحقق|نسبة التحقق";
  if (new RegExp(`(${KPI})[^.\\n]{0,15}\\d`).test(t)) return true;
  if (new RegExp(`\\d[^.\\n]{0,15}(${KPI})`).test(t)) return true;
  return false;
}

const mutKey = (m: ValidatedMutation) => `${m.fieldPath}=${String(m.scenarioValue)}`;
const sameMutationSet = (a: ValidatedMutation[], b: ValidatedMutation[]) => {
  const sa = a.map(mutKey).sort().join("|");
  const sb = b.map(mutKey).sort().join("|");
  return sa === sb;
};

function buildScenarioSpecs(
  profile: CanonicalCompanyProfile,
  userChanges: ValidatedMutation[],
  constraints: ValidatedConstraint[],
): ScenarioSpec[] {
  const constrainedFields = new Set(constraints.map((c) => c.fieldPath));
  const A: ScenarioSpec = {
    scenarioId: "A",
    provenance: "USER_PROPOSED",
    titleAr: "السيناريو أ — القرار كما اقترحته الشركة",
    mutations: userChanges,
  };

  // B — phased: numeric changes halved (SCENARIO_ASSUMPTION); boolean flips deferred.
  const bMutations: ValidatedMutation[] = [];
  for (const m of userChanges) {
    if (
      m.kind === "COUNT" &&
      typeof m.currentValue === "number" &&
      typeof m.scenarioValue === "number" &&
      m.scenarioValue !== m.currentValue
    ) {
      const half = m.currentValue + Math.round((m.scenarioValue - m.currentValue) / 2);
      if (half !== m.currentValue) {
        bMutations.push({ ...m, scenarioValue: half, source: "SCENARIO_ASSUMPTION" });
      }
    }
    // boolean flips → not carried into the phased scenario (conservative).
  }
  const B: ScenarioSpec = {
    scenarioId: "B",
    provenance: "PHASED_ASSUMPTION",
    titleAr: "السيناريو ب — تنفيذ تدريجي (نصف مقدار التغيير — فرضية محاكاة)",
    mutations: bMutations,
  };

  // C — capacity-adjusted: A's changes + a proportional workforce assumption when
  // a served-volume field rises and workforce is declared, not user-changed, and
  // NOT held fixed by a user constraint.
  const cMutations: ValidatedMutation[] = [...userChanges];
  const workforceLocked =
    userChanges.some((m) => m.fieldPath === "workforce.count") ||
    constrainedFields.has("workforce.count");
  const currentWorkforce = readProfileField(profile, "workforce.count");
  for (const m of userChanges) {
    const isVolume =
      m.fieldPath === "pilgrims.count" || m.fieldPath === "nusukApplicablePersons.count";
    if (
      isVolume &&
      !workforceLocked &&
      typeof currentWorkforce === "number" &&
      currentWorkforce > 0 &&
      typeof m.currentValue === "number" &&
      m.currentValue > 0 &&
      typeof m.scenarioValue === "number" &&
      m.scenarioValue > m.currentValue
    ) {
      const scaled = Math.round(currentWorkforce * (m.scenarioValue / m.currentValue));
      cMutations.push({
        fieldPath: "workforce.count",
        kind: "COUNT",
        currentValue: currentWorkforce,
        scenarioValue: scaled,
        source: "SCENARIO_ASSUMPTION",
      });
      break;
    }
  }
  const C: ScenarioSpec = {
    scenarioId: "C",
    provenance: "CAPACITY_ADJUSTED_ASSUMPTION",
    titleAr: "السيناريو ج — تعديل السعة المصاحب (فرضية محاكاة لموازنة القوى العاملة)",
    mutations: cMutations,
  };

  // A scenario is dropped if ANY of its mutations would break a user-stated
  // constraint (a value equal to the constrained value is stripped as a no-op).
  const respectsConstraints = (spec: ScenarioSpec): ScenarioSpec | null => {
    const kept: ValidatedMutation[] = [];
    for (const m of spec.mutations) {
      const violated = mutationViolatesConstraint(m, constraints);
      if (violated) return null; // whole scenario is not emitted
      if (constrainedFields.has(m.fieldPath)) continue; // no-op against the constraint
      kept.push(m);
    }
    return { ...spec, mutations: kept };
  };

  // Always keep A; keep B / C only when they respect constraints and differ from
  // A and from each other.
  const specs: ScenarioSpec[] = [];
  const a = respectsConstraints(A);
  if (a) specs.push(a);
  const b = respectsConstraints(B);
  if (b && b.mutations.length > 0 && !specs.some((s) => sameMutationSet(s.mutations, b.mutations)))
    specs.push(b);
  const c = respectsConstraints(C);
  if (c && c.mutations.length > 0 && !specs.some((s) => sameMutationSet(s.mutations, c.mutations)))
    specs.push(c);
  return specs;
}

// -- prompts --------------------------------------------------

function fieldCatalogLines(profile: CanonicalCompanyProfile): string {
  return MUTABLE_DECISION_FIELDS.map((f) => {
    const path = f as MutableDecisionField;
    return `- ${path} [${DECISION_FIELD_KIND[path]}] — ${DECISION_FIELD_LABEL_AR[path]} — القيمة الحالية: ${JSON.stringify(
      readProfileField(profile, path),
    )}`;
  }).join("\n");
}

function buildInterpretSystemPrompt(): string {
  return [
    'أنت طبقة تفسير في منصة "سبّاق". مهمتك تحويل قرار تشغيلي مكتوب بلغة طبيعية إلى تغييرات مطلوبة على حقول ملف الشركة المعتمدة فقط.',
    "لا تحسب امتثالًا ولا جاهزية ولا تغطية ولا حالة معيار. لا تخترع متطلبًا أو وزنًا أو غرامة أو تكاملًا حكوميًا. لا تحسم متطلبًا غير محسوم.",
    "requestedChanges: كل عنصر {fieldPath, toValue, intentAr}. يُدرَج هنا فقط الحقل الذي يريد المستخدم تغيير قيمته إلى قيمة مختلفة عن الحالية.",
    'constraints: كل عنصر {fieldPath, expectedValue, intentAr}. يُدرَج هنا الحقل الذي يريد المستخدم إبقاءه ثابتًا (مثل "مع بقاء عدد القوى العاملة 180"). لا تضع الحقل نفسه في requestedChanges و constraints معًا.',
    "fieldPath في الحالتين يجب أن يكون حرفيًا أحد مسارات الحقول المعتمدة المذكورة في السياق فقط. القيمة نص (رقم أو true/false).",
    "إن طلب المستخدم تغيير حقل خارج القائمة، ضعه كما فهمته وسيُرفض لاحقًا؛ لا تعيد تسميته إلى حقل آخر.",
    "assumptionsAr: أي افتراض اضطررت إليه. ambiguitiesAr: أي غموض في الطلب. missingInfoAr: بيانات ناقصة لازمة.",
    "interpretationConfidence: HIGH | MEDIUM | LOW (جودة الفهم فقط). needsHumanReview: منطقية.",
    "",
    "أعِد كائن JSON واحدًا فقط بالمفاتيح: decisionTitleAr, decisionSummaryAr, requestedChanges, constraints, assumptionsAr, ambiguitiesAr, missingInfoAr, interpretationConfidence, needsHumanReview.",
  ].join("\n");
}

function buildInterpretContext(profile: CanonicalCompanyProfile, textAr: string): string {
  return [
    "حقول ملف الشركة المعتمدة القابلة للمحاكاة (استخدم هذه المسارات حرفيًا فقط):",
    fieldCatalogLines(profile),
    "",
    `قرار الشركة (نص طبيعي): ${textAr}`,
    "",
    "أعِد كائن JSON واحدًا فقط بالبنية الموضحة في تعليمات النظام.",
  ].join("\n");
}

function buildRecommendSystemPrompt(): string {
  return [
    'أنت طبقة شرح وتوصية في منصة "سبّاق". النتائج الرقمية أدناه حُسبت حتميًا بالكامل — لا تعدّلها ولا تعِد حسابها.',
    "دورك: (1) شرح لماذا تغيّرت النتيجة في كل سيناريو استنادًا فقط إلى فرق الحساب المرفق (scenarioExplanations)، (2) التوصية بأفضل سيناريو قابل للتنفيذ أو null.",
    "لا تختر السيناريو صاحب أعلى رقم جاهزية تلقائيًا: سيناريو يضيف عائقًا حرجًا أو يعتمد على فرضيات جوهرية غير مؤكدة قد يكون أسوأ رغم تحسّن مؤشر واحد.",
    "recommendedScenarioId يجب أن يكون أحد معرّفات السيناريوهات المذكورة أو null. لا تخترع معرّفًا.",
    "لا تُصدر حكم امتثال إيجابيًا أو سلبيًا (مثل \"الشركة ملتزمة\" أو \"غير ملتزمة\" أو \"compliant\" أو \"non-compliant\")، ولا وزنًا رسميًا، ولا غرامة، ولا تكاملًا حكوميًا، ولا تحسم متطلبًا غير محسوم، ولا تحسب Official Score.",
    "لا تذكر أي رقم للجاهزية أو نسبة التحقق ولا أي نسبة مئوية — الأرقام الحتمية معروضة أصلًا في النتيجة؛ اكتفِ بوصف نوعي (ارتفع/انخفض/لم يتغيّر).",
    "",
    "أعِد كائن JSON واحدًا فقط بالمفاتيح: recommendedScenarioId, recommendationAr, tradeoffsAr, assumptionsAr, scenarioExplanations, needsHumanReview.",
  ].join("\n");
}

function kpiLine(label: string, s: DeterministicScenarioState): string {
  const k = s.kpis;
  return `${label}: جاهزية=${k.readiness ?? "—"} تغطية=${k.coverage ?? "—"} عوائق حرجة=[${k.criticalBlockerIds.join(
    ",",
  )}] فجوات تحقق=[${k.verificationGapIds.join(",")}] متطلبات غير محسومة=[${k.regulatoryPendingIds.join(
    ",",
  )}] انطباق غير مؤكد=[${k.applicabilityPendingIds.join(",")}]`;
}

function buildRecommendContext(
  current: DeterministicScenarioState,
  scenarios: DecisionScenarioView[],
): string {
  const lines: string[] = [
    "النتيجة الحالية (CURRENT) — حتمية:",
    kpiLine("CURRENT", current),
    "",
    "السيناريوهات المحسوبة حتميًا:",
  ];
  for (const sc of scenarios) {
    const d = sc.diff;
    lines.push(
      "",
      `[${sc.scenarioId}] ${sc.titleAr} (مصدر: ${sc.provenance})`,
      kpiLine(sc.scenarioId, sc.state),
      `  الحقول المتغيرة: ${
        d.fieldsChanged
          .map((m) => `${m.fieldPath}:${String(m.currentValue)}→${String(m.scenarioValue)} (${m.source})`)
          .join("، ") || "—"
      }`,
      `  تغيّر الانطباق: ${
        d.applicabilityChanges.map((c) => `${c.requirementId}:${c.from}→${c.to}`).join("، ") || "—"
      }`,
      `  تغيّر حالة التحقق: ${
        d.verificationStatusChanges.map((c) => `${c.requirementId}:${c.from}→${c.to}`).join("، ") || "—"
      }`,
      `  فرق الجاهزية (خام): ${d.readinessDelta ?? "—"} / فرق التغطية (خام): ${d.coverageDelta ?? "—"}`,
      `  عوائق حرجة مضافة: [${d.blockersAdded.join(",")}] / مُزالة: [${d.blockersRemoved.join(",")}]`,
      `  متطلبات غير محسومة ضمن التغيير: [${d.unresolvedRequirementIds.join(",")}]`,
      `  مصادر تنظيمية: ${
        d.sourceLineage
          .map((l) => `${l.requirementId} (${l.authorityId}, ${l.regulatoryResolution}, ${l.locatorStatus ?? "—"})`)
          .join("؛ ") || "—"
      }`,
    );
  }
  lines.push(
    "",
    "أعِد كائن JSON واحدًا فقط بالبنية الموضحة في تعليمات النظام. scenarioExplanations يجب أن تشير فقط إلى معرّفات السيناريوهات أعلاه.",
  );
  return lines.join("\n");
}

/** Re-export so callers get the whole deterministic surface from one module. */
export { requirementLineage } from "@/lib/engine/decisionScenarioEngine";
