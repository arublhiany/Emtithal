"use client";

import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { PageHead, Panel, Chip, SectionTitle } from "@/components/ui/kit";
import { Donut } from "@/components/ui/viz";
import { CanonicalRequirementCard } from "@/components/requirements/CanonicalRequirementCard";
import {
  OFFICIAL_WEIGHT_NOTE_AR,
  READINESS_INDEX_AR,
  VERIFICATION_COVERAGE_AR,
  show,
} from "@/lib/ui/status";

export default function CompliancePage() {
  const {
    authoritiesView,
    canonicalRequirements,
    readinessValue,
    readinessAvailable,
    readiness,
    verificationCoverage,
    hasUnresolvedCriticalGate,
  } = useCompanyCompliance();

  const total = canonicalRequirements.length;
  const applicable = canonicalRequirements.filter((r) => r.applicability === "APPLICABLE").length;

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="الامتثال"
        title="المتطلبات التنظيمية المعتمدة"
        subtitle={`${total} متطلبًا عبر ثلاث جهات تنظيمية. الحالة والجاهزية محسوبة آليًا على ملف الشركة التجريبي، دون درجة رسمية.`}
        actions={
          <Chip tone="amber" dot={false}>
            تكوين تجريبي — غير معتمد رسميًا
          </Chip>
        }
      />

      <Panel className="flex flex-wrap items-center gap-6">
        <Donut
          value={readinessAvailable ? readinessValue : null}
          captionAr={READINESS_INDEX_AR}
          size={104}
          stroke={11}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            {hasUnresolvedCriticalGate
              ? "يتطلب تدخلاً عاجلاً — فجوة حرجة غير محلولة"
              : readiness.labelAr}
          </p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-[var(--color-ink-muted)]">
            {READINESS_INDEX_AR}: متوسط جاهزية المتطلبات المنطبقة القابلة للتقييم.{" "}
            {OFFICIAL_WEIGHT_NOTE_AR} لا توجد درجة إجمالية رسمية.
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--color-ink-muted)]">
            <span>
              {VERIFICATION_COVERAGE_AR}: <b className="tabular-nums">{show(verificationCoverage)}</b>
            </span>
            <span>
              المتطلبات المنطبقة: <b className="tabular-nums">{applicable}</b> من {total}
            </span>
          </div>
        </div>
      </Panel>

      {authoritiesView.map((a) => (
        <div key={a.id}>
          <SectionTitle hint={`${a.requirements.length} متطلب`}>{a.nameAr}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {a.requirements.map((r) => (
              <CanonicalRequirementCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
