// =============================================================================
// Phase 9 tests — deterministic Orchestrator routing (NO LLM).
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import { classifyIntent, routingForForcedIntent } from "@/lib/orchestrator";

const caps = (r: ReturnType<typeof classifyIntent>) => r.capabilities;

test("regulatory-only query → REGULATORY_INTELLIGENCE, no other AI capability", () => {
  const r = classifyIntent("ما معنى هذا المتطلب وهل ينطبق علينا؟");
  assert.equal(r.intent, "REGULATORY_INTELLIGENCE");
  assert.equal(caps(r).includes("REGULATORY_INTELLIGENCE"), true);
  assert.equal(caps(r).includes("EVIDENCE_INTELLIGENCE"), false);
  assert.equal(caps(r).includes("DECISION_INTELLIGENCE"), false);
  assert.equal(caps(r).includes("RESEARCH_INTELLIGENCE"), false);
  assert.equal(caps(r).includes("DETERMINISTIC_APPLICABILITY"), true);
});

test("a bare canonical requirement id is a regulatory signal", () => {
  const r = classifyIntent("HAJ-EXP-05");
  assert.equal(r.intent, "REGULATORY_INTELLIGENCE");
  assert.ok(
    r.matchedSignals[0].signals.some((s) => s.startsWith("requirement-id:")),
  );
});

test("evidence-only query → EVIDENCE_INTELLIGENCE only", () => {
  const r = classifyIntent("وش يثبت هذا الملف؟ اربط هذا الدليل بالمتطلبات");
  // NOTE: "بالمتطلبات" would also fire regulatory, so this stays combined —
  // use a purely evidence phrasing instead:
  const r2 = classifyIntent("وش يثبت هذا الملف المرفوع؟");
  assert.equal(r2.intent, "EVIDENCE_INTELLIGENCE");
  assert.deepEqual(caps(r2), ["EVIDENCE_INTELLIGENCE"]);
  // the mixed phrasing is legitimately combined
  assert.equal(r.intent, "COMBINED_ANALYSIS");
});

test("an attached evidence extraction alone makes EVIDENCE a live capability", () => {
  const r = classifyIntent("راجع هذا", { evidenceAvailable: true });
  assert.equal(r.intent, "EVIDENCE_INTELLIGENCE");
  assert.ok(r.matchedSignals[0].signals.includes("evidence-extraction-attached"));
});

test("scenario / what-if query → DECISION_INTELLIGENCE, no company-wide verification snapshot", () => {
  const r = classifyIntent("إذا زدنا عدد الحجاج، قارن السيناريوهات");
  assert.equal(r.intent, "DECISION_INTELLIGENCE");
  assert.deepEqual(caps(r), ["DECISION_INTELLIGENCE"]);
  // the Phase 7 engine runs its own deterministic verification internally; the
  // Orchestrator adds no company-wide snapshot unless it was explicitly asked for.
  assert.equal(caps(r).includes("DETERMINISTIC_VERIFICATION"), false);
  assert.equal(caps(r).includes("REGULATORY_INTELLIGENCE"), false);
});

test("regulatory explanation/applicability query → NO DETERMINISTIC_VERIFICATION", () => {
  const r = classifyIntent("ما معنى متطلب HAJ-EXP-05 وهل ينطبق علينا؟");
  assert.equal(r.intent, "REGULATORY_INTELLIGENCE");
  assert.deepEqual(caps(r), ["DETERMINISTIC_APPLICABILITY", "REGULATORY_INTELLIGENCE"]);
  assert.equal(caps(r).includes("DETERMINISTIC_VERIFICATION"), false);
});

test("pure readiness / verification query → DETERMINISTIC_VERIFICATION ONLY (no separate applicability capability)", () => {
  const r = classifyIntent("اعرض مؤشر جاهزية امتثال ونسبة التحقق والعوائق الحرجة");
  assert.equal(r.intent, "COMBINED_ANALYSIS");
  // verifyAll(...) runs the canonical applicability logic internally — no
  // duplicate DETERMINISTIC_APPLICABILITY capability just for bookkeeping.
  assert.deepEqual(caps(r), ["DETERMINISTIC_VERIFICATION"]);
  assert.equal(caps(r).includes("DETERMINISTIC_APPLICABILITY"), false);
  assert.equal(caps(r).includes("REGULATORY_INTELLIGENCE"), false);
});

test("bare 'التحقق' does NOT trigger a company-wide verification snapshot", () => {
  // ambiguous — an evidence-verification phrasing, not a company readiness ask
  const withExtraction = classifyIntent("هل تم التحقق من هذا الدليل؟", { evidenceAvailable: true });
  assert.equal(withExtraction.intent, "EVIDENCE_INTELLIGENCE");
  assert.equal(caps(withExtraction).includes("DETERMINISTIC_VERIFICATION"), false);

  const plain = classifyIntent("تحقق من هذا الملف", { evidenceAvailable: true });
  assert.equal(plain.intent, "EVIDENCE_INTELLIGENCE");
  assert.equal(caps(plain).includes("DETERMINISTIC_VERIFICATION"), false);
});

test("'ما وضع الشركة كامل؟' → DETERMINISTIC_VERIFICATION runs", () => {
  const r = classifyIntent("ما وضع الشركة كامل؟");
  assert.equal(r.intent, "COMBINED_ANALYSIS");
  assert.deepEqual(caps(r), ["DETERMINISTIC_VERIFICATION"]);
});

test("regulatory + explicit verification → COMBINED_ANALYSIS with DETERMINISTIC_VERIFICATION", () => {
  const r = classifyIntent("اشرح المتطلب HAJ-EXP-05 وما نسبة التحقق ومؤشر الجاهزية؟");
  assert.equal(r.intent, "COMBINED_ANALYSIS");
  assert.equal(caps(r).includes("DETERMINISTIC_APPLICABILITY"), true);
  assert.equal(caps(r).includes("DETERMINISTIC_VERIFICATION"), true);
  assert.equal(caps(r).includes("REGULATORY_INTELLIGENCE"), true);
});

test("research query → RESEARCH_INTELLIGENCE", () => {
  const r = classifyIntent("هل يوجد دعم بحثي عام لاستخدام النمذجة والمحاكاة؟");
  assert.equal(r.intent, "RESEARCH_INTELLIGENCE");
  assert.deepEqual(caps(r), ["RESEARCH_INTELLIGENCE"]);
});

test("combined request → COMBINED_ANALYSIS with capabilities in the LOCKED order (regulation first, research last)", () => {
  const r = classifyIntent(
    "اشرح لي المتطلب الخاص بفريق السعادة، وهل توجد دلالة بحثية عامة تدعم استخدام المحاكاة عند تقييم البدائل التشغيلية؟",
  );
  assert.equal(r.intent, "COMBINED_ANALYSIS");
  const order = caps(r).filter(
    (c) => c === "REGULATORY_INTELLIGENCE" || c === "RESEARCH_INTELLIGENCE",
  );
  assert.deepEqual(order, ["REGULATORY_INTELLIGENCE", "RESEARCH_INTELLIGENCE"]);
  assert.equal(caps(r).includes("EVIDENCE_INTELLIGENCE"), false);
  assert.equal(caps(r).includes("DECISION_INTELLIGENCE"), false);
});

test("combined request routes only the minimal necessary capabilities", () => {
  // regulation + decision, no evidence, no research, no explicit verification
  const r = classifyIntent("اشرح المتطلب HAJ-EXP-05 ثم إذا زدنا عدد الحجاج قارن السيناريوهات");
  assert.equal(r.intent, "COMBINED_ANALYSIS");
  assert.equal(caps(r).includes("REGULATORY_INTELLIGENCE"), true);
  assert.equal(caps(r).includes("DECISION_INTELLIGENCE"), true);
  assert.equal(caps(r).includes("EVIDENCE_INTELLIGENCE"), false);
  assert.equal(caps(r).includes("RESEARCH_INTELLIGENCE"), false);
  assert.equal(caps(r).includes("DETERMINISTIC_VERIFICATION"), false);
});

test("unrelated / unsupported query → UNSUPPORTED and invokes nothing", () => {
  const r = classifyIntent("كم الساعة الآن في مكة؟");
  assert.equal(r.intent, "UNSUPPORTED");
  assert.deepEqual(r.capabilities, []);
  assert.deepEqual(r.matchedSignals, []);
});

test("routing is always deterministic-rules unless the caller forces an intent", () => {
  assert.equal(classifyIntent("اشرح المتطلب").method, "DETERMINISTIC_RULES");
  const forced = routingForForcedIntent("COMBINED_ANALYSIS");
  assert.equal(forced.method, "CALLER_FORCED");
  assert.equal(forced.intent, "COMBINED_ANALYSIS");
});
