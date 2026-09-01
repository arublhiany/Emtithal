"use client";

import Link from "next/link";
import { useDemoStore } from "@/lib/store/demoStore";
import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { displayRequirementId } from "@/lib/data/regulatory";
import { PageHead, Panel, SectionTitle, AlertBanner, Chip } from "@/components/ui/kit";
import { KpiTile, Donut, ProgressBar, BarChartH } from "@/components/ui/viz";
import { AlertCard } from "@/components/alerts/AlertCard";
import { NavIcon } from "@/components/layout/NavIcon";
import {
  READINESS_INDEX_AR,
  VERIFICATION_COVERAGE_AR,
  STATUS_LABEL_AR,
  STATUS_TONE,
  show,
} from "@/lib/ui/status";

export default function CompanyDashboardPage() {
  const { state } = useDemoStore();
  const {
    authoritiesView,
    canonicalRequirements,
    profile,
    readinessValue,
    readinessAvailable,
    readiness,
    hasUnresolvedCriticalGate,
    criticalBlockerCount,
    verificationGaps,
    regulatoryPendingCount,
    applicabilityPendingCount,
    verificationCoverage,
    statusCounts,
  } = useCompanyCompliance();

  const pendingEvidence = state.evidence.filter(
    (e) => e.status === "missing" || e.status === "needs_review" || e.status === "outdated",
  ).length;
  const openActions = state.actions.filter((a) => a.status !== "completed").length;
  const recentAlerts = [...state.alerts]
    .sort((a, b) => Number(a.isRead) - Number(b.isRead))
    .slice(0, 3);
  const applicableCount = canonicalRequirements.filter(
    (r) => r.applicability === "APPLICABLE",
  ).length;

  const statusRows = [
    { labelAr: "غير ملتزم", value: statusCounts.NON_COMPLIANT, tone: "red" as const },
    { labelAr: "ملتزم جزئيًا", value: statusCounts.PARTIALLY_COMPLIANT, tone: "amber" as const },
    { labelAr: "بانتظار التحقق", value: statusCounts.PENDING_VERIFICATION, tone: "indigo" as const },
    { labelAr: "ملتزم", value: statusCounts.COMPLIANT, tone: "green" as const },
  ];

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow={profile.seasonLabel}
        title={`مرحبًا، ${profile.nameAr}`}
        subtitle="نظرة شاملة على وضع الامتثال الحالي — الجاهزية، التحقق، الفجوات، والمخاطر."
      />

      {hasUnresolvedCriticalGate && (
        <AlertBanner tone="red" title="عائق حرج — متطلب حرج بحالة غير ملتزم">
          يوجد متطلب حرج غير مستوفٍ. عالجه قبل أي إجراء آخر، بصرف النظر عن قيمة {READINESS_INDEX_AR}.
        </AlertBanner>
      )}

      {/* KPI band + readiness donut */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiTile
            label={VERIFICATION_COVERAGE_AR}
            value={show(verificationCoverage)}
            icon="compliance"
          />
          <KpiTile label="عوائق حرجة" value={criticalBlockerCount} icon="warning" tone="red" />
          <KpiTile label="فجوات التحقق" value={verificationGaps.length} icon="risks" tone="amber" />
          <KpiTile
            label="بانتظار تحقق تنظيمي"
            value={regulatoryPendingCount}
            icon="reviews"
            tone="indigo"
          />
          <KpiTile label="انطباق غير مؤكد" value={applicabilityPendingCount} icon="requirements" />
          <KpiTile label="الأدلة بحاجة متابعة" value={pendingEvidence} icon="evidence" tone="amber" />
        </div>
        <Panel className="flex w-full flex-col items-center gap-3 lg:w-64">
          <Donut
            value={readinessAvailable ? readinessValue : null}
            captionAr={READINESS_INDEX_AR}
          />
          <p className="text-xs font-medium text-[var(--color-ink)]">{READINESS_INDEX_AR}</p>
          <p className="text-center text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
            {readiness.labelAr}
          </p>
        </Panel>
      </div>

      {/* canonical requirement overview — all authorities */}
      <div>
        <SectionTitle
          hint={
            <Link href="/company/compliance" className="font-semibold text-[var(--color-primary)] hover:underline">
              عرض التفاصيل الكاملة ←
            </Link>
          }
        >
          نظرة عامة على المتطلبات
        </SectionTitle>
        <p className="mb-3 text-xs text-[var(--color-ink-muted)]">
          {applicableCount} متطلبًا منطبقًا من {canonicalRequirements.length} عبر ثلاث جهات.
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          {authoritiesView.map((a) => (
            <Panel key={a.id} className="space-y-2.5">
              <p className="text-xs font-semibold text-[var(--color-ink)]">
                {a.nameAr}
                <span className="ms-1 font-normal text-[var(--color-ink-faint)]">
                  ({a.requirements.length})
                </span>
              </p>
              {a.requirements.map((r) => (
                <div key={r.id} className="space-y-1.5 border-b border-[var(--color-border)] pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs leading-snug text-[var(--color-ink)]">{r.titleAr}</span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-[var(--color-ink)]">
                      {r.applicability === "APPLICABLE" && r.readiness != null ? show(r.readiness) : "—"}
                    </span>
                  </div>
                  <ProgressBar
                    value={r.applicability === "APPLICABLE" ? r.readiness : null}
                    tone={STATUS_TONE[r.status]}
                  />
                  <Chip tone={STATUS_TONE[r.status]} dot={false}>
                    {STATUS_LABEL_AR[r.status]}
                  </Chip>
                </div>
              ))}
            </Panel>
          ))}
        </div>
      </div>

      {/* bottom band */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel>
          <SectionTitle>الإجراءات المفتوحة</SectionTitle>
          {openActions === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)]">لا توجد إجراءات مفتوحة حاليًا.</p>
          ) : (
            <ul className="space-y-3">
              {state.actions
                .filter((a) => a.status !== "completed")
                .slice(0, 4)
                .map((a) => (
                  <li key={a.id} className="border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                    <p className="font-mono text-xs font-semibold text-[var(--color-ink-muted)]">
                      {displayRequirementId(a.requirementId)}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--color-ink)]">{a.titleAr}</p>
                  </li>
                ))}
            </ul>
          )}
          <Link
            href="/company/improvement-plan"
            className="mt-3 inline-block text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            خطة التحسين ←
          </Link>
        </Panel>

        <Panel>
          <SectionTitle
            hint={
              <Link href="/company/alerts" className="font-semibold text-[var(--color-primary)] hover:underline">
                الكل ←
              </Link>
            }
          >
            تنبيهات حديثة
          </SectionTitle>
          <div className="space-y-2.5">
            {recentAlerts.map((a) => (
              <AlertCard key={a.id} alert={a} compact />
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle>توزيع حالات التحقق</SectionTitle>
          <BarChartH
            rows={statusRows}
            linkHref="/company/gaps"
            linkLabel="تحليل الفجوات والمخاطر"
          />
        </Panel>
      </div>

      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-[var(--color-primary)]" aria-hidden>
            <NavIcon name="research" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">دعم بحثي</p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
              ابحث في الأبحاث والدراسات الداعمة للقرار. الدراسات تدعم القرار ولا تُعد اشتراطات تنظيمية.
            </p>
          </div>
        </div>
        <Link
          href="/company/research"
          className="shrink-0 text-xs font-semibold text-[var(--color-primary)] hover:underline"
        >
          استعرض ←
        </Link>
      </Panel>
    </div>
  );
}
