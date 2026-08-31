// =============================================================================
// Regulatory Intelligence Agent — Phase 5. Server-side only.
//
// Retrieves the correct approved regulatory requirement(s), then asks the LLM
// ONLY to interpret / explain them. The deterministic engines stay authoritative
// for every regulatory outcome:
//   - applicability outcome         → src/lib/engine/applicabilityEngine.ts
//   - compliance status / readiness / coverage / blockers / weights / targets
//     → the verification engine (the agent never touches them)
//
// The agent may explain a deterministic result; it may never replace one.
//
// Closed world: only src/lib/data/regulatory/** + the canonical model. No web,
// no invented regulations, no invented sources. A question the corpus does not
// support returns a controlled OUT_OF_CORPUS result — never a plausible-sounding
// regulation. An UNRESOLVED_REQUIREMENT (HAJ-PROVIDERS-01, MOH-01) stays
// unresolved — the agent explains WHY, it does not resolve it.
// =============================================================================

import type {
  AIConfidence,
  ApplicabilityOutcome,
  AuthorityId,
  CanonicalCompanyProfile,
  LocatorStatus,
  RegulatoryRequirement,
  RegulatoryState,
} from "@/lib/model";
import { getAuthorities, getRequirementByCanonicalId } from "@/lib/data/regulatory";
import { evaluateApplicability, type ApplicabilityResult } from "@/lib/engine/applicabilityEngine";
import type { AIClient, AICallMeta, AIFailureCode } from "@/lib/ai/client/types";
import { getAIClient } from "@/lib/ai/client";
import { regulatoryAgentAnswerSchema } from "@/lib/ai/schemas";
import {
  retrieveCandidates,
  normalizeText,
  CORPUS_SEASON,
  type RegulatoryRetrievalQuery,
  type RetrievalResult,
} from "./regulatoryRetrieval";

// -- result shape ----------------------------------------------------------

export type RegulatoryAgentFailureCode =
  | AIFailureCode
  | "OUT_OF_CORPUS"
  | "SEASON_MISMATCH"
  | "AMBIGUOUS_RETRIEVAL";

/** Exact source lineage for one cited requirement — copied from canonical data. */
export interface SourceLineage {
  requirementId: string;
  titleAr: string;
  authorityId: AuthorityId;
  authorityNameAr: string;
  officialSourceReference: string | null;
  officialSourceUrls: string[];
  officialSourceLocatorNote: string | null;
  /** Explicit canonical locator verification from the source data. `null` when there is no source. */
  locatorStatus: LocatorStatus | null;
  /** Derived ONLY from `locatorStatus === "VERIFIED_COMPLETE"` — never from `locatorNote`. */
  locatorComplete: boolean;
  matrixSourceRef: string;
  resolution: "SPECIFIED" | "UNRESOLVED_REQUIREMENT";
  season: string;
}

export interface RegulatoryAgentResult {
  /** true only when a schema- and guardrail-valid LLM interpretation was produced. */
  ok: boolean;
  /** Arabic explanation. `null` on every failure — no fabricated regulatory answer. */
  answerAr: string | null;
  /** Canonical requirement IDs — from deterministic retrieval, never the LLM. */
  requirementIds: string[];
  /** Exact lineage for each cited requirement. */
  sources: SourceLineage[];
  confidence: AIConfidence;
  confidenceReasonAr: string;
  regulatoryState: RegulatoryState;
  needsHumanReview: boolean;
  missingInformation: string[];
  /** Present for a company-specific applicability question; the engine's outcome. */
  deterministicApplicability: DeterministicApplicabilityView | null;
  /** LLM prose explaining the deterministic applicability outcome, when relevant. */
  applicabilityExplanationAr: string | null;
  season: string;
  failureCode: RegulatoryAgentFailureCode | null;
  /** Everything retrieval surfaced (superset of `requirementIds` when ambiguous). */
  candidateRequirementIds: string[];
  ambiguous: boolean;
  /** Safe call metadata when the LLM was invoked; `null` for deterministic-only outcomes. */
  meta: AICallMeta | null;
}

/** The engine's applicability outcome, passed through immutably. */
export interface DeterministicApplicabilityView {
  requirementId: string;
  companyId: string;
  outcome: ApplicabilityOutcome;
  reason: string;
  ruleEvaluated: string;
  /** Fields the rule consulted (present or absent) — informational only. */
  companyFieldsUsed: string[];
  /** The EXACT absent required inputs (empty unless INSUFFICIENT_DATA). Seeds `missingInformation`. */
  missingCompanyFields: string[];
  regulatoryResolution: "SPECIFIED" | "UNRESOLVED_REQUIREMENT";
  targetPopulationBasis: string | null;
}

export interface RegulatoryAgentOptions {
  /** Injectable for tests. Defaults to the shared server-side client. */
  client?: AIClient;
}

// -- public API ----------------------------------------------------------

/** Free-form regulatory question. Retrieval decides whether the LLM is called. */
export async function answerRegulatoryQuestion(
  query: RegulatoryRetrievalQuery,
  opts: RegulatoryAgentOptions = {},
): Promise<RegulatoryAgentResult> {
  const retrieval = retrieveCandidates(query);
  return runFromRetrieval(retrieval, { queryText: query.text ?? null }, opts);
}

/** Explain one approved requirement (canonical ID or legacy alias). */
export async function explainRequirement(
  requirementIdOrAlias: string,
  opts: RegulatoryAgentOptions = {},
): Promise<RegulatoryAgentResult> {
  const retrieval = retrieveCandidates({ requirementId: requirementIdOrAlias });
  return runFromRetrieval(
    retrieval,
    { queryText: `اشرح المتطلب ${requirementIdOrAlias}` },
    opts,
  );
}

/**
 * Explain, for one company, why the DETERMINISTIC applicability outcome occurred.
 * The engine runs first; its outcome is immutable context for the LLM.
 */
export async function explainApplicability(
  args: { requirementIdOrAlias: string; profile: CanonicalCompanyProfile },
  opts: RegulatoryAgentOptions = {},
): Promise<RegulatoryAgentResult> {
  const retrieval = retrieveCandidates({ requirementId: args.requirementIdOrAlias });
  return runFromRetrieval(
    retrieval,
    { queryText: `اشرح انطباق المتطلب ${args.requirementIdOrAlias}`, profile: args.profile },
    opts,
  );
}

// -- orchestration -----------------------------------------------------

const AUTHORITY_IDS: AuthorityId[] = getAuthorities().map((a) => a.id);
const AUTHORITY_NAME: Record<string, string> = Object.fromEntries(
  getAuthorities().map((a) => [a.id, a.nameAr]),
);

interface RunContext {
  queryText: string | null;
  profile?: CanonicalCompanyProfile;
}

function lineageFor(req: RegulatoryRequirement): SourceLineage {
  const src = req.officialSource;
  return {
    requirementId: req.id,
    titleAr: req.titleAr,
    authorityId: req.authorityId,
    authorityNameAr: AUTHORITY_NAME[req.authorityId] ?? req.authorityId,
    officialSourceReference: src ? src.reference : null,
    officialSourceUrls: src ? [...src.urls] : [],
    officialSourceLocatorNote: src ? src.locatorNote : null,
    locatorStatus: src ? src.locatorStatus : null,
    // Explicit canonical field only — NEVER inferred from `locatorNote`.
    locatorComplete: src != null && src.locatorStatus === "VERIFIED_COMPLETE",
    matrixSourceRef: req.matrixSourceRef,
    resolution: req.resolution,
    season: req.season,
  };
}

function deterministicResult(
  partial: Partial<RegulatoryAgentResult> &
    Pick<RegulatoryAgentResult, "regulatoryState" | "confidenceReasonAr" | "failureCode">,
): RegulatoryAgentResult {
  return {
    ok: false,
    answerAr: null,
    requirementIds: [],
    sources: [],
    confidence: "LOW",
    needsHumanReview: true,
    missingInformation: [],
    deterministicApplicability: null,
    applicabilityExplanationAr: null,
    season: CORPUS_SEASON,
    candidateRequirementIds: [],
    ambiguous: false,
    meta: null,
    ...partial,
  };
}

async function runFromRetrieval(
  retrieval: RetrievalResult,
  ctx: RunContext,
  opts: RegulatoryAgentOptions,
): Promise<RegulatoryAgentResult> {
  if (retrieval.kind === "SEASON_MISMATCH") {
    return deterministicResult({
      regulatoryState: "OUT_OF_CORPUS",
      failureCode: "SEASON_MISMATCH",
      confidenceReasonAr: `النطاق التنظيمي المعتمد هو موسم ${CORPUS_SEASON} فقط. ${retrieval.reason} لا يُستنتج متطلب من موسم آخر. الثقة LOW هنا تعني ضعف القدرة على الإجابة من النطاق المعتمد، لا ثقة منخفضة بلائحة قائمة. تلزم مراجعة بشرية.`,
      season: retrieval.requestedSeason ?? CORPUS_SEASON,
    });
  }

  if (retrieval.kind === "NONE") {
    return deterministicResult({
      regulatoryState: "OUT_OF_CORPUS",
      failureCode: "OUT_OF_CORPUS",
      confidenceReasonAr:
        "السؤال خارج النطاق التنظيمي المعتمد في امتثال (موسم 1447هـ). لا تُقدَّم إجابة تنظيمية ولا تُنشأ لائحة افتراضية. الثقة LOW هنا تعني ضعف القدرة على الإجابة من النطاق المعتمد، وليست ثقة منخفضة بلائحة قائمة. تلزم مراجعة بشرية.",
    });
  }

  if (retrieval.kind === "AMBIGUOUS") {
    const cands = retrieval.candidateIds
      .map((id) => getRequirementByCanonicalId(id))
      .filter((r): r is RegulatoryRequirement => r != null);
    return deterministicResult({
      regulatoryState: cands.every((r) => r.resolution === "UNRESOLVED_REQUIREMENT")
        ? "UNRESOLVED_REQUIREMENT"
        : "SPECIFIED",
      failureCode: "AMBIGUOUS_RETRIEVAL",
      confidenceReasonAr: `ثقة منخفضة: أكثر من متطلب معتمد قد ينطبق: ${cands
        .map((r) => `${r.id} (${r.titleAr})`)
        .join("، ")}. لن يُختار متطلب واحد تلقائيًا — مطلوب توضيح من المستخدم ومراجعة بشرية.`,
      sources: cands.map(lineageFor),
      candidateRequirementIds: retrieval.candidateIds,
      ambiguous: true,
    });
  }

  // -- MATCH: exactly one canonical requirement --------------------------
  const req = getRequirementByCanonicalId(retrieval.candidateIds[0]);
  if (!req) {
    return deterministicResult({
      regulatoryState: "OUT_OF_CORPUS",
      failureCode: "OUT_OF_CORPUS",
      confidenceReasonAr: "تعذّر تحميل بطاقة المتطلب المعتمد.",
    });
  }

  const lineage = lineageFor(req);
  const regulatoryState: RegulatoryState =
    req.resolution === "UNRESOLVED_REQUIREMENT" ? "UNRESOLVED_REQUIREMENT" : "SPECIFIED";

  // Deterministic applicability first (company-specific only).
  let applicability: ApplicabilityResult | null = null;
  let applicabilityView: DeterministicApplicabilityView | null = null;
  if (ctx.profile) {
    applicability = evaluateApplicability(req, ctx.profile);
    applicabilityView = {
      requirementId: req.id,
      companyId: ctx.profile.companyId,
      outcome: applicability.outcome,
      reason: applicability.reason,
      ruleEvaluated: applicability.ruleEvaluated,
      companyFieldsUsed: applicability.companyFieldsUsed,
      missingCompanyFields: applicability.missingCompanyFields,
      regulatoryResolution: applicability.regulatoryResolution,
      targetPopulationBasis: applicability.targetPopulationBasis,
    };
  }

  const client = opts.client ?? getAIClient();
  const system = buildSystemPrompt();
  const input = buildContextBlock(req, ctx, applicability);

  const call = await client.generateStructured({
    purpose: "regulatory-agent",
    schema: regulatoryAgentAnswerSchema,
    system,
    input,
    // Headroom for an Arabic answer + reason alongside a model's own reasoning
    // budget; the shared client still caps at one retry on malformed output.
    maxTokens: 2048,
    guardrail: {
      approvedRequirementIds: [req.id],
      approvedAuthorityIds: AUTHORITY_IDS,
    },
  });

  // Deterministic missing inputs — ONLY the engine's exact `missingCompanyFields`
  // (never `companyFieldsUsed`, which also lists fields that ARE present).
  const missingFromEngine = applicability
    ? applicability.missingCompanyFields.map((f) => `حقل ملف الشركة غير مُعلن: ${f}`)
    : [];

  const canonicalApplicabilityStmt =
    ctx.profile && applicability ? APPLICABILITY_STATEMENT_AR[applicability.outcome] : null;

  if (!call.ok) {
    return {
      ok: false,
      answerAr: null,
      requirementIds: [req.id],
      sources: [lineage],
      confidence: "LOW",
      confidenceReasonAr: `ثقة منخفضة: تعذّر إنتاج تفسير من النموذج (${call.failureCode}). لم تُقدَّم أي إجابة تنظيمية؛ المصدر الرسمي مرفق من البيانات المعتمدة. تلزم مراجعة بشرية.`,
      regulatoryState,
      needsHumanReview: true,
      missingInformation: missingFromEngine,
      deterministicApplicability: applicabilityView,
      // Deterministic statement only — no model prose is available.
      applicabilityExplanationAr: canonicalApplicabilityStmt,
      season: req.season,
      failureCode: call.failureCode,
      candidateRequirementIds: retrieval.candidateIds,
      ambiguous: false,
      meta: call.meta,
    };
  }

  // -- assemble: deterministic truth on top, model prose only as detail ---
  const llm = call.data;

  // missingInformation: the deterministic engine fields come FIRST and always
  // survive; the model's list is ADDITIVE only and can never remove them.
  const missingInformation = dedupe([...missingFromEngine, ...llm.missingInformation]);

  // Canonical confidence is set ENTIRELY by code (locked rules). The model has
  // no confidence field and cannot raise or lower it.
  const confidence = matchConfidence({
    regulatoryState,
    locatorComplete: lineage.locatorComplete,
    llmProducedAnswer: true,
  });
  const reasonParts = [matchConfidenceReason(confidence, req)];

  // Applicability: the deterministic canonical statement is authoritative. Model
  // prose (the explanation AND the free-text answer) is surfaced ONLY when it
  // does not assert a contradictory applicability outcome; a contradictory claim
  // is replaced with the canonical statement, never shown.
  let answerAr = llm.answerAr;
  let applicabilityExplanationAr: string | null = null;
  if (canonicalApplicabilityStmt && applicability) {
    const detail = (llm.applicabilityExplanationAr ?? "").trim();
    const detailConflicts = detail !== "" && contradictsOutcome(detail, applicability.outcome);
    const answerConflicts = contradictsOutcome(answerAr, applicability.outcome);

    applicabilityExplanationAr =
      detail === "" || detailConflicts
        ? canonicalApplicabilityStmt
        : `${canonicalApplicabilityStmt} ${detail}`;

    if (answerConflicts) answerAr = canonicalApplicabilityStmt;
    if (detailConflicts || answerConflicts) {
      reasonParts.push("جرى تجاهل تفسير غير متسق من المساعد مع نتيجة الانطباق الحتمية.");
    }
  }

  return {
    ok: true,
    answerAr,
    requirementIds: [req.id],
    sources: [lineage],
    confidence,
    confidenceReasonAr: reasonParts.join(" "),
    regulatoryState,
    needsHumanReview: confidence !== "HIGH",
    missingInformation,
    deterministicApplicability: applicabilityView,
    applicabilityExplanationAr,
    season: req.season,
    failureCode: null,
    candidateRequirementIds: retrieval.candidateIds,
    ambiguous: false,
    meta: call.meta,
  };
}

// -- deterministic confidence (locked Phase 5 rules) -----------------
//
// Canonical confidence is derived only from retrieval / regulatory-state /
// source-lineage conditions. There is no model confidence input, no numeric
// score, and no invented threshold. Confidence is about the ability to answer
// from the approved corpus — not certainty about a regulation or compliance.
//   HIGH   — one clear SPECIFIED requirement, complete official-source locator,
//            an answer was produced, no material ambiguity
//   MEDIUM — SPECIFIED and the requirement identity is clear, but the official
//            source locator/detail is incomplete
//   LOW    — UNRESOLVED_REQUIREMENT, unresolved ambiguity, no answer produced,
//            OUT_OF_CORPUS / SEASON_MISMATCH (handled in `deterministicResult`)

interface MatchConfidenceInput {
  regulatoryState: RegulatoryState;
  locatorComplete: boolean;
  llmProducedAnswer: boolean;
}

function matchConfidence(i: MatchConfidenceInput): AIConfidence {
  if (!i.llmProducedAnswer) return "LOW";
  if (i.regulatoryState === "UNRESOLVED_REQUIREMENT") return "LOW";
  if (!i.locatorComplete) return "MEDIUM";
  return "HIGH";
}

function matchConfidenceReason(c: AIConfidence, req: RegulatoryRequirement): string {
  if (c === "HIGH") {
    return "ثقة عالية: متطلب معتمد واحد واضح، الحالة التنظيمية SPECIFIED، ومصدر رسمي كامل المحدِّد. تعبّر الثقة عن جودة الاسترجاع والتفسير من النطاق المعتمد لا عن يقين امتثال.";
  }
  if (c === "MEDIUM") {
    return "ثقة متوسطة: هوية المتطلب واضحة لكن محدِّد الموقع/التفاصيل في المصدر الرسمي غير مكتمل — لم يُخترع رقم صفحة أو قسم. تلزم مراجعة بشرية.";
  }
  if (req.resolution === "UNRESOLVED_REQUIREMENT") {
    return `ثقة منخفضة: المتطلب ${req.id} غير محسوم تنظيميًا (${req.unresolved[0] ?? "UNRESOLVED_REQUIREMENT"}) — لا يُحسم هنا وتلزم مراجعة بشرية.`;
  }
  return "ثقة منخفضة: تفاصيل تنظيمية معتمدة غير كافية — تلزم مراجعة بشرية.";
}

// -- applicability contradiction protection --------------------------

const APPLICABILITY_STATEMENT_AR: Record<ApplicabilityOutcome, string> = {
  APPLICABLE: "المتطلب منطبق على ملف الشركة وفق قاعدة الانطباق الحتمية.",
  NOT_APPLICABLE: "المتطلب غير منطبق على ملف الشركة وفق قاعدة الانطباق الحتمية.",
  INSUFFICIENT_DATA: "لا تتوفر بيانات كافية لتحديد الانطباق حتميًا.",
};

const APPLICABILITY_NEGATION_SRC =
  "غير منطبق|لا ينطبق|لا تنطبق|ليس منطبق|not applicable|non applicable";

/** Detects an explicit applicability claim inside model prose. */
function applicabilityClaimIn(text: string): { affirm: boolean; negate: boolean } {
  const t = normalizeText(text);
  const negate = new RegExp(APPLICABILITY_NEGATION_SRC).test(t);
  const stripped = t.replace(new RegExp(APPLICABILITY_NEGATION_SRC, "g"), " ");
  const affirm = /(^|\s)(منطبق|ينطبق|تنطبق|applicable)(\s|$)/.test(stripped);
  return { affirm, negate };
}

/** True when model prose asserts an applicability outcome that conflicts with the engine. */
function contradictsOutcome(text: string, outcome: ApplicabilityOutcome): boolean {
  const { affirm, negate } = applicabilityClaimIn(text);
  if (outcome === "APPLICABLE") return negate;
  if (outcome === "NOT_APPLICABLE") return affirm;
  return affirm || negate; // INSUFFICIENT_DATA: any definite applicability claim conflicts
}

function dedupe(xs: string[]): string[] {
  return [...new Set(xs.map((x) => x.trim()).filter(Boolean))];
}

// -- prompt construction --------------------------------------------

function buildSystemPrompt(): string {
  return [
    `أنت طبقة مساعدة لفهم المتطلبات التنظيمية المعتمدة في منصة "امتثال". النطاق: موسم الحج ${CORPUS_SEASON} فقط.`,
    "استخدم فقط بطاقة/بطاقات المتطلب المعتمدة المرفقة في محتوى المستخدم. لا تُضِف متطلبًا أو جهة أو مصدرًا من معرفتك العامة، ولا تتصفح الإنترنت.",
    "دورك: توضيح معنى المتطلب، وسبب انطباقه أو عدم انطباقه، والمعلومات المطلوبة لتحديد الانطباق، وإبراز عدم اليقين التنظيمي بوضوح.",
    "لا تُقرّر: حالة الامتثال، الوزن الرسمي، الغرامات، الأهمية الداخلية، الأهداف الرقمية، حالة التكامل الحكومي — هذه تحسمها المحركات الحتمية وليست من اختصاصك.",
    "إن كانت الحالة التنظيمية UNRESOLVED_REQUIREMENT فاشرح سبب عدم الحسم فقط، ولا تحسمه.",
    "إن كان محدِّد الموقع في المصدر (locator) ناقصًا فاذكر صراحةً أنه ناقص، ولا تخترع رقم صفحة أو رابطًا أو عنوان وثيقة.",
    "إذا رافق المحتوى نتيجةَ انطباقٍ حتميةً، فهي نهائية وغير قابلة للتغيير — اشرح فقط سببها وما المعلومات الناقصة، ولا تُصرّح بأن المتطلب «منطبق» أو «غير منطبق».",
    "لا تُقدّم درجة ثقة — تُحسب الثقة حتميًا خارج النموذج.",
    "",
    "أعِد كائن JSON واحدًا فقط بهذه المفاتيح والأنواع بالضبط، بلا أي نص خارج الكائن:",
    '- answerAr: نص عربي موجز.',
    '- requirementIds: مصفوفة نصوص (المعرّف المعتمد فقط). ليست نصًا.',
    '- authorityId: نص أو null.',
    '- missingInformation: مصفوفة نصوص، أو [] إن لم يكن هناك نقص. ليست نصًا مفردًا.',
    '- applicabilityExplanationAr: نص تفسيري إضافي أو null. اذكر سبب النتيجة فقط ولا تُصرّح بحكم انطباق. null إن لم يُرفق سياق شركة.',
    'مثال للبنية فقط: {"answerAr":"...","requirementIds":["HAJ-EXP-05"],"authorityId":"MOHU","missingInformation":[],"applicabilityExplanationAr":null}',
  ].join("\n");
}

function ruleSummary(req: RegulatoryRequirement): string {
  const r = req.applicabilityRule;
  if (!r) return "غير محددة";
  if (r.kind === "EXPRESSION") return `EXPRESSION: ${r.expression} (${r.matrixRef})`;
  if (r.kind === "NARRATIVE") return `NARRATIVE: ${r.textEn} (${r.matrixRef})`;
  return `DECLARED_SCOPE(${r.scopeKey}): ${r.textEn} (${r.matrixRef})`;
}

function buildContextBlock(
  req: RegulatoryRequirement,
  ctx: RunContext,
  applicability: ApplicabilityResult | null,
): string {
  const src = req.officialSource;
  const lines = [
    `سؤال المستخدم: ${ctx.queryText ?? "(غير محدد)"}`,
    "",
    "بطاقة المتطلب المعتمدة الوحيدة المسموح باستخدامها:",
    `- المعرّف: ${req.id}`,
    `- العنوان (حرفيًا، لا تُعِد صياغته): ${req.titleAr}`,
    `- الجهة: ${req.authorityId} (${AUTHORITY_NAME[req.authorityId] ?? req.authorityId})`,
    `- المجال: ${req.domainAr}${req.trackAr ? ` / المسار: ${req.trackAr}` : ""}`,
    `- قاعدة الانطباق: ${ruleSummary(req)}`,
    `- مجالات التحقق: ${req.verificationAreasAr.length ? req.verificationAreasAr.join("؛ ") : "—"}`,
    `- الحالة التنظيمية: ${req.resolution}`,
    `- الموسم: ${req.season}`,
    `- المصدر الرسمي: ${src ? src.reference : "—"}`,
    `- روابط المصدر: ${src && src.urls.length ? src.urls.join(" | ") : "—"}`,
    `- حالة محدِّد الموقع في المصدر: ${src?.locatorStatus ?? "—"}${
      src?.locatorStatus === "INCOMPLETE" ? " (ناقص — لا تخترع رقم صفحة أو قسم)" : ""
    }`,
    `- نص محدِّد الموقع: ${src?.locatorNote ?? "—"}`,
    `- مرجع مصفوفة التنفيذ (ليس مصدرًا رسميًا): ${req.matrixSourceRef}`,
    `- ملاحظات المصفوفة: ${req.matrixNotes.length ? req.matrixNotes.join(" | ") : "—"}`,
    `- نقاط غير محسومة: ${req.unresolved.length ? req.unresolved.join(" | ") : "—"}`,
  ];

  if (applicability) {
    lines.push(
      "",
      "النتيجة الحتمية للانطباق (غير قابلة للتغيير — اشرحها فقط):",
      `- الشركة: ${ctx.profile?.companyId ?? "—"}`,
      `- النتيجة: ${applicability.outcome}`,
      `- القاعدة المُقيَّمة: ${applicability.ruleEvaluated}`,
      `- حقول ملف الشركة المستخدمة: ${
        applicability.companyFieldsUsed.length ? applicability.companyFieldsUsed.join("، ") : "—"
      }`,
      `- الحقول الناقصة المطلوبة لحسم الانطباق: ${
        applicability.missingCompanyFields.length ? applicability.missingCompanyFields.join("، ") : "—"
      }`,
      `- السبب الحتمي: ${applicability.reason}`,
      `- الحالة التنظيمية للانطباق: ${applicability.regulatoryResolution}`,
      `- أساس أعداد الهدف المُعلن: ${applicability.targetPopulationBasis ?? "لا يوجد مصدر مُعلن"}`,
      "املأ applicabilityExplanationAr بتفصيل يشرح سبب هذه النتيجة الحتمية فقط. النتيجة أعلاه نهائية — لا تُصرّح بأن المتطلب منطبق أو غير منطبق، ولا تُدرِج حقلًا يحسم الامتثال أو الوزن أو الهدف.",
    );
  } else {
    lines.push("", "لا يوجد سياق شركة — اترك applicabilityExplanationAr = null.");
  }

  lines.push(
    "",
    `أعِد كائن JSON واحدًا فقط بالبنية الموضحة في تعليمات النظام. requirementIds يجب أن تكون ["${req.id}"] حرفيًا. missingInformation مصفوفة.`,
  );
  return lines.join("\n");
}
