"use client";

import { useGovernmentPortfolio } from "@/lib/hooks/useGovernmentPortfolio";
import { PageHead } from "@/components/ui/kit";
import { KpiTile } from "@/components/ui/viz";
import { CompanyTable } from "@/components/ministry/CompanyTable";
import { show } from "@/lib/ui/status";

export default function MinistryCompaniesPage() {
  const p = useGovernmentPortfolio();

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="الجهات الحكومية"
        title="محفظة الشركات (تجريبي)"
        subtitle="شركات خدمة الحج ضمن النموذج التجريبي، مع مؤشر الجاهزية ونسبة التحقق والعوائق لكل شركة. دون درجة رسمية."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="عدد الشركات" value={p.count} icon="companies" />
        <KpiTile
          label="متوسط مؤشر الجاهزية"
          value={show(p.portfolioReadiness)}
          suffix="من 100"
          icon="control"
        />
        <KpiTile label="بحاجة متابعة" value={p.companiesNeedingAttention} icon="warning" tone="amber" />
        <KpiTile label="بانتظار التحقق" value={p.totalPendingVerification} icon="reviews" tone="indigo" />
      </div>
      <CompanyTable rows={p.rows} />
    </div>
  );
}
