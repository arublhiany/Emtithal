"use client";

import Link from "next/link";
import { useDemoStore } from "@/lib/store/demoStore";
import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { PageHeader } from "@/components/ui/Card";
import { KPICard } from "@/components/ui/KPICard";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { RequirementCard } from "@/components/requirements/RequirementCard";
import { AlertCard } from "@/components/alerts/AlertCard";
import { RiskBadge } from "@/components/ui/Badge";
import { RISK_LABEL } from "@/lib/labels";
import type { RiskLevel } from "@/lib/types";

const READINESS_TONE: Record<"good" | "warning" | "critical", string> = {
  good: "text-[var(--color-status-compliant)]",
  warning: "text-[var(--color-status-partial)]",
  critical: "text-[var(--color-status-noncompliant)]",
};

export default function CompanyDashboardPage() {
  const { state, markAlertRead } = useDemoStore();
  const {
    requirements,
    profile,
    readinessValue,
    readinessAvailable,
    readiness,
    hasUnresolvedCriticalGate,
    criticalBlockerCount,
    verificationGaps,
    regulatoryPendingCount,
  } = useCompanyCompliance();

  const pendingEvidence = state.evidence.filter(
    (e) => e.status === "missing" || e.status === "needs_review" || e.status === "outdated"
  ).length;
  const openActions = state.actions.filter((a) => a.status !== "completed").length;
  const recentAlerts = [...state.alerts]
    .sort((a, b) => (a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1))
    .slice(0, 4);

  const riskCounts = requirements.reduce<Record<RiskLevel, number>>(
    (acc, r) => {
      acc[r.riskLevel] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0, none: 0 }
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={profile.seasonLabel}
        title={`مرحبًا، ${profile.nameAr}`}
        descriptionAr="نظرة شاملة على وضع الامتثال الحالي — الجاهزية، الفجوات، والمخاطر، خلال ثوانٍ."
      />

      {hasUnresolvedCriticalGate && (
        <div className="rounded-xl border border-[var(--color-status-noncompliant)]/30 bg-[var(--color-status-noncompliant-bg)] px-5 py-4 flex items-start gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-status-noncompliant)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          >
            <path d="M12 4 3 19h18z" />
            <path d="M12 10v4M12 17h.01" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-[var(--color-status-noncompliant)]">
              عائق حرج قائم — متطلب حرج بحالة غير ملتزم
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">
              مؤشر جاهزية امتثال العام لا يُخفي متطلبًا حرجًا غير مستوفٍ. راجع المتطلبات الحرجة
              قبل أي إجراء آخر.
            </p>
          </div>
        </div>
      )}

      {/* Top row: overall score + KPIs */}
      <div className="grid lg:grid-cols-4 gap-4">
        <div className="card p-6 flex items-center gap-5 lg:col-span-1">
          <ScoreRing score={readinessAvailable ? readinessValue : null} label="مؤشر جاهزية امتثال" />
          <div>
            <p className="text-xs text-[var(--color-ink-muted)] mb-1">
              مؤشر جاهزية امتثال (V1)
            </p>
            <p className={`text-sm font-semibold ${READINESS_TONE[readiness.tone]}`}>
              {readiness.labelAr}
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 grid sm:grid-cols-3 gap-4">
          <KPICard
            label="فجوات التحقق"
            value={verificationGaps.length}toneClass="text-[var(--color-status-partial)]"
          />
          <KPICard
            label="المعوّقات الحرجة"
            value={criticalBlockerCount}
            toneClass="text-[var(--color-status-noncompliant)]"/>
          <KPICard
            label="بانتظار تحقق تنظيمي"
            value={regulatoryPendingCount}toneClass="text-[var(--color-status-review)]"
          />
          <KPICard
            label="الأدلة بحاجة متابعة"
            value={pendingEvidence}toneClass="text-[var(--color-status-partial)]"
          />
          <KPICard
            label="الإجراءات التصحيحية الجارية"
            value={openActions}/>
          <KPICard
            label="عدد المعايير المقيّمة"
            value={`${requirements.length}/5`}/>
        </div>
      </div>

      {/* Five criteria overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              نظرة عامة على المعايير الخمسة
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              الحالة والجاهزية محسوبة بمحرك التحقق الحتمي. الأوزان الرسمية بيانات تعريفية فقط.
            </p>
          </div>
          <Link
            href="/company/compliance"
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            عرض التفاصيل الكاملة ←
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {requirements.map((r) => (
            <RequirementCard key={r.id} requirement={r} compact />
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Risk visualization */}
        <section className="card p-5 lg:col-span-1">
          <h2 className="text-base font-semibold text-[var(--color-ink)] mb-4">
            توزيع المخاطر
          </h2>
          <div className="space-y-3">
            {(["critical", "high", "medium", "low"] as RiskLevel[]).map((level) => (
              <div key={level} className="flex items-center gap-3">
                <div className="w-20 shrink-0">
                  <RiskBadge level={level} size="sm" />
                </div>
                <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(riskCounts[level] / requirements.length) * 100}%`,
                      background:
                        level === "critical"
                          ? "var(--color-risk-critical)"
                          : level === "high"
                            ? "var(--color-risk-high)"
                            : level === "medium"
                              ? "var(--color-risk-medium)"
                              : "var(--color-risk-low)",
                    }}
                  />
                </div>
                <span className="text-xs tabular-nums text-[var(--color-ink-muted)] w-4 text-left">
                  {riskCounts[level]}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/company/gaps"
            className="block mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            عرض تحليل الفجوات والمخاطر ←
          </Link>
        </section>

        {/* Recent alerts */}
        <section className="card p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--color-ink)]">تنبيهات حديثة</h2>
            <Link
              href="/company/alerts"
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              الكل ←
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentAlerts.map((a) => (
              <AlertCard key={a.id} alert={a} onMarkRead={markAlertRead} compact />
            ))}
          </div>
        </section>

        {/* AI recommendations */}
        <section className="card p-5 lg:col-span-1">
          <h2 className="text-base font-semibold text-[var(--color-ink)] mb-1">
            توصيات الذكاء الاصطناعي
          </h2>
          <p className="text-xs text-[var(--color-ink-muted)] mb-4">
            توصيات تفسيرية مبنية على نتائج محرك الامتثال الحتمي.
          </p>
          <div className="space-y-3">
            {requirements
              .filter((r) => r.complianceStatus !== "compliant")
              .sort((a, b) => a.score - b.score)
              .slice(0, 3)
              .map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-[var(--color-border)] p-3 text-sm"
                >
                  <p className="text-[11px] font-mono text-[var(--color-ink-faint)] mb-1">
                    {r.id} · {RISK_LABEL[r.riskLevel]} الخطورة
                  </p>
                  <p className="text-[var(--color-ink)] leading-relaxed">
                    {r.recommendedActionAr}
                  </p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
