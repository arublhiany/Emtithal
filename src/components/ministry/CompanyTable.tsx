import Link from "next/link";
import type { MinistryCompanySummary } from "@/lib/types";
import { StatusBadge, RiskBadge } from "@/components/ui/Badge";

export function CompanyTable({ companies }: { companies: MinistryCompanySummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[820px]">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-right">
            <th className="p-3 font-medium text-[var(--color-ink-muted)]">الشركة</th>
            <th className="p-3 font-medium text-[var(--color-ink-muted)]">نسبة الامتثال</th>
            <th className="p-3 font-medium text-[var(--color-ink-muted)]">الحالة</th>
            <th className="p-3 font-medium text-[var(--color-ink-muted)]">مستوى الخطر</th>
            <th className="p-3 font-medium text-[var(--color-ink-muted)]">فجوات حرجة</th>
            <th className="p-3 font-medium text-[var(--color-ink-muted)]">بانتظار التحقق</th>
            <th className="p-3 font-medium text-[var(--color-ink-muted)]">إجراءات مفتوحة</th>
            <th className="p-3 font-medium text-[var(--color-ink-muted)]">آخر تقييم</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0">
              <td className="p-3 font-medium text-[var(--color-ink)] whitespace-nowrap">
                {c.nameAr}
              </td>
              <td className="p-3 tabular-nums font-semibold text-[var(--color-ink)]">
                {c.overallScore}
              </td>
              <td className="p-3">
                <StatusBadge status={c.status} size="sm" />
              </td>
              <td className="p-3">
                <RiskBadge level={c.riskLevel} size="sm" />
              </td>
              <td className="p-3 tabular-nums text-[var(--color-ink-muted)]">{c.criticalGaps}</td>
              <td className="p-3 tabular-nums text-[var(--color-ink-muted)]">
                {c.pendingVerification}
              </td>
              <td className="p-3 tabular-nums text-[var(--color-ink-muted)]">
                {c.correctiveActionsOpen}
              </td>
              <td className="p-3 text-xs text-[var(--color-ink-faint)] whitespace-nowrap">
                {c.lastAssessmentLabel}
              </td>
              <td className="p-3">
                <Link
                  href={`/ministry/companies/${c.id}`}
                  className="text-xs font-medium text-[var(--color-primary)] hover:underline whitespace-nowrap"
                >
                  عرض التفاصيل ←
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
