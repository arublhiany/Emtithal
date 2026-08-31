// =============================================================================
// Orchestrator routing — deterministic intent classification (Phase 9). NO LLM.
//
// Rule / signal based only. It decides WHICH approved capabilities a request
// needs and in WHAT order — it never answers the request itself. Research is
// never placed before regulation. An unrecognised request routes to UNSUPPORTED
// and invokes nothing.
// =============================================================================

import { normalizeText } from "@/lib/ai/agents/regulatoryRetrieval";
import type {
  OrchestratorCapability,
  OrchestratorIntent,
  RoutingDecision,
} from "./types";

// -- signal dictionaries (normalised) ---------------------------------------
//
// `normalizeText` lowercases, strips Arabic diacritics/tatweel, folds
// alef/ya/ta-marbuta and de-punctuates — so signal strings are written in that
// folded form (e.g. "المتطلب" as-is, "ينطبق" as-is).

const REGULATORY_SIGNALS = [
  "معني المتطلب",
  "معني هذا المتطلب",
  "المتطلب",
  "متطلب",
  "المتطلبات",
  "اشرح المتطلب",
  "اشرح لي المتطلب",
  "ينطبق علينا",
  "هل ينطبق",
  "الانطباق",
  "ينطبق",
  "تنطبق",
  "اللائحه",
  "لائحه",
  "اشتراط",
  "الجهه التنظيميه",
  "requirement",
  "applicab",
  "applies to us",
  "regulation",
  "regulatory",
];

const EVIDENCE_SIGNALS = [
  "وش يثبت هذا الملف",
  "وش يثبت",
  "يثبت هذا الملف",
  "هذا الملف",
  "هذا المستند",
  "هذه الوثيقه",
  "المرفق",
  "اربط هذا الدليل",
  "اربط الدليل",
  "الدليل",
  "دليل",
  "المستند",
  "الوثيقه",
  "الملف المرفوع",
  "evidence",
  "this file",
  "this document",
  "attachment",
  "uploaded file",
  "map this evidence",
];

const DECISION_SIGNALS = [
  "اذا زدنا",
  "اذا زاد",
  "لو زدنا",
  "لو زاد",
  "اذا رفعنا",
  "اذا خفضنا",
  "ماذا لو",
  "قارن السيناريوهات",
  "قارن السيناريو",
  "السيناريو",
  "السيناريوهات",
  "سيناريو",
  "قرار تشغيلي",
  "زياده عدد الحجاج",
  "زياده عدد",
  "نخفض عدد",
  "what if",
  "scenario",
  "compare scenario",
  "simulate the decision",
  "if we increase",
  "if we add",
];

const RESEARCH_SIGNALS = [
  "دعم بحثي",
  "دلاله بحثيه",
  "سند بحثي",
  "دراسه علميه",
  "دراسه",
  "بحث علمي",
  "نمذجه ومحاكاه",
  "النمذجه والمحاكاه",
  "نمذجه",
  "محاكاه",
  "research support",
  "research evidence",
  "modelling",
  "simulation study",
  "is there research",
];

/**
 * Signals that the user EXPLICITLY wants a company-wide deterministic
 * verification / readiness view. Only these trigger `DETERMINISTIC_VERIFICATION`.
 *
 * DELIBERATELY context-specific: the bare Arabic word "التحقق" ("verification")
 * and the bare English "verification" / "coverage" / "gaps" are NOT here — they
 * are ambiguous ("تحقق من هذا الملف" is an evidence request, not a company-wide
 * readiness ask). A company-wide snapshot needs a readiness / company-status
 * phrase.
 */
const VERIFICATION_SIGNALS = [
  "مؤشر الجاهزيه",
  "مؤشر جاهزيه",
  "جاهزيه الشركه",
  "جاهزيه امتثال",
  "نسبه التحقق",
  "تغطيه التحقق",
  "فجوات التحقق",
  "فجوه تحقق",
  "العوائق الحرجه",
  "عائق حرج",
  "وضع الشركه كامل",
  "وضع الشركه الكامل",
  "حاله الشركه",
  "حاله الامتثال العامه",
  "الامتثال العام",
  "readiness",
  "verification coverage",
  "company verification",
  "verification gaps",
  "critical blocker",
  "blockers",
];

/** Canonical requirement-id shapes — a strong REGULATORY signal. */
const REQUIREMENT_ID_RX =
  /\b(HAJ-[A-Z]+-\d{1,3}|MOH-\d{1,3}|CIV-[A-Z]+-\d{1,3}|CR-\d{1,3})\b/i;

/** Returns the first canonical / legacy requirement id mentioned in the text, or null. */
export function extractRequirementId(textAr: string): string | null {
  const m = (textAr ?? "").match(REQUIREMENT_ID_RX);
  return m ? m[0].toUpperCase() : null;
}

interface SignalHit {
  capability: Exclude<
    OrchestratorCapability,
    "DETERMINISTIC_APPLICABILITY" | "DETERMINISTIC_VERIFICATION"
  >;
  signals: string[];
}

function scan(norm: string, dict: string[]): string[] {
  return dict.filter((s) => norm.includes(s));
}

/**
 * Deterministic routing. `evidenceAvailable` = the caller attached a successful
 * evidence extraction (that alone makes EVIDENCE a live capability).
 */
export function classifyIntent(
  textAr: string,
  opts: { evidenceAvailable?: boolean } = {},
): RoutingDecision {
  const raw = textAr ?? "";
  const norm = normalizeText(raw);

  const reg = scan(norm, REGULATORY_SIGNALS);
  const idMatch = raw.match(REQUIREMENT_ID_RX);
  if (idMatch) reg.push(`requirement-id:${idMatch[0]}`);
  const ev = scan(norm, EVIDENCE_SIGNALS);
  if (opts.evidenceAvailable) ev.push("evidence-extraction-attached");
  const dec = scan(norm, DECISION_SIGNALS);
  const res = scan(norm, RESEARCH_SIGNALS);
  const ver = scan(norm, VERIFICATION_SIGNALS);
  // an explicit verification/readiness ask is what enables the company-wide snapshot
  const verificationRequested = ver.length > 0;

  const fired: SignalHit[] = [];
  if (reg.length > 0) fired.push({ capability: "REGULATORY_INTELLIGENCE", signals: reg });
  if (ev.length > 0) fired.push({ capability: "EVIDENCE_INTELLIGENCE", signals: ev });
  if (dec.length > 0) fired.push({ capability: "DECISION_INTELLIGENCE", signals: dec });
  if (res.length > 0) fired.push({ capability: "RESEARCH_INTELLIGENCE", signals: res });

  // locked execution order — REGULATION first, RESEARCH last, always.
  const ORDER: OrchestratorCapability[] = [
    "REGULATORY_INTELLIGENCE",
    "EVIDENCE_INTELLIGENCE",
    "DECISION_INTELLIGENCE",
    "RESEARCH_INTELLIGENCE",
  ];
  const orderedFired = ORDER.filter((c) => fired.some((f) => f.capability === c));

  // Nothing fired at all — not even a verification ask → UNSUPPORTED.
  if (orderedFired.length === 0 && !verificationRequested) {
    return {
      intent: "UNSUPPORTED",
      capabilities: [],
      matchedSignals: [],
      method: "DETERMINISTIC_RULES",
      reasonAr:
        "لم يُطابَق الطلب مع أي قدرة معتمدة (تنظيمية / أدلة / قرار تشغيلي / دعم بحثي / جاهزية-تحقق). لن يُستدعى أي وكيل.",
    };
  }

  const matchedSignals = fired
    .slice()
    .sort((a, b) => ORDER.indexOf(a.capability) - ORDER.indexOf(b.capability))
    .map((f) => ({ capability: f.capability as OrchestratorCapability, signals: f.signals }));
  if (verificationRequested) {
    matchedSignals.push({ capability: "DETERMINISTIC_VERIFICATION", signals: ver });
  }

  // Verification-only request → the deterministic company-wide readiness view
  // ONLY. `verifyAll(...)` runs the canonical applicability logic internally, so
  // no separate `DETERMINISTIC_APPLICABILITY` capability is emitted (it would
  // duplicate deterministic computation for bookkeeping only).
  if (orderedFired.length === 0 && verificationRequested) {
    return {
      intent: "COMBINED_ANALYSIS",
      capabilities: ["DETERMINISTIC_VERIFICATION"],
      matchedSignals,
      method: "DETERMINISTIC_RULES",
      reasonAr:
        "طلب صريح لعرض الجاهزية/التحقق على مستوى الشركة — يُشغَّل محرك التحقق الحتمي فقط، دون أي استدعاء ذكاء اصطناعي.",
    };
  }

  // Exactly one AI capability and no explicit verification ask → that single intent.
  if (orderedFired.length === 1 && !verificationRequested) {
    const only = orderedFired[0];
    const intent = only as OrchestratorIntent; // the 4 single-capability names match the intent names
    return {
      intent,
      capabilities: capabilitiesForSingle(only, false),
      matchedSignals,
      method: "DETERMINISTIC_RULES",
      reasonAr: `طُوبِق الطلب مع قدرة واحدة (${only}). لن تُستدعى القدرات الأخرى، ولن يُشغَّل محرك التحقق على مستوى الشركة.`,
    };
  }

  // ≥2 needs (AI capabilities and/or an explicit verification ask) → COMBINED_ANALYSIS.
  const capabilities = capabilitiesForCombined(orderedFired, verificationRequested);
  const parts = [...orderedFired];
  if (verificationRequested) parts.push("DETERMINISTIC_VERIFICATION");
  return {
    intent: "COMBINED_ANALYSIS",
    capabilities,
    matchedSignals,
    method: "DETERMINISTIC_RULES",
    reasonAr: `طلب مركّب يحتاج: ${parts.join(" → ")}. يُنفَّذ بالترتيب الحتمي (التنظيم أولًا، الدعم البحثي أخيرًا).`,
  };
}

function capabilitiesForSingle(
  cap: OrchestratorCapability,
  verificationRequested: boolean,
): OrchestratorCapability[] {
  const ver: OrchestratorCapability[] = verificationRequested ? ["DETERMINISTIC_VERIFICATION"] : [];
  switch (cap) {
    case "REGULATORY_INTELLIGENCE":
      return ["DETERMINISTIC_APPLICABILITY", ...ver, "REGULATORY_INTELLIGENCE"];
    case "DECISION_INTELLIGENCE":
      // the Phase 7 scenario engine runs its own deterministic verification on
      // cloned profiles internally — the Orchestrator adds a company-wide
      // snapshot ONLY when the user explicitly asked for one.
      return [...ver, "DECISION_INTELLIGENCE"];
    case "EVIDENCE_INTELLIGENCE":
      return [...ver, "EVIDENCE_INTELLIGENCE"];
    case "RESEARCH_INTELLIGENCE":
      return [...ver, "RESEARCH_INTELLIGENCE"];
    default:
      return [cap];
  }
}

function capabilitiesForCombined(
  fired: OrchestratorCapability[],
  verificationRequested: boolean,
): OrchestratorCapability[] {
  const out: OrchestratorCapability[] = [];
  if (fired.includes("REGULATORY_INTELLIGENCE")) out.push("DETERMINISTIC_APPLICABILITY");
  if (verificationRequested) out.push("DETERMINISTIC_VERIFICATION");
  for (const c of fired) out.push(c);
  return out;
}

/**
 * Routing for a caller-forced intent (skips signal scanning). `withVerification`
 * lets the caller also request the company-wide deterministic snapshot.
 */
export function routingForForcedIntent(
  intent: OrchestratorIntent,
  withVerification = false,
): RoutingDecision {
  const capabilities =
    intent === "UNSUPPORTED"
      ? []
      : intent === "COMBINED_ANALYSIS"
        ? capabilitiesForCombined(
            [
              "REGULATORY_INTELLIGENCE",
              "EVIDENCE_INTELLIGENCE",
              "DECISION_INTELLIGENCE",
              "RESEARCH_INTELLIGENCE",
            ],
            withVerification,
          )
        : capabilitiesForSingle(intent as OrchestratorCapability, withVerification);
  return {
    intent,
    capabilities,
    matchedSignals: [],
    method: "CALLER_FORCED",
    reasonAr: `النية محدّدة من المستدعي (${intent}) — تم تخطّي التصنيف بالقواعد.`,
  };
}
