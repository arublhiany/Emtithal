"use client";

import Link from "next/link";
import { useDemoStore } from "@/lib/store/demoStore";
import { useRegMgmt } from "@/components/regmgmt/RegMgmtProvider";
import { PageHead, Panel, SectionTitle, Chip, EmptyState } from "@/components/ui/kit";
import { AlertCard } from "@/components/alerts/AlertCard";
import { REG_CHANGE_TYPE_LABEL_AR } from "@/lib/regmgmt";
import { CANONICAL_DEMO_COMPANY_ID } from "@/lib/data/demo/companyProfile";

export default function CompanyAlertsPage() {
  const { state, markAlertRead } = useDemoStore();
  const { state: reg } = useRegMgmt();

  const alerts = [...state.alerts].sort((a, b) => Number(a.isRead) - Number(b.isRead));
  const unread = state.alerts.filter((a) => !a.isRead).length;
  const regChanges = reg.notifications
    .filter((n) => n.companyId === CANONICAL_DEMO_COMPANY_ID)
    .slice()
    .reverse();

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="التنبيهات"
        title="التنبيهات والتغييرات التنظيمية"
        subtitle="تنبيهات تشغيلية ناتجة عن حالة الامتثال، وتغييرات تنظيمية صادرة عن الجهة الحكومية وتنطبق على الشركة."
      />

      <div>
        <SectionTitle
          hint={
            <span className="text-xs text-[var(--color-ink-muted)]">
              {regChanges.length} إشعار تنظيمي
            </span>
          }
        >
          التغييرات التنظيمية
        </SectionTitle>
        {regChanges.length === 0 ? (
          <EmptyState
            title="لا توجد تغييرات تنظيمية تتطلب إجراءً من الشركة حاليًا"
            hint="عند إصدار الجهة الحكومية نسخة جديدة من متطلب ينطبق على الشركة، يظهر الإشعار هنا مع الإجراء المطلوب وتاريخ السريان."
          />
        ) : (
          <Panel className="space-y-3">
            {regChanges.map((n) => (
              <div
                key={n.id}
                className="flex flex-wrap items-start gap-2 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0"
              >
                <Chip tone={n.actionRequired ? "amber" : "neutral"} dot={false}>
                  {REG_CHANGE_TYPE_LABEL_AR[n.type]}
                </Chip>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-ink)]">{n.titleAr}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                    {n.bodyAr}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--color-ink-faint)]">
                    {n.effectiveFrom ? `يسري من ${n.effectiveFrom}` : "بلا تاريخ سريان محدد"}
                    {" · "}
                    <Link href={n.targetHref} className="font-semibold text-[var(--color-primary)]">
                      عرض المتطلب ←
                    </Link>
                  </p>
                </div>
              </div>
            ))}
          </Panel>
        )}
      </div>

      <div>
        <SectionTitle
          hint={
            <span className="text-xs text-[var(--color-ink-muted)]">
              {unread > 0 ? `${unread} غير مقروء` : "لا جديد"}
            </span>
          }
        >
          تنبيهات تشغيلية
        </SectionTitle>
        {alerts.length === 0 ? (
          <EmptyState title="لا توجد تنبيهات تشغيلية" />
        ) : (
          <div className="max-w-3xl space-y-3">
            {alerts.map((a) => (
              <AlertCard key={a.id} alert={a} onMarkRead={markAlertRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
