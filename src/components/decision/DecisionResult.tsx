import type { DecisionSimulationResult } from "@/lib/types";
import { displayRequirementId } from "@/lib/data/regulatory";
import { Card, SectionHeader } from "@/components/ui/Card";
import { RiskBadge, ConfidenceBadge, SimulatedBadge } from "@/components/ui/Badge";
import { CompareBar } from "@/components/ui/ScoreRing";
import { ScenarioCompareCard } from "@/components/decision/ScenarioCompareCard";
import { DisputeReportButton } from "@/components/disputes/DisputeReportButton";

export function DecisionResult({ result }: { result: DecisionSimulationResult }) {
  const recommended = result.alternatives.find((a) => a.id === result.recommendedAlternativeId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-[var(--color-ink-muted)]">نتائج المحاكاة</p>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">{result.decision.titleAr}</h2>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge level={result.riskLevel} />
          <SimulatedBadge />
        </div>
      </div>

      {/* Before / after */}
      <Card>
        <SectionHeader title="أثر القرار على الجاهزية" />
        <div className="grid sm:grid-cols-2 gap-6">
          <CompareBar
            beforeValue={result.currentOverallScore}
            afterValue={result.predictedOverallScore}
            label="مؤشر جاهزية امتثال"
          />
          <div className="flex items-center gap-4 sm:justify-end">
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums text-[var(--color-ink-muted)]">
                {result.currentOverallScore}
              </p>
              <p className="text-[11px] text-[var(--color-ink-faint)] mt-1">الحالي</p>
            </div>
            <span className="text-xl text-[var(--color-ink-faint)]">←</span>
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums text-[var(--color-ink)]">
                {result.predictedOverallScore}
              </p>
              <p className="text-[11px] text-[var(--color-ink-faint)] mt-1">المتوقع</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Affected requirements */}
      <Card>
        <SectionHeader
          title="المتطلبات المتأثرة"
          subtitle="يعرض امتثال المتطلبات التي قد يتأثر وضعها بالقرار المقترح."
        />
        <div className="space-y-3">
          {result.affectedRequirements.map((r) => (
            <div
              key={r.requirementId}
              className={`rounded-lg border p-3 ${
                r.includedInScore
                  ? "border-[var(--color-border)]"
                  : "border-dashed border-[var(--color-border)] bg-[var(--color-bg)]"
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--color-ink)]">
                    {r.requirementNameAr}
                  </span>
                  <span className="block text-[11px] text-[var(--color-ink-faint)]">
                    رمز المتطلب: {displayRequirementId(r.requirementId)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs">
                  {r.includedInScore ? (
                    <>
                      <span className="tabular-nums text-[var(--color-ink-muted)]">
                        {r.currentScore} ← {r.predictedScore}
                      </span>
                      <span
                        className={`font-semibold tabular-nums ${
                          r.direction === "negative"
                            ? "text-[var(--color-status-noncompliant)]"
                            : r.direction === "positive"
                              ? "text-[var(--color-status-compliant)]"
                              : "text-[var(--color-ink-muted)]"
                        }`}
                      >
                        ({r.delta > 0 ? "+" : ""}
                        {r.delta})
                      </span>
                      <RiskBadge level={r.riskLevel} size="sm" />
                    </>
                  ) : null}
                  <ConfidenceBadge level={r.confidence} size="sm" />
                </span>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                {r.explanationAr}
              </p>
              {!r.includedInScore && (
                <p className="text-[11px] text-[var(--color-accent-dark)] mt-1.5 font-medium">
                  أثر محتمل — غير محتسب في المؤشر
                </p>
              )}
            </div>
          ))}
          {result.affectedRequirements.length === 0 && (
            <p className="text-xs text-[var(--color-ink-muted)]">
              لم يظهر ارتباط واضح بين هذا القرار وأي متطلب.
            </p>
          )}
        </div>
      </Card>

      {/* Positive / negative / gaps */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs font-semibold text-[var(--color-status-compliant)] mb-2">
            الآثار الإيجابية
          </p>
          <ul className="space-y-1.5">
            {result.positiveImpactsAr.map((t, i) => (
              <li key={i} className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                • {t}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-[var(--color-status-noncompliant)] mb-2">
            الآثار السلبية
          </p>
          <ul className="space-y-1.5">
            {result.negativeImpactsAr.map((t, i) => (
              <li key={i} className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                • {t}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-[var(--color-status-partial)] mb-2">
            فجوات تنظيمية محتملة
          </p>
          {result.regulatoryGapsAr.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-faint)]">لا توجد فجوات متوقعة.</p>
          ) : (
            <ul className="space-y-1.5">
              {result.regulatoryGapsAr.map((t, i) => (
                <li key={i} className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  • {t}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Alternatives */}
      <Card>
        <SectionHeader
          title="البدائل المقترحة"
          subtitle="مقارنة البدائل حسب الأثر على الجاهزية والمخاطرة التشغيلية."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {result.alternatives.map((alt) => (
            <ScenarioCompareCard key={alt.id} alt={alt} />
          ))}
        </div>
      </Card>

      {/* Recommendation + explanation */}
      <Card className="border-[var(--color-primary)]">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <p className="text-xs text-[var(--color-primary)] font-medium mb-1">
              الخيار الموصى به
            </p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">
              {recommended?.labelAr}
            </h3>
          </div>
          <ConfidenceBadge level={result.confidence} />
        </div>
        <p className="text-sm text-[var(--color-ink)] leading-relaxed mb-3">
          {result.explanationAr}
        </p>
        <p className="text-xs text-[var(--color-ink-muted)] mb-4">{result.confidenceReasonAr}</p>

        <div className="pt-3 border-t border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-ink)] mb-2">
            الإجراءات الوقائية المقترحة
          </p>
          <ul className="space-y-1.5 mb-4">
            {result.preventiveActionsAr.map((t, i) => (
              <li key={i} className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                • {t}
              </li>
            ))}
          </ul>
          <DisputeReportButton aiResultRefAr={`محاكاة القرار ${result.id}`} />
        </div>
      </Card>
    </div>
  );
}
