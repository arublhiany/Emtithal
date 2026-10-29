// =============================================================================
// Research Knowledge Agent — Phase 8. Server-side only. DECISION SUPPORT ONLY.
//
// Deterministic closed-world retrieval over the APPROVED research corpus BEFORE
// any LLM call. The model receives only the matched research record's metadata,
// its REAL extracted passages (verbatim, with page numbers), exact provenance,
// and optionally a Phase 7 scenario diff — never the open web. It returns claim
// / relevance text only; canonical source lineage (title, publisher, URL,
// publication status, season) is reattached by CODE.
//
// Firewall: research output can never assert a regulatory requirement, official
// weight, penalty, government integration, or a compliance verdict; it can never
// change a scenario KPI, readiness, coverage, blockers, applicability,
// recommendedScenarioId, or the deterministic whyChangedAr; it can never
// resolve an UNRESOLVED_REQUIREMENT or mark evidence VERIFIED. An INTERIM_REPORT
// source forces `needsHumanReview` and keeps its limitation visible.
// =============================================================================

import type { AICallMeta, AIClient, AIFailureCode } from "@/lib/ai/client/types";
import type { AIConfidence } from "@/lib/model";
import { getAuthorities, getRegulatoryRequirements } from "@/lib/data/regulatory";
import { getAIClient } from "@/lib/ai/client";
import { researchAgentAnswerSchema } from "@/lib/ai/schemas";
import {
  scanEvidenceProseForVerdict,
  scanResearchProseForRegulatoryClaim,
} from "@/lib/ai/guardrails/sharedGuardrails";
import {
  RESEARCH_CORPUS_PENDING_CODE,
  getResearchCorpus,
  getResearchEntryById,
  researchCorpusState,
  retrieveResearch,
  type ResearchCorpusEntry,
  type ResearchCorpusState,
  type ResearchLocator,
  type ResearchPublicationStatus,
  type ResearchRetrievalKind,
  type ResearchSourceKind,
} from "@/lib/research";
import type { ScenarioDiff } from "@/lib/engine/decisionScenarioEngine";

// -- result shapes -------------------------------------------------

export type ResearchAgentFailureCode =
  | AIFailureCode
  | "CORPUS_PENDING"
  | "NO_RELEVANT_RESEARCH"
  | "AMBIGUOUS_RESEARCH";

export type ResearchProvenanceKind = "SOURCE_DIRECT_PLUS_AI_INTERPRETATION";

export interface ResearchCitedPassage {
  passageId: string;
  /** PDF_PAGE (real 1-based page) or WEB_SECTION (section label, no page). */
  locator: ResearchLocator;
}

export interface ResearchInsightView {
  researchId: string;
  /** SOURCE_DIRECT — what the approved source states. Anchored to `citedPassages`. */
  claimAr: string;
  citedPassages: ResearchCitedPassage[];
  /** AI_INTERPRETATION — kept SEPARATE; not the paper's own words. */
  aiRelevanceAr: string;
  provenanceKind: ResearchProvenanceKind;
  // canonical source lineage — reattached by CODE, never from the model
  sourceTitleAr: string;
  publisherAr: string;
  institutionAr: string;
  sourceKind: ResearchSourceKind;
  officialSourceReference: string;
  officialUrl: string | null;
  publicationStatus: ResearchPublicationStatus;
  researchSeason: string | null;
  /** sha256 of the verified local official-web snapshot; null for a PDF/pending source. Code-reattached. */
  snapshotHash: string | null;
  limitationsAr: string[];
  interpretationConfidence: AIConfidence;
  needsHumanReview: boolean;
}

export interface ResearchAgentResult {
  ok: boolean;
  corpusState: ResearchCorpusState;
  retrievalOutcome: ResearchRetrievalKind;
  candidateResearchIds: string[];
  summaryAr: string | null;
  insights: ResearchInsightView[];
  /** LLM claims/insights that were dropped for grounding reasons — never silently. */
  droppedInsights: { researchId: string; reason: string }[];
  needsHumanReview: boolean;
  /** ALWAYS false — research output carries no authoritative regulatory claim. */
  containsRegulatoryClaim: false;
  failureCode: ResearchAgentFailureCode | null;
  message: string | null;
  meta: AICallMeta | null;
}

export interface AnswerResearchQuestionInput {
  questionAr: string;
  /** Restrict retrieval to these approved researchIds. */
  restrictToResearchIds?: string[];
  /** Optional Phase 7 diff — READ-ONLY context. Never mutated, never returned. */
  scenarioDiff?: ScenarioDiff;
}

export interface ResearchAgentOptions {
  client?: AIClient;
  /** Override the corpus (tests). Defaults to the live approved corpus. */
  corpus?: ResearchCorpusEntry[];
}

// -- shared guardrail context ------------------------------------

const GUARDRAIL = {
  approvedRequirementIds: getRegulatoryRequirements().map((r) => r.id),
  approvedAuthorityIds: getAuthorities().map((a) => a.id),
};

const NUMERIC_TOKEN_RX = /\d[\d.,٪%]*/g;

function base(corpusState: ResearchCorpusState, over: Partial<ResearchAgentResult>): ResearchAgentResult {
  return {
    ok: false,
    corpusState,
    retrievalOutcome: "CORPUS_PENDING",
    candidateResearchIds: [],
    summaryAr: null,
    insights: [],
    droppedInsights: [],
    needsHumanReview: true,
    containsRegulatoryClaim: false,
    failureCode: null,
    message: null,
    meta: null,
    ...over,
  };
}

// -- 1. answerResearchQuestion --------------------------------

export async function answerResearchQuestion(
  input: AnswerResearchQuestionInput,
  opts: ResearchAgentOptions = {},
): Promise<ResearchAgentResult> {
  const corpus = opts.corpus ?? getResearchCorpus();
  const corpusState = researchCorpusState(corpus);

  const retrieval = retrieveResearch(
    { questionAr: input.questionAr, restrictToResearchIds: input.restrictToResearchIds },
    { corpus },
  );

  if (retrieval.kind === "CORPUS_PENDING") {
    return base(corpusState, {
      retrievalOutcome: "CORPUS_PENDING",
      failureCode: "CORPUS_PENDING",
      message: RESEARCH_CORPUS_PENDING_CODE,
    });
  }
  if (retrieval.kind === "NO_RELEVANT_RESEARCH") {
    return base(corpusState, {
      retrievalOutcome: "NO_RELEVANT_RESEARCH",
      failureCode: "NO_RELEVANT_RESEARCH",
      message: "No approved research is a credible match for this question.",
    });
  }
  if (retrieval.kind === "AMBIGUOUS") {
    return base(corpusState, {
      retrievalOutcome: "AMBIGUOUS",
      candidateResearchIds: retrieval.researchIds,
      failureCode: "AMBIGUOUS_RESEARCH",
      message: "More than one approved research record is comparably plausible — clarification required.",
    });
  }

  // MATCH — exactly one approved research record.
  const entry = findEntry(corpus, retrieval.researchIds[0]);
  if (!entry) {
    return base(corpusState, {
      retrievalOutcome: "NO_RELEVANT_RESEARCH",
      failureCode: "NO_RELEVANT_RESEARCH",
      message: "Retrieved research record could not be loaded.",
    });
  }

  const client = opts.client ?? getAIClient();
  const call = await client.generateStructured({
    purpose: "research-agent",
    schema: researchAgentAnswerSchema,
    system: buildSystemPrompt(),
    input: buildContext(entry, input),
    maxTokens: 2048,
    guardrail: GUARDRAIL,
  });

  if (!call.ok) {
    return base(corpusState, {
      corpusState,
      retrievalOutcome: "MATCH",
      candidateResearchIds: [entry.researchId],
      failureCode: call.failureCode,
      message: "The research interpretation model call failed; the approved source stays available.",
      meta: call.meta,
    });
  }

  const llm = call.data;

  // -- (a) regulation / research firewall on prose -------------
  const proseFields: { path: string; text: string }[] = [
    { path: "summaryAr", text: llm.summaryAr },
    ...llm.insights.flatMap((ins, i) => [
      { path: `insights[${i}].claimAr`, text: ins.claimAr },
      { path: `insights[${i}].relevanceAr`, text: ins.relevanceAr },
    ]),
  ];
  const verdict = scanEvidenceProseForVerdict(proseFields);
  const regClaim = scanResearchProseForRegulatoryClaim(proseFields);
  if (!verdict.ok || !regClaim.ok) {
    return base(corpusState, {
      corpusState,
      retrievalOutcome: "MATCH",
      candidateResearchIds: [entry.researchId],
      failureCode: "GUARDRAIL_REJECTED",
      message: `Research prose asserted a compliance verdict or regulatory claim (${[
        ...verdict.fields,
        ...regClaim.fields,
      ].join(", ")}); rejected.`,
      meta: call.meta,
    });
  }

  // -- (b) claim grounding + numeric grounding ----------------
  const knownPassageIds = new Set(entry.passages.map((p) => p.passageId));
  const passageText = new Map(entry.passages.map((p) => [p.passageId, p.textAr]));
  const insights: ResearchInsightView[] = [];
  const droppedInsights: { researchId: string; reason: string }[] = [];
  let groundingReview = false;

  for (const ins of llm.insights) {
    // researchId must exist AND be the matched candidate
    if (ins.researchId !== entry.researchId) {
      droppedInsights.push({ researchId: ins.researchId, reason: "OUT_OF_CANDIDATE_SET" });
      groundingReview = true;
      continue;
    }
    const cited = ins.citedPassageIds.filter((id) => knownPassageIds.has(id));
    if (cited.length === 0) {
      droppedInsights.push({ researchId: ins.researchId, reason: "NO_REAL_CITED_PASSAGE" });
      groundingReview = true;
      continue;
    }
    // numeric-claim grounding: every number in claimAr must appear in a cited passage
    const supportText = cited.map((id) => passageText.get(id) ?? "").join("\n");
    const numbers = (ins.claimAr.match(NUMERIC_TOKEN_RX) ?? []).map((n) => n.replace(/[.,٪%]+$/, ""));
    const ungrounded = numbers.filter((n) => n.length > 0 && !normaliseDigits(supportText).includes(normaliseDigits(n)));
    if (ungrounded.length > 0) {
      droppedInsights.push({ researchId: ins.researchId, reason: "UNGROUNDED_NUMERIC_CLAIM" });
      groundingReview = true;
      continue;
    }

    const citedPassages: ResearchCitedPassage[] = cited.map((id) => {
      const p = entry.passages.find((x) => x.passageId === id)!;
      return { passageId: p.passageId, locator: p.locator };
    });
    // An INTERIM_REPORT or an official study/project page is provisional — every
    // material insight is forced to human review and never promoted.
    const provisional =
      entry.publicationStatus === "INTERIM_REPORT" ||
      entry.sourceKind === "OFFICIAL_STUDY_PAGE";

    insights.push({
      researchId: entry.researchId,
      claimAr: ins.claimAr,
      citedPassages,
      aiRelevanceAr: ins.relevanceAr,
      provenanceKind: "SOURCE_DIRECT_PLUS_AI_INTERPRETATION",
      // canonical lineage — from the corpus, NEVER the model
      sourceTitleAr: entry.titleAr,
      publisherAr: entry.publisherAr,
      institutionAr: entry.institutionAr,
      sourceKind: entry.sourceKind,
      officialSourceReference: entry.officialSourceReference,
      officialUrl: entry.officialUrl,
      publicationStatus: entry.publicationStatus,
      researchSeason: entry.researchSeason,
      snapshotHash: entry.snapshotHash,
      limitationsAr: [...entry.limitationsAr],
      interpretationConfidence: ins.interpretationConfidence,
      // provisional source → force review on every material insight
      needsHumanReview: provisional || ins.interpretationConfidence === "LOW",
    });
  }

  return {
    ok: insights.length > 0,
    corpusState,
    retrievalOutcome: "MATCH",
    candidateResearchIds: [entry.researchId],
    summaryAr: insights.length > 0 ? llm.summaryAr : null,
    insights,
    droppedInsights,
    needsHumanReview:
      llm.needsHumanReview ||
      groundingReview ||
      insights.some((i) => i.needsHumanReview) ||
      insights.length === 0,
    containsRegulatoryClaim: false,
    failureCode: insights.length > 0 ? null : "NO_RELEVANT_RESEARCH",
    message:
      insights.length > 0 ? null : "No research claim could be anchored to a real extracted page.",
    meta: call.meta,
  };
}

/**
 * Phase 7 integration — returns ONLY a research-support section for a decision.
 * The passed `scenarioDiff` is read-only context; nothing about the scenario
 * state / KPIs / recommendation is read back or changed.
 */
export async function getResearchInsightsForDecision(
  input: { scenarioDiff: ScenarioDiff; questionAr?: string; restrictToResearchIds?: string[] },
  opts: ResearchAgentOptions = {},
): Promise<ResearchAgentResult> {
  const questionAr =
    input.questionAr ??
    "هل يوجد في المصدر البحثي المعتمد دعم سياقي لفكرة تقييم البدائل التشغيلية بالنمذجة والمحاكاة قبل التنفيذ الميداني؟";
  return answerResearchQuestion(
    { questionAr, restrictToResearchIds: input.restrictToResearchIds, scenarioDiff: input.scenarioDiff },
    opts,
  );
}

// -- helpers ------------------------------------------------

function findEntry(corpus: ResearchCorpusEntry[], id: string): ResearchCorpusEntry | undefined {
  return corpus.find((e) => e.researchId === id) ?? getResearchEntryById(id);
}

/** Fold Arabic-Indic digits to ASCII so "٣" and "3" compare equal. */
function normaliseDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

// -- prompt ----------------------------------------------

function buildSystemPrompt(): string {
  return [
    'أنت طبقة دعم بحثي في منصة "سبّاق". البحث دعم لاتخاذ القرار فقط، ومنفصل تمامًا عن الحقيقة التنظيمية.',
    "لديك سجل بحثي معتمد واحد مع مقاطع نصية مستخرجة حقيقية (لكل مقطع معرّف وموضع: رقم صفحة لمصدر PDF، أو اسم قسم لمصدر ويب رسمي). لا تخترع صفحة أو قسمًا أو مؤلفًا أو نتيجة أو حجم عينة أو نسبة أو توصية، ولا تنسب رقم صفحة لمصدر ويب.",
    "لكل insight: claimAr = ما يذكره المصدر مباشرةً (SOURCE_DIRECT) ويجب ربطه بـ citedPassageIds حقيقية؛ relevanceAr = تفسيرك أنت لسبب احتمال الصلة (AI_INTERPRETATION) ولا يُقدَّم على أنه كلام المصدر.",
    "ممنوع منعًا باتًا: إنشاء متطلب تنظيمي، أو وزن رسمي، أو غرامة، أو تكامل حكومي؛ إصدار حكم امتثال إيجابي أو سلبي؛ حسم متطلب غير محسوم؛ اعتبار البحث دليلًا على صحة أرقام سيناريو محدد.",
    "استخدم صياغة مثل: \"تشير الدراسة…\"، \"يقدم التقرير دعمًا بحثيًا لفكرة…\"، \"قد يكون هذا ذا صلة عند تقييم…\"، \"لا يمثل ذلك متطلبًا تنظيميًا\".",
    "لا تذكر عنوان المصدر أو ناشره أو رابطه أو حالته كأنها حقيقة نهائية — تُعاد هذه من البيانات المعتمدة.",
    "أي رقم في claimAr يجب أن يكون موجودًا حرفيًا في أحد المقاطع المستشهد بها؛ وإلا فلا تذكره.",
    "",
    "أعِد كائن JSON واحدًا فقط بالمفاتيح: summaryAr, insights, noRelevantResearch, needsHumanReview. كل insight: {researchId, claimAr, relevanceAr, citedPassageIds, interpretationConfidence}.",
  ].join("\n");
}

function buildContext(entry: ResearchCorpusEntry, input: AnswerResearchQuestionInput): string {
  const lines: string[] = [
    "السجل البحثي المعتمد الوحيد المسموح باستخدامه:",
    `- researchId: ${entry.researchId}`,
    `- العنوان: ${entry.titleAr}`,
    `- الناشر: ${entry.publisherAr} — ${entry.institutionAr}`,
    `- الموسم: ${entry.researchSeason ?? "غير محدد"} / سنة النشر: ${entry.publicationYear ?? "غير محددة"}`,
    `- حالة النشر: ${entry.publicationStatus}`,
    `- النطاق: ${entry.scopeAr}`,
    `- قيود المصدر: ${entry.limitationsAr.join(" | ")}`,
    "",
    "المقاطع النصية المستخرجة الحقيقية (استشهد بمعرّفاتها فقط):",
    ...entry.passages.map((p) => {
      const loc =
        p.locator.type === "PDF_PAGE"
          ? `صفحة ${p.locator.page}`
          : `قسم: ${p.locator.section}`;
      return `- ${p.passageId} [${loc}]: ${p.textAr.replace(/\n+/g, " / ").slice(0, 900)}`;
    }),
  ];
  if (input.scenarioDiff) {
    const d = input.scenarioDiff;
    lines.push(
      "",
      "سياق قرار (Phase 7) — للقراءة فقط، لا تعدّله ولا تحسب أي مؤشر:",
      `- الحقول المتغيرة: ${d.fieldsChanged.map((m) => m.fieldPath).join("، ") || "—"}`,
      `- المؤشر التشغيلي الداخلي: ${
        d.operationalMetricChanges.map((m) => `${m.key} ${m.direction}`).join("، ") || "—"
      }`,
      `- تغيّر تنظيمي/جاهزية: ${
        d.applicabilityChanges.length + d.verificationStatusChanges.length === 0 && (d.readinessDelta ?? 0) === 0
          ? "لا يوجد أثر تنظيمي أو تغيّر جاهزية من هذا التغيير وحده"
          : "يوجد أثر — راجع نتيجة Phase 7 الحتمية"
      }`,
    );
  }
  lines.push(
    "",
    `سؤال المستخدم: ${input.questionAr}`,
    "",
    `أعِد كائن JSON واحدًا فقط. كل researchId يجب أن يكون "${entry.researchId}"، وكل citedPassageIds من المعرّفات أعلاه فقط.`,
  );
  return lines.join("\n");
}
