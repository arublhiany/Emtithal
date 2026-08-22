"use client";

import { getMinistryCompanies } from "@/lib/data/ministryCompanies";
import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { PageHeader, Card, SectionHeader } from "@/components/ui/Card";
import { RiskMatrix } from "@/components/risk/RiskMatrix";
import { RiskBadge, StatusBadge } from "@/components/ui/Badge";
import Link from "next/link";

const RISK_ORDER = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };

export default function MinistryRisksPage() {
  const companies = [...getMinistryCompanies()].sort(
    (a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]
  );
  const { risks } = useCompanyCompliance();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="المخاطر"
        title="ترتيب الشركات حسب مستوى الخطر"
        descriptionAr="تحديد أولويات المتابعة الرقابية بناءً على مستوى الخطر الحالي لكل شركة."
      />

      <Card>
        <SectionHeader title="الشركات مرتبة حسب الخطورة" />
        <div className="space-y-2">
          {companies.map((c, idx) => (
            <Link
              key={c.id}
              href={`/ministry/companies/${c.id}`}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-bg)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-ink-faint)] w-5">{idx + 1}</span>
                <span className="text-sm font-medium text-[var(--color-ink)]">{c.nameAr}</span>
                <StatusBadge status={c.status} size="sm" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-ink-muted)]">
                  {c.criticalGaps} فجوة حرجة
                </span>
                <RiskBadge level={c.riskLevel} />
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader
          title="مصفوفة المخاطر التفصيلية — شركة النور"
          subtitle="نموذج تفصيلي على مستوى المعيار الواحد لأول شركة مقيّمة بالكامل."
        />
        <RiskMatrix risks={risks} />
      </Card>
    </div>
  );
}
