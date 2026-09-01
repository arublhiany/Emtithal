"use client";

import Link from "next/link";
import { useDemoStore } from "@/lib/store/demoStore";
import { useRegMgmt } from "@/components/regmgmt/RegMgmtProvider";
import { PageHead, Panel, SectionTitle, Chip, EmptyState } from "@/components/ui/kit";
import { AlertCard } from "@/components/alerts/AlertCard";
import { REG_CHANGE_TYPE_LABEL_AR } from "@/lib/regmgmt";

export default function MinistryAlertsPage() {
  const { state, markAlertRead } = useDemoStore();
  const { state: reg } = useRegMgmt();

  const alerts = [...state.alerts].sort((a, b) => Number(a.isRead) - Number(b.isRead));
  const regChanges = [...reg.notifications].reverse();

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="الجهات الحكومية"
        title="التنبيهات الرقابية"
        subtitle="إشعارات التغييرات التنظيمية المُنشأة من إدارة المتطلبات، منفصلة عن التنبيهات التشغيلية للشركات."
      />

      <div>
        <SectionTitle hint={`${regChanges.length} إشعار`}>
          إشعارات التغييرات التنظيمية
        </SectionTitle>
        {regChanges.length === 0 ? (
          <EmptyState
            title="لم تُنشأ إشعارات بتغييرات تنظيمية بعد"
            hint="تُنشأ الإشعارات تلقائيًا عند إصدار نسخة جديدة من متطلب أو إلغائه، وتُوجَّه إلى الشركات المتأثرة فقط."
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
                    للشركة {n.companyId}
                    {n.effectiveFrom ? ` · يسري من ${n.effectiveFrom}` : ""} ·{" "}
                    <Link
                      href={`/ministry/requirements/${encodeURIComponent(n.requirementId)}`}
                      className="font-semibold text-[var(--color-primary)]"
                    >
                      المتطلب ←
                    </Link>
                  </p>
                </div>
              </div>
            ))}
          </Panel>
        )}
      </div>

      <div>
        <SectionTitle hint={`${alerts.length} تنبيه`}>تنبيهات تشغيلية (نموذج تجريبي)</SectionTitle>
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
