"use client";

import Link from "next/link";
import { useDemoStore } from "@/lib/store/demoStore";
import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { getMinistryCompanies } from "@/lib/data/ministryCompanies";
import { getRequirements } from "@/lib/data/requirements";
import { PageHeader, Card, SectionHeader } from "@/components/ui/Card";
import { KPICard } from "@/components/ui/KPICard";
import { CompanyTable } from "@/components/ministry/CompanyTable";
import { AlertCard } from "@/components/alerts/AlertCard";
import { GapCard } from "@/components/gaps/GapCard";
import { DEMO_COMPANY_ID } from "@/lib/data/company";

export default function MinistryControlCenterPage() {
  const companies = getMinistryCompanies();
  const requirements = getRequirements();
  const { gaps } = useCompanyCompliance();
  const { state, markAlertRead } = useDemoStore();

  const avgScore = Math.round(
    companies.reduce((sum, c) => sum + c.overallScore, 0) / companies.length
  );
  const highRiskCompanies = companies.filter(
    (c) => c.riskLevel === "critical" || c.riskLevel === "high"
  );
  const attentionCompanies = companies.filter(
    (c) => c.criticalGaps > 0 || c.status === "non_compliant"
  );
  const totalPendingVerification = companies.reduce((s, c) => s + c.pendingVerification, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="مركز التحكم الرقابي"
        title="نظرة شاملة على امتثال الشركات"
        descriptionAr="متابعة مستوى الامتثال عبر الشركات، تحديد الشركات عالية الخطورة، ومراقبة الفجوات المتكررة والمعايير التنظيمية."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="متوسط الامتثال" value={avgScore} suffix="/ 100" />
        <KPICard
          label="شركات عالية الخطورة"
          value={highRiskCompanies.length}toneClass="text-[var(--color-status-noncompliant)]"
        />
        <KPICard
          label="شركات تحتاج متابعة"
          value={attentionCompanies.length}toneClass="text-[var(--color-status-partial)]"
        />
        <KPICard label="بانتظار التحقق" value={totalPendingVerification} />
      </div>

      <Card>
        <SectionHeader
          title="نظرة عامة على الشركات"
          subtitle={`${companies.length} شركات مسجلة ضمن النموذج التجريبي — بيانات ${companies.length - 1} منها ملخّصة، وبيانات تفصيلية على مستوى المعيار متاحة لشركة النور.`}
        />
        <CompanyTable companies={companies} />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader
            title="اتجاهات المعايير — نموذج تفصيلي (شركة النور)"
            subtitle="أول شركة ذات تقييم تفصيلي كامل على مستوى المعايير الخمسة."
          />
          <div className="space-y-2.5">
            {requirements.map((r) => (
              <Link
                key={r.id}
                href={`/ministry/companies/${DEMO_COMPANY_ID}`}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-bg)] transition-colors"
              >
                <span className="text-sm text-[var(--color-ink)]">
                  {r.id} — {r.nameAr}
                </span>
                <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                  {r.score}
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="فجوات ذات أولوية"
            subtitle="من الشركة ذات البيانات التفصيلية المتاحة حاليًا."
          />
          <div className="space-y-3 max-h-[420px] overflow-y-auto pl-1">
            {gaps.slice(0, 2).map((g) => (
              <GapCard key={g.id} gap={g} />
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="تنبيهات حديثة"
          action={
            <Link
              href="/ministry/alerts"
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              الكل ←
            </Link>
          }
        />
        <div className="grid sm:grid-cols-2 gap-3">
          {state.alerts.slice(0, 4).map((a) => (
            <AlertCard key={a.id} alert={a} onMarkRead={markAlertRead} compact />
          ))}
        </div>
      </Card>
    </div>
  );
}
