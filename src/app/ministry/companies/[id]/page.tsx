"use client";

import { use } from "react";
import Link from "next/link";
import { useGovernmentPortfolio } from "@/lib/hooks/useGovernmentPortfolio";
import { PageHead, Panel, EmptyState } from "@/components/ui/kit";
import { KpiTile } from "@/components/ui/viz";
import { READINESS_INDEX_AR, VERIFICATION_COVERAGE_AR, show } from "@/lib/ui/status";

export default function MinistryCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = use(params);
  const id = decodeURIComponent(raw);
  const { rows } = useGovernmentPortfolio();
  const c = rows.find((r) => r.companyId === id) ?? null;

  if (!c) {
    return (
      <div>
        <PageHead eyebrow="الجهات الحكومية" title="الشركة غير موجودة" />
        <EmptyState title="لا توجد شركة بهذا المعرّف ضمن المحفظة التجريبية." hint={id} />
        <Link
          href="/ministry/companies"
          className="mt-4 inline-block text-sm font-semibold text-[var(--color-primary)]"
        >
          ← العودة للمحفظة
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="الجهات الحكومية · شركة (تجريبي)"
        title={c.nameAr}
        subtitle="ملخّص الجاهزية الحتمي للشركة — لا يُحتسب أي تقييم رسمي، ونقص الأدلة لا يعني عدم امتثال."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label={READINESS_INDEX_AR} value={show(c.readiness)} suffix="من 100" icon="control" />
        <KpiTile label={VERIFICATION_COVERAGE_AR} value={show(c.coverage)} icon="compliance" />
        <KpiTile
          label="عوائق حرجة"
          value={c.criticalBlockerCount}
          icon="warning"
          tone={c.criticalBlockerCount > 0 ? "red" : "neutral"}
        />
        <KpiTile label="بانتظار التحقق" value={c.pendingVerificationCount} icon="reviews" tone="indigo" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiTile label="متطلبات غير محسومة تنظيميًا" value={c.regulatoryPendingCount} icon="reviews" />
        <KpiTile label="انطباق غير مؤكد" value={c.applicabilityPendingCount} icon="requirements" />
      </div>
      <Panel>
        <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
          بيانات هذه الشركة مشتقة من ملف الشركة التجريبي الوحيد المعتمد مع اختلافات في الحقائق
          المُعلنة، وتُشغَّل عبر محرك التحقق الحتمي. التقييم التفصيلي على مستوى كل متطلب متاح للشركة
          الأساسية في النموذج.
        </p>
      </Panel>
      <Link
        href="/ministry/companies"
        className="inline-block text-sm font-semibold text-[var(--color-primary)]"
      >
        ← العودة للمحفظة
      </Link>
    </div>
  );
}
