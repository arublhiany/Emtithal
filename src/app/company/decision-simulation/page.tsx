"use client";

import { useState } from "react";
import { useDemoStore } from "@/lib/store/demoStore";
import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { simulateDecision } from "@/lib/engine/decisionEngine";
import type { DecisionInput } from "@/lib/types";
import { PageHead, EmptyState } from "@/components/ui/kit";
import { DecisionForm } from "@/components/decision/DecisionForm";
import { DecisionResult } from "@/components/decision/DecisionResult";

export default function DecisionSimulationPage() {
  const { requirements } = useCompanyCompliance();
  const { state, addDecisionResult } = useDemoStore();
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);

  const activeResult =
    state.decisionHistory.find((r) => r.id === activeResultId) ?? state.decisionHistory[0];

  function handleSimulate(input: DecisionInput) {
    setIsSimulating(true);
    window.setTimeout(() => {
      const result = simulateDecision(input, requirements);
      addDecisionResult(result);
      setActiveResultId(result.id);
      setIsSimulating(false);
    }, 500);
  }

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="محاكاة القرار"
        title="اختبر أثر القرار قبل تنفيذه"
        subtitle="أدخل قرارًا تشغيليًا مقترحًا لعرض المتطلبات التي قد يتأثر امتثالها ومقارنة البدائل. يعتمد التحليل على بيانات الشركة الحالية."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <DecisionForm onSimulate={handleSimulate} isSimulating={isSimulating} />

          {state.decisionHistory.length > 0 && (
            <div className="card p-4 mt-4">
              <p className="text-xs font-semibold text-[var(--color-ink)] mb-2">
                محاكاات هذه الجلسة
              </p>
              <div className="space-y-1.5">
                {state.decisionHistory.map((r) => {
                  const delta = r.predictedOverallScore - r.currentOverallScore;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setActiveResultId(r.id)}
                      className={`w-full text-right rounded-lg px-3 py-2 text-xs transition-colors ${
                        activeResult?.id === r.id
                          ? "bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-medium"
                          : "text-[var(--color-ink-muted)] hover:bg-[var(--color-bg)]"
                      }`}
                    >
                      <span className="block truncate">{r.decision.titleAr}</span>
                      <span className="text-[var(--color-ink-faint)]">
                        الأثر المتوقع: {delta > 0 ? "+" : ""}
                        {delta} نقطة
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {activeResult ? (
            <DecisionResult result={activeResult} />
          ) : (
            <EmptyState
              title="لا توجد محاكاة بعد"
              hint="أدخل قرارًا تشغيليًا وشغّل المحاكاة لعرض المتطلبات المتأثرة والبدائل."
            />
          )}
        </div>
      </div>
    </div>
  );
}
