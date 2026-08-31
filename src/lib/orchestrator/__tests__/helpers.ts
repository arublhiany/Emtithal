// Shared test doubles for the Phase 9 Orchestrator suite.

import type {
  AIClient,
  AICallMeta,
  AICallResult,
  AIFailureCode,
  GenerateStructuredOptions,
  GenerateTextOptions,
} from "@/lib/ai/client/types";

type FailSpec = { __fail: AIFailureCode };
type PurposeSpec =
  | Record<string, unknown> // a raw object → parsed against the call's schema
  | FailSpec; // a controlled failure for that purpose

function isFail(s: PurposeSpec): s is FailSpec {
  return typeof (s as FailSpec).__fail === "string";
}

function meta(purpose: string, over: Partial<AICallMeta> = {}): AICallMeta {
  return {
    requestId: `fake-${purpose}-${Math.random().toString(36).slice(2, 8)}`,
    purpose,
    provider: "fake",
    model: "fake-model",
    durationMs: 1,
    success: true,
    schemaValid: true,
    failureCode: null,
    confidence: null,
    attempts: 1,
    ...over,
  };
}

/**
 * An `AIClient` that answers `generateStructured` from a per-`purpose` map. A raw
 * object is parsed against the call's own Zod schema (so fixtures stay shape-
 * correct); `{ __fail }` returns a controlled failure. An unmapped purpose fails
 * as AI_UNAVAILABLE. `generateText` is always unavailable.
 */
export type RecordingClient = AIClient & { calls: string[] };

export function fakeClientByPurpose(map: Record<string, PurposeSpec>): RecordingClient {
  const calls: string[] = [];
  return {
    calls,
    async generateStructured<TData>(
      options: GenerateStructuredOptions<TData>,
    ): Promise<AICallResult<TData>> {
      calls.push(options.purpose);
      const spec = map[options.purpose];
      if (!spec) {
        return {
          ok: false,
          failureCode: "AI_UNAVAILABLE",
          message: `no fake mapping for purpose '${options.purpose}'`,
          meta: meta(options.purpose, { success: false, schemaValid: false, failureCode: "AI_UNAVAILABLE" }),
        };
      }
      if (isFail(spec)) {
        const code = spec.__fail;
        return {
          ok: false,
          failureCode: code,
          message: `fake controlled failure (${code})`,
          meta: meta(options.purpose, {
            success: false,
            schemaValid: code !== "SCHEMA_VALIDATION_FAILED",
            failureCode: code,
            attempts: code === "SCHEMA_VALIDATION_FAILED" ? 2 : 1,
          }),
        };
      }
      const parsed = options.schema.safeParse(spec);
      if (!parsed.success) {
        throw new Error(
          `fake fixture for '${options.purpose}' does not satisfy its schema: ${parsed.error.message}`,
        );
      }
      return { ok: true, data: parsed.data, meta: meta(options.purpose) };
    },
    async generateText(options: GenerateTextOptions): Promise<AICallResult<string>> {
      calls.push(`text:${options.purpose}`);
      return {
        ok: false,
        failureCode: "AI_UNAVAILABLE",
        message: "fake client has no text mode",
        meta: meta(options.purpose, { success: false, schemaValid: false, failureCode: "AI_UNAVAILABLE" }),
      };
    },
  };
}

/** A client that is unavailable for every call. */
export function unavailableClient(): AIClient {
  return fakeClientByPurpose({});
}

// -- reusable schema-valid fixture bodies -------------------------------------

export const REG_BODY_SAFE = {
  answerAr: "يتناول هذا المتطلب توثيق فعاليات ومبادرات فريق السعادة وإبراز أثرها على تجربة الحاج.",
  requirementIds: ["HAJ-EXP-05"],
  authorityId: "MOHU",
  missingInformation: [],
  applicabilityExplanationAr: "تُشرح النتيجة الحتمية للانطباق فقط دون إصدار حكم انطباق.",
};

/** A regulatory body whose prose tries to assert a compliance verdict. */
export const REG_BODY_COMPLIANCE_VERDICT = {
  ...REG_BODY_SAFE,
  answerAr: "الشركة ملتزمة بهذا المتطلب بالكامل.",
};

/** A regulatory body whose prose contradicts the deterministic applicability outcome. */
export const REG_BODY_APPLICABILITY_CONTRADICTION = {
  ...REG_BODY_SAFE,
  answerAr: "هذا المتطلب غير منطبق على الشركة.",
  applicabilityExplanationAr: "المتطلب غير منطبق لأن الشركة خارج نطاق مسار التجربة.",
};

export const RESEARCH_BODY_SAFE = (researchId: string, passageId: string) => ({
  summaryAr: "يقدم المصدر الرسمي دعمًا سياقيًا لفكرة استخدام النمذجة والمحاكاة لتقييم البدائل ودعم القرار.",
  insights: [
    {
      researchId,
      claimAr:
        "يشير المصدر الرسمي إلى استخدام تقنيات النمذجة والمحاكاة لتقييم فاعلية المقترحات واقتراح بدائل واستنباط مؤشرات لدعم القرار.",
      relevanceAr:
        "قد يكون ذلك ذا صلة عند تقييم البدائل التشغيلية. لا يمثل ذلك متطلبًا تنظيميًا ولا يتحقق من صحة أي ناتج رقمي محدد.",
      citedPassageIds: [passageId],
      interpretationConfidence: "MEDIUM" as const,
    },
  ],
  noRelevantResearch: false,
  needsHumanReview: false,
});

export const DECISION_INTERPRET_BODY = {
  decisionTitleAr: "زيادة عدد الحجاج المخدومين",
  decisionSummaryAr: "رفع عدد الحجاج مع بقاء بقية الحقول كما هي.",
  requestedChanges: [
    { fieldPath: "pilgrims.count", toValue: "5200", intentAr: "زيادة الطاقة الاستيعابية" },
  ],
  constraints: [],
  assumptionsAr: [],
  ambiguitiesAr: [],
  missingInfoAr: [],
  interpretationConfidence: "MEDIUM" as const,
  needsHumanReview: false,
};

export const DECISION_RECOMMEND_BODY = {
  recommendedScenarioId: "A",
  recommendationAr: "السيناريو أ ينفّذ الزيادة المطلوبة مباشرة؛ راجِع أثر القوى العاملة.",
  tradeoffsAr: ["زيادة الحمل التشغيلي على القوى العاملة"],
  assumptionsAr: [],
  scenarioExplanations: [{ scenarioId: "A", whyChangedAr: "ارتفع مؤشر تشغيلي واحد نتيجة الزيادة." }],
  needsHumanReview: false,
};

/** A recommendation body whose prose asserts a compliance verdict → child rejects it. */
export const DECISION_RECOMMEND_VERDICT_BODY = {
  ...DECISION_RECOMMEND_BODY,
  recommendationAr: "السيناريو أ يجعل الشركة ملتزمة بجميع المتطلبات.",
};
