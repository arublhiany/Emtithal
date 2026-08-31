// =============================================================================
// Evidence Intelligence Agent — Phase 6. Server-side only.
//
// Consumes ALREADY-EXTRACTED evidence facts (with deterministic page / sheet /
// row / cell provenance) and asks the LLM ONLY to interpret them: map them to an
// APPROVED candidate requirement set, say what the evidence appears to support,
// what is still missing, and flag conflicts.
//
// Evidence is NOT compliance. The agent MUST NOT set a compliance status,
// readiness, verification coverage, an official weight / target / penalty, an
// integration state; it must not invent a requirement, change applicability, or
// resolve an UNRESOLVED_REQUIREMENT. The deterministic verification engine stays
// authoritative. A successfully parsed / interpreted document is never VERIFIED.
// =============================================================================

import type { AICallMeta, AIClient, AIFailureCode } from "@/lib/ai/client/types";
import type { AIConfidence, RegulatoryRequirement } from "@/lib/model";
import type { ExtractedEvidenceFact } from "@/lib/evidence/types";
import { getAuthorities, getRequirementByCanonicalId } from "@/lib/data/regulatory";
import { getAIClient } from "@/lib/ai/client";
import { evidenceAgentAnalysisSchema } from "@/lib/ai/schemas";
import { scanEvidenceProseForVerdict } from "@/lib/ai/guardrails/sharedGuardrails";
import { normalizeText, retrieveCandidates } from "./regulatoryRetrieval";

// -- result shape ----------------------------------------------------------

export type EvidenceAgentFailureCode = AIFailureCode | "EXTRACTION_UNAVAILABLE";

export type EvidenceRetrievalOutcome = "EXPLICIT" | "MATCH" | "AMBIGUOUS" | "NONE";

/** Evidence lifecycle reached by this agent — never VERIFIED. */
export type EvidenceAnalysisState = "EXTRACTED" | "AI_INTERPRETED";

export interface EvidenceRequirementMappingView {
  /** Canonical requirement ID — always within the approved candidate set. */
  requirementId: string;
  /** Canonical title, verbatim from the corpus. */
  titleAr: string;
  /** Carried through from the canonical record — the agent never changes it. */
  regulatoryResolution: "SPECIFIED" | "UNRESOLVED_REQUIREMENT";
  /** Extracted fact IDs backing this mapping (filtered to real facts). */
  evidenceFactIds: string[];
  /** What the evidence APPEARS to support. Never a compliance verdict. */
  appearsToSupportAr: string;
  stillMissingAr: string[];
  relatedVerificationTargetAr: string | null;
  /** Mapping clarity only — not regulatory or compliance confidence. */
  interpretationConfidence: AIConfidence;
  /** Fixed marker: this is evidence interpretation, not a compliance decision. */
  note: "EVIDENCE_ONLY_NOT_A_COMPLIANCE_DECISION";
}

export interface EvidenceConflictView {
  factIdA: string;
  factIdB: string;
  descriptionAr: string;
}

/** An LLM mapping that was NOT surfaced, with the deterministic reason. */
export interface DroppedEvidenceMapping {
  requirementId: string;
  reason:
    | "OUT_OF_CANDIDATE_SET"
    | "UNKNOWN_EVIDENCE_FACT_REFERENCE"
    | "NO_VALID_EVIDENCE_FACT";
}

export interface EvidenceAgentResult {
  ok: boolean;
  state: EvidenceAnalysisState;
  evidenceId: string;
  companyId: string;
  fileName: string;
  summaryAr: string | null;
  mappings: EvidenceRequirementMappingView[];
  conflicts: EvidenceConflictView[];
  unmappedFactIds: string[];
  /** Mappings the model produced that were discarded (never silently reduced). */
  droppedMappings: DroppedEvidenceMapping[];
  /** Non-secret notes on reference / target integrity problems. Never the offending prose. */
  integrityNotes: string[];
  /** The approved candidate requirement IDs the model was restricted to. */
  candidateRequirementIds: string[];
  retrievalOutcome: EvidenceRetrievalOutcome;
  /** true when no credible requirement candidate exists — no regulation is invented. */
  outOfScope: boolean;
  outOfScopeCode: "NO_RELEVANT_REQUIREMENT" | null;
  needsHumanReview: boolean;
  /** The extracted facts, echoed so evidence stays available even on failure. */
  facts: ExtractedEvidenceFact[];
  /** ALWAYS false — the agent never asserts compliance. */
  complianceAsserted: false;
  failureCode: EvidenceAgentFailureCode | null;
  message: string | null;
  meta: AICallMeta | null;
}

export interface EvidenceAgentInput {
  /** A successful `ingestEvidence` result: `ok === true`, `state === "EXTRACTED"`. */
  extraction: {
    ok: boolean;
    state: string;
    evidenceId: string;
    companyId: string;
    fileName: string;
    facts: ExtractedEvidenceFact[];
  };
  /**
   * Restrict the model to these canonical requirement IDs. When omitted,
   * deterministic retrieval derives the candidate set from the extracted text.
   */
  candidateRequirementIds?: string[];
}

export interface EvidenceAgentOptions {
  client?: AIClient;
}

// -- orchestration -----------------------------------------------------

const AUTHORITY_IDS = getAuthorities().map((a) => a.id);
const MAX_FACT_CHARS_IN_PROMPT = 600;
const MAX_FACTS_IN_PROMPT = 60;

function baseResult(
  input: EvidenceAgentInput,
  over: Partial<EvidenceAgentResult>,
): EvidenceAgentResult {
  return {
    ok: false,
    state: "EXTRACTED",
    evidenceId: input.extraction.evidenceId,
    companyId: input.extraction.companyId,
    fileName: input.extraction.fileName,
    summaryAr: null,
    mappings: [],
    conflicts: [],
    unmappedFactIds: [],
    droppedMappings: [],
    integrityNotes: [],
    candidateRequirementIds: [],
    retrievalOutcome: "NONE",
    outOfScope: false,
    outOfScopeCode: null,
    needsHumanReview: true,
    facts: input.extraction.facts,
    complianceAsserted: false,
    failureCode: null,
    message: null,
    meta: null,
    ...over,
  };
}

/** Deterministic candidate set: explicit list (validated) or corpus retrieval over the text. */
function resolveCandidates(input: EvidenceAgentInput): {
  ids: string[];
  outcome: EvidenceRetrievalOutcome;
} {
  if (input.candidateRequirementIds && input.candidateRequirementIds.length > 0) {
    const ids = [
      ...new Set(
        input.candidateRequirementIds
          .map((id) => getRequirementByCanonicalId(id)?.id)
          .filter((id): id is string => !!id),
      ),
    ];
    return { ids, outcome: "EXPLICIT" };
  }
  const text = input.extraction.facts.map((f) => f.text).join("\n").trim();
  const r = retrieveCandidates({ text });
  if (r.kind === "MATCH") return { ids: r.candidateIds, outcome: "MATCH" };
  if (r.kind === "AMBIGUOUS") return { ids: r.candidateIds, outcome: "AMBIGUOUS" };
  return { ids: [], outcome: "NONE" };
}

export async function analyzeEvidence(
  input: EvidenceAgentInput,
  opts: EvidenceAgentOptions = {},
): Promise<EvidenceAgentResult> {
  if (!input.extraction.ok || input.extraction.state !== "EXTRACTED") {
    return baseResult(input, {
      failureCode: "EXTRACTION_UNAVAILABLE",
      message: "Evidence has not been successfully extracted; nothing to interpret.",
    });
  }

  const { ids: candidateIds, outcome } = resolveCandidates(input);

  if (candidateIds.length === 0) {
    // No credible requirement candidate — do NOT call the model, do NOT invent one.
    return baseResult(input, {
      ok: true,
      state: "EXTRACTED",
      retrievalOutcome: outcome,
      outOfScope: true,
      outOfScopeCode: "NO_RELEVANT_REQUIREMENT",
      unmappedFactIds: input.extraction.facts.map((f) => f.factId),
      needsHumanReview: true,
      message: "No approved requirement is a credible match for this evidence.",
    });
  }

  const client = opts.client ?? getAIClient();
  const knownFactIds = new Set(input.extraction.facts.map((f) => f.factId));

  const call = await client.generateStructured({
    purpose: "evidence-agent",
    schema: evidenceAgentAnalysisSchema,
    system: buildSystemPrompt(),
    input: buildContextBlock(input.extraction.facts, candidateIds),
    maxTokens: 2048,
    guardrail: {
      approvedRequirementIds: candidateIds,
      approvedAuthorityIds: AUTHORITY_IDS,
    },
  });

  if (!call.ok) {
    return baseResult(input, {
      ok: false,
      state: "EXTRACTED",
      retrievalOutcome: outcome,
      candidateRequirementIds: candidateIds,
      failureCode: call.failureCode,
      message: "The evidence interpretation model call failed; extracted evidence is preserved.",
      meta: call.meta,
    });
  }

  const llm = call.data;

  // -- (1) prose compliance-verdict guard -------------------------------
  // A compliance / satisfaction / verification verdict in any user-facing text
  // field rejects the whole interpretation. The offending prose is never shown;
  // extracted facts stay available; nothing is fabricated in its place.
  const proseEntries: { path: string; text: string }[] = [
    { path: "summaryAr", text: llm.summaryAr },
    ...llm.mappings.flatMap((m, i) => [
      { path: `mappings[${i}].appearsToSupportAr`, text: m.appearsToSupportAr },
      { path: `mappings[${i}].relatedVerificationTargetAr`, text: m.relatedVerificationTargetAr ?? "" },
      ...m.stillMissingAr.map((s, j) => ({ path: `mappings[${i}].stillMissingAr[${j}]`, text: s })),
    ]),
    ...llm.conflicts.map((c, i) => ({ path: `conflicts[${i}].descriptionAr`, text: c.descriptionAr })),
  ];
  const verdict = scanEvidenceProseForVerdict(proseEntries);
  if (!verdict.ok) {
    return baseResult(input, {
      ok: false,
      state: "EXTRACTED",
      retrievalOutcome: outcome,
      candidateRequirementIds: candidateIds,
      failureCode: "GUARDRAIL_REJECTED",
      message: `AI interpretation asserted a compliance verdict in prose (${verdict.fields.join(", ")}); rejected.`,
      integrityNotes: [`compliance-verdict prose rejected in: ${verdict.fields.join(", ")}`],
      meta: call.meta,
    });
  }

  // -- (2) closed-world evidence-fact references ----------------------
  const droppedMappings: DroppedEvidenceMapping[] = [];
  const integrityNotes: string[] = [];
  let refIntegrityReview = false;

  const mappings: EvidenceRequirementMappingView[] = [];
  for (const m of llm.mappings) {
    const req = getRequirementByCanonicalId(m.requirementId);
    if (!req || !candidateIds.includes(req.id)) {
      droppedMappings.push({ requirementId: m.requirementId, reason: "OUT_OF_CANDIDATE_SET" });
      refIntegrityReview = true;
      continue;
    }
    const unknownRefs = m.evidenceFactIds.filter((id) => !knownFactIds.has(id));
    if (unknownRefs.length > 0) {
      // ANY invented reference discards the WHOLE mapping — never reduced to the real ids.
      droppedMappings.push({ requirementId: req.id, reason: "UNKNOWN_EVIDENCE_FACT_REFERENCE" });
      integrityNotes.push(
        `mapping ${req.id} cited ${unknownRefs.length} evidence fact id(s) not in the extracted set; mapping discarded`,
      );
      refIntegrityReview = true;
      continue;
    }
    if (m.evidenceFactIds.length === 0) {
      // A mapping with no extracted fact must never surface as supportive evidence.
      droppedMappings.push({ requirementId: req.id, reason: "NO_VALID_EVIDENCE_FACT" });
      integrityNotes.push(`mapping ${req.id} cited no extracted fact; not surfaced as supportive`);
      refIntegrityReview = true;
      continue;
    }

    // -- (3) closed-world verification target -----------------------
    const { value: relatedVerificationTargetAr, invalid: targetInvalid } = resolveVerificationTarget(
      req,
      m.relatedVerificationTargetAr,
    );
    if (targetInvalid) {
      integrityNotes.push(
        `mapping ${req.id} suggested a verification target not present in the canonical requirement; set to null`,
      );
      refIntegrityReview = true;
    }

    mappings.push({
      requirementId: req.id,
      titleAr: req.titleAr,
      regulatoryResolution: req.resolution,
      evidenceFactIds: [...m.evidenceFactIds],
      appearsToSupportAr: m.appearsToSupportAr,
      stillMissingAr: m.stillMissingAr,
      relatedVerificationTargetAr,
      interpretationConfidence: m.interpretationConfidence,
      note: "EVIDENCE_ONLY_NOT_A_COMPLIANCE_DECISION",
    });
  }

  // Conflicts: BOTH fact ids must exist. An unknown id → not a real conflict.
  const conflicts: EvidenceConflictView[] = [];
  for (const c of llm.conflicts) {
    if (!knownFactIds.has(c.factIdA) || !knownFactIds.has(c.factIdB)) {
      integrityNotes.push("a reported conflict referenced an unknown fact id; not accepted as a conflict");
      refIntegrityReview = true;
      continue;
    }
    conflicts.push({ factIdA: c.factIdA, factIdB: c.factIdB, descriptionAr: c.descriptionAr });
  }

  // unmappedFactIds: computed deterministically = real facts not backing a surviving mapping.
  const mappedFactIds = new Set(mappings.flatMap((m) => m.evidenceFactIds));
  const unmappedFactIds = input.extraction.facts
    .map((f) => f.factId)
    .filter((id) => !mappedFactIds.has(id));
  const inventedUnmapped = llm.unmappedFactIds.filter((id) => !knownFactIds.has(id));
  if (inventedUnmapped.length > 0) {
    integrityNotes.push(
      `model listed ${inventedUnmapped.length} unmapped fact id(s) not in the extracted set; ignored`,
    );
    refIntegrityReview = true;
  }

  // Deterministic human-review conditions layered on top of the model's own flag.
  const needsHumanReview =
    llm.needsHumanReview ||
    conflicts.length > 0 ||
    refIntegrityReview ||
    outcome === "AMBIGUOUS" ||
    mappings.some((m) => m.regulatoryResolution === "UNRESOLVED_REQUIREMENT") ||
    mappings.some((m) => m.interpretationConfidence === "LOW") ||
    mappings.length === 0;

  return baseResult(input, {
    ok: true,
    state: "AI_INTERPRETED",
    summaryAr: llm.summaryAr,
    mappings,
    conflicts,
    unmappedFactIds,
    droppedMappings,
    integrityNotes,
    candidateRequirementIds: candidateIds,
    retrievalOutcome: outcome,
    needsHumanReview,
    meta: call.meta,
  });
}

// -- closed-world verification target -------------------------------

/** The approved target set for a requirement: its verification areas + its single verificationTarget. */
function allowedVerificationTargets(req: RegulatoryRequirement): string[] {
  return [...req.verificationAreasAr, ...(req.verificationTarget ? [req.verificationTarget] : [])];
}

/**
 * Validates a model-suggested target against the canonical set. The ONLY valid
 * match is an EXACT equality of the normalised forms (`normalizeText` handles
 * whitespace / punctuation / casing / Arabic folding — nothing more). No
 * substring, prefix, suffix, or fuzzy matching. On a match the CANONICAL text is
 * returned verbatim; a non-null value that does not match → `null` + `invalid`
 * (the caller forces review).
 */
function resolveVerificationTarget(
  req: RegulatoryRequirement,
  suggested: string | null,
): { value: string | null; invalid: boolean } {
  const raw = (suggested ?? "").trim();
  if (raw === "") return { value: null, invalid: false };
  const normSuggested = normalizeText(raw);
  const hit = allowedVerificationTargets(req).find(
    (t) => normalizeText(t) === normSuggested,
  );
  return hit ? { value: hit, invalid: false } : { value: null, invalid: true };
}

/** Backwards-friendly alias for callers that only want the requirement mapping. */
export const mapEvidenceToRequirements = analyzeEvidence;

// -- prompt construction --------------------------------------------

function buildSystemPrompt(): string {
  return [
    "أنت طبقة مساعدة لتفسير الأدلة المستخرجة في منصة \"امتثال\". الدليل ليس امتثالًا.",
    "لديك وقائع مستخرجة مسبقًا مع مواضعها (صفحة PDF أو ورقة/صف/خلية XLSX). لا تخترع موضعًا.",
    "مهمتك: ربط الوقائع بمتطلب واحد أو أكثر من قائمة المتطلبات المرشحة المعتمدة فقط، وبيان:",
    "- ما الذي يبدو أن الدليل يدعمه (appearsToSupportAr) — دون الحكم بالامتثال.",
    "- ما الذي ما زال ناقصًا (stillMissingAr).",
    "- relatedVerificationTargetAr: يجب أن يكون null أو إحدى قيم \"أهداف/مجالات التحقق المسموحة\" للمتطلب المذكور في السياق حرفيًا. لا تخترع هدف تحقق جديدًا.",
    "- درجة وضوح الربط (interpretationConfidence): HIGH | MEDIUM | LOW — وهي ليست ثقة تنظيمية ولا ثقة امتثال.",
    "ممنوع منعًا باتًا: تحديد حالة امتثال، أو وزن رسمي، أو هدف رقمي، أو غرامة، أو حالة تكامل حكومي؛ اختراع متطلب؛ تغيير الانطباق؛ حسم متطلب غير محسوم؛ اعتبار وجود مستند دليلًا على الامتثال.",
    "في كل الحقول النصية (summaryAr، appearsToSupportAr، stillMissingAr، relatedVerificationTargetAr، descriptionAr): لا تُصدر أي حكم بالامتثال أو الاستيفاء أو التحقق. عبارات مثل \"الشركة ملتزمة\" أو \"يثبت الامتثال\" أو \"المتطلب متحقق\" أو \"the company is compliant\" ممنوعة. استخدم صياغة مثل \"يبدو أن الدليل يوثق...\" أو \"قد يدعم التحقق من...\" أو \"يحتاج إلى تحقق إضافي\" أو \"لا يكفي وحده للحكم على الامتثال\".",
    "requirementId يجب أن يكون من قائمة المرشحين المعتمدين حرفيًا. إن لم ترتبط واقعة بأي مرشح فضعها في unmappedFactIds.",
    "كل معرّف واقعة (evidenceFactIds، factIdA، factIdB، unmappedFactIds) يجب أن يكون أحد معرّفات الوقائع المستخرجة المرفقة حرفيًا. لا تخترع معرّف واقعة أو صفحة أو خلية.",
    "إذا تعارضت واقعتان فاحفظهما معًا في conflicts ولا تختر إحداهما؛ اجعل needsHumanReview = true.",
    "",
    "أعِد كائن JSON واحدًا فقط بهذه المفاتيح بالضبط، بلا نص خارجه:",
    '- summaryAr: نص عربي موجز.',
    '- mappings: مصفوفة من {requirementId, evidenceFactIds[], appearsToSupportAr, stillMissingAr[], relatedVerificationTargetAr|null, interpretationConfidence}.',
    '- conflicts: مصفوفة من {factIdA, factIdB, descriptionAr}.',
    '- unmappedFactIds: مصفوفة نصوص.',
    '- needsHumanReview: قيمة منطقية.',
  ].join("\n");
}

function buildContextBlock(facts: ExtractedEvidenceFact[], candidateIds: string[]): string {
  const cards = candidateIds
    .map((id) => getRequirementByCanonicalId(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) =>
      [
        `- المعرّف: ${r.id}`,
        `  العنوان (حرفيًا): ${r.titleAr}`,
        `  الجهة: ${r.authorityId} / المجال: ${r.domainAr}${r.trackAr ? ` / المسار: ${r.trackAr}` : ""}`,
        `  أهداف/مجالات التحقق المسموحة (اختر منها حرفيًا لـ relatedVerificationTargetAr أو null): ${
          allowedVerificationTargets(r).length ? allowedVerificationTargets(r).join(" | ") : "— (لا يوجد؛ استخدم null)"
        }`,
        `  الحالة التنظيمية: ${r.resolution} / الموسم: ${r.season}`,
      ].join("\n"),
    )
    .join("\n");

  const shown = facts.slice(0, MAX_FACTS_IN_PROMPT);
  const factLines = shown
    .map((f) => {
      const loc =
        f.sourceLocator.kind === "PDF_PAGE"
          ? `PDF صفحة ${f.sourceLocator.page}`
          : `XLSX ${f.sourceLocator.sheet}!${f.sourceLocator.cellRef}`;
      const text =
        f.text.length > MAX_FACT_CHARS_IN_PROMPT
          ? `${f.text.slice(0, MAX_FACT_CHARS_IN_PROMPT)}…`
          : f.text;
      return `- ${f.factId} [${loc}]: ${text.replace(/\n+/g, " / ")}`;
    })
    .join("\n");

  const extra =
    facts.length > shown.length ? `\n(عدد الوقائع الكلي ${facts.length}؛ عُرض أول ${shown.length}.)` : "";

  return [
    "المتطلبات المرشحة المعتمدة (استخدم معرّفاتها فقط):",
    cards,
    "",
    "الوقائع المستخرجة (مع مواضعها — لا تخترع موضعًا):",
    factLines || "(لا توجد وقائع نصية مستخرجة.)",
    extra,
    "",
    `أعِد كائن JSON واحدًا فقط بالبنية الموضحة في تعليمات النظام. كل requirementId يجب أن يكون ضمن [${candidateIds.join(
      ", ",
    )}].`,
  ].join("\n");
}
