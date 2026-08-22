"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMinistryCompanies } from "@/lib/data/ministryCompanies";
import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { DEMO_COMPANY_ID } from "@/lib/data/company";
import { PageHeader, Card, SectionHeader } from "@/components/ui/Card";
import { StatusBadge, RiskBadge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { RequirementCard } from "@/components/requirements/RequirementCard";
import { GapCard } from "@/components/gaps/GapCard";

export default function MinistryCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const company = getMinistryCompanies().find((c) => c.id === id);
  if (!company) return notFound();

  const isDetailedCompany = id === DEMO_COMPANY_ID;

  return (
    <div className="space-y-6">
      <Link
        href="/ministry/companies"
        className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        ← العودة إلى الشركات
      </Link>

      <PageHeader
        eyebrow="ملف الشركة"
        title={company.nameAr}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={company.status} />
            <RiskBadge level={company.riskLevel} />
          </div>
        }
      />

      {isDetailedCompany ? (
        <DetailedCompanyView />
      ) : (
        <Card>
          <SectionHeader title="ملخص الامتثال" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <SummaryStat label="نسبة الامتثال" value={company.overallScore} />
            <SummaryStat label="فجوات حرجة" value={company.criticalGaps} />
            <SummaryStat label="بانتظار التحقق" value={company.pendingVerification} />
            <SummaryStat label="إجراءات مفتوحة" value={company.correctiveActionsOpen} />
          </div>
          <div className="rounded-lg bg-[var(--color-bg)] p-3 text-xs text-[var(--color-ink-muted)] leading-relaxed">
            هذه الشركة ضمن بيانات النموذج التجريبي بمستوى ملخّص فقط. البيانات التفصيلية على
            مستوى المعيار الواحد متاحة حاليًا لشركة النور لخدمات الحج كنموذج تطبيقي كامل ضمن
            هذا العرض.
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] p-4">
      <p className="text-2xl font-bold tabular-nums text-[var(--color-ink)]">{value}</p>
      <p className="text-xs text-[var(--color-ink-muted)] mt-1">{label}</p>
    </div>
  );
}

function DetailedCompanyView() {
  const { requirements, gaps, profile, overallScore, readiness } = useCompanyCompliance();

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-6">
        <ScoreRing score={overallScore} size={100} strokeWidth={10} label="من 100" />
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-semibold text-[var(--color-ink)]">{readiness.labelAr}</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            {profile.city} · {profile.pilgrimsServed.toLocaleString("ar")} ضيف · {profile.workforceSize} موظف
          </p>
        </div>
        <div className="flex gap-4 text-center">
          {profile.capabilityIndicators.slice(0, 3).map((c) => (
            <div key={c.key}>
              <p className="text-lg font-bold tabular-nums text-[var(--color-ink)]">{c.value}</p>
              <p className="text-[10px] text-[var(--color-ink-muted)] whitespace-nowrap">
                {c.labelAr}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <h2 className="text-base font-semibold text-[var(--color-ink)] mb-3">المعايير الخمسة</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {requirements.map((r) => (
            <RequirementCard key={r.id} requirement={r} compact />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-[var(--color-ink)] mb-3">
          الفجوات المكتشفة ({gaps.length})
        </h2>
        <div className="grid lg:grid-cols-2 gap-4">
          {gaps.map((g) => (
            <GapCard key={g.id} gap={g} />
          ))}
        </div>
      </div>
    </div>
  );
}
