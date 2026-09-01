"use client";

import Link from "next/link";
import { useDemoStore } from "@/lib/store/demoStore";
import { useGovernmentPortfolio } from "@/lib/hooks/useGovernmentPortfolio";
import { useRegMgmt } from "@/components/regmgmt/RegMgmtProvider";
import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { PageHead, Panel, SectionTitle, Chip } from "@/components/ui/kit";
import { KpiTile, ProgressBar } from "@/components/ui/viz";
import { CompanyTable } from "@/components/ministry/CompanyTable";
import { AlertCard } from "@/components/alerts/AlertCard";
import { STATUS_LABEL_AR, STATUS_TONE, show } from "@/lib/ui/status";
import { CANONICAL_DEMO_COMPANY_ID } from "@/lib/data/demo/companyProfile";

export default function MinistryControlCenterPage() {
  const portfolio = useGovernmentPortfolio();
  const { state } = useRegMgmt();
  const { state: demo } = useDemoStore();
  const { authoritiesView } = useCompanyCompliance();

  const drafts = state.managed.filter((m) => m.draftVersion != null).length;
  const activeManaged = state.managed.filter((m) => m.activeVersion != null).length;

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="الجهات الحكومية"
        title="مركز التحكم الرقابي"
        subtitle="متابعة جاهزية الشركات وإدارة دورة حياة المتطلبات التنظيمية."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="متوسط مؤشر الجاهزية"
          value={show(portfolio.portfolioReadiness)}
          suffix="من 100"
          icon="control"
        />
        <KpiTile
          label="شركات بحاجة متابعة"
          value={portfolio.companiesNeedingAttention}
          icon="companies"
          tone="amber"
        />
        <KpiTile
          label="شركات بعائق حرج"
          value={portfolio.companiesWithCriticalBlocker}
          icon="warning"
          tone="red"
        />
        <KpiTile
          label="بانتظار التحقق"
          value={portfolio.totalPendingVerification}
          icon="reviews"
          tone="indigo"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiTile label="متطلبات مُدارة سارية" value={activeManaged} icon="requirements" />
        <KpiTile
          label="مسودات مفتوحة"
          value={drafts}
          icon="document"
          tone={drafts > 0 ? "amber" : "neutral"}
        />
        <KpiTile label="إشعارات تنظيمية مُنشأة" value={state.notifications.length} icon="alerts" />
      </div>

      <div>
        <SectionTitle
          hint={
            <Link href="/ministry/companies" className="font-semibold text-[var(--color-primary)] hover:underline">
              كل الشركات ←
            </Link>
          }
        >
          نظرة عامة على الشركات
        </SectionTitle>
        <CompanyTable rows={portfolio.rows} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <SectionTitle
            hint={
              <Link
                href={`/ministry/companies/${CANONICAL_DEMO_COMPANY_ID}`}
                className="font-semibold text-[var(--color-primary)] hover:underline"
              >
                التفاصيل ←
              </Link>
            }
          >
            جاهزية المتطلبات — الشركة الأساسية في النموذج
          </SectionTitle>
          <div className="space-y-4">
            {authoritiesView.map((a) => (
              <div key={a.id} className="space-y-2">
                <p className="text-[11px] font-semibold text-[var(--color-ink-faint)]">
                  {a.nameAr}
                </p>
                {a.requirements.map((r) => {
                  const v = r.applicability === "APPLICABLE" ? r.readiness : null;
                  return (
                    <div key={r.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-[var(--color-ink)]">
                          <span className="font-mono text-[var(--color-ink-faint)]">{r.id}</span> —{" "}
                          {r.titleAr}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <Chip tone={STATUS_TONE[r.status]} dot={false}>
                            {STATUS_LABEL_AR[r.status]}
                          </Chip>
                          <span className="font-semibold tabular-nums text-[var(--color-ink)]">
                            {v != null ? show(v) : "—"}
                          </span>
                        </span>
                      </div>
                      <ProgressBar value={v} tone={STATUS_TONE[r.status]} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle
            hint={
              <Link href="/ministry/alerts" className="font-semibold text-[var(--color-primary)] hover:underline">
                الكل ←
              </Link>
            }
          >
            تنبيهات حديثة
          </SectionTitle>
          <div className="space-y-2.5">
            {demo.alerts.slice(0, 4).map((a) => (
              <AlertCard key={a.id} alert={a} compact />
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <SectionTitle
          hint={
            <Link href="/ministry/requirements" className="font-semibold text-[var(--color-primary)] hover:underline">
              إدارة المتطلبات ←
            </Link>
          }
        >
          التغييرات التنظيمية الأخيرة
        </SectionTitle>
        {state.notifications.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-muted)]">
            لم تُنشأ إشعارات تغيير تنظيمي بعد. تُنشأ الإشعارات تلقائيًا للشركات المتأثرة فقط عند تفعيل
            نسخة جديدة أو إلغاء متطلب.
          </p>
        ) : (
          <ul className="space-y-2 text-xs">
            {state.notifications
              .slice(-5)
              .reverse()
              .map((n) => (
                <li key={n.id} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[var(--color-ink)]">{n.titleAr}</span>
                  <span className="text-[var(--color-ink-faint)]">
                    {n.requirementId} · للشركة {n.companyId}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
