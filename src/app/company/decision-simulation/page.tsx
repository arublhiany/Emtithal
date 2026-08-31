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
        title="اعرف أثر القرار على الامتثال قبل تنفيذه"
        subtitle="أدخل قرارًا تشغيليًا مقترحًا لتحليل المعايير المتأثرة وتوقّع الأثر ومقارنة البدائل — نتائج حتمية، دون تنبؤ بالذكاء الاصطناعي."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <DecisionForm onSimulate={handleSimulate} isSimulating={isSimulating} />

          {state.decisionHistory.length > 0 && (
            <div className="card p-4 mt-4">
              <p className="text-xs font-semibold text-[var(--color-ink)] mb-2">
                محاكاات سابقة في هذه الجلسة
              </p>
              <div className="space-y-1.5">
                {state.decisionHistory.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveResultId(r.id)}
                    className={`w-full text-right rounded-lg px-3 py-2 text-xs transition-colors ${
                      activeResult?.id === r.id
                        ? "bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-medium"
                        : "text-[var(--color-ink-muted)] hover:bg-[var(--color-bg)]"
                    }`}
                  >
                    {r.decision.titleAr} — {r.currentOverallScore}←{r.predictedOverallScore}
                  </button>
                ))}
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
              hint="أدخل قرارًا تشغيليًا وشغّل المحاكاة لعرض تحليل الأثر المتوقع على الامتثال."
            />
          )}
        </div>
      </div>
    </div>
  );
}
