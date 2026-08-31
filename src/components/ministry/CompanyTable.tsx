"use client";

import Link from "next/link";
import type { PortfolioRow } from "@/lib/hooks/useGovernmentPortfolio";
import { Table, Td, Chip } from "@/components/ui/kit";
import { show, READINESS_INDEX_AR, VERIFICATION_COVERAGE_AR } from "@/lib/ui/status";

export function CompanyTable({ rows }: { rows: PortfolioRow[] }) {
  return (
    <Table
      head={[
        "الشركة",
        READINESS_INDEX_AR,
        VERIFICATION_COVERAGE_AR,
        "عوائق حرجة",
        "بانتظار التحقق",
        "انطباق غير مؤكد",
        "الحالة",
        "",
      ]}
    >
      {rows.map((c) => (
        <tr key={c.companyId}>
          <Td className="font-medium whitespace-nowrap text-[var(--color-ink)]">{c.nameAr}</Td>
          <Td className="tabular-nums font-semibold text-[var(--color-ink)]">{show(c.readiness)}</Td>
          <Td className="tabular-nums text-[var(--color-ink-muted)]">{show(c.coverage)}</Td>
          <Td className="tabular-nums text-[var(--color-ink-muted)]">{c.criticalBlockerCount}</Td>
          <Td className="tabular-nums text-[var(--color-ink-muted)]">{c.pendingVerificationCount}</Td>
          <Td className="tabular-nums text-[var(--color-ink-muted)]">{c.applicabilityPendingCount}</Td>
          <Td>
            {c.criticalBlockerCount > 0 ? (
              <Chip tone="red">عائق حرج</Chip>
            ) : c.needsAttention ? (
              <Chip tone="amber">بحاجة متابعة</Chip>
            ) : (
              <Chip tone="neutral" dot={false}>لا توجد عوائق</Chip>
            )}
          </Td>
          <Td>
            <Link
              href={`/ministry/companies/${encodeURIComponent(c.companyId)}`}
              className="whitespace-nowrap text-xs font-semibold text-[var(--color-primary)] hover:underline"
            >
              عرض التفاصيل ←
            </Link>
          </Td>
        </tr>
      ))}
    </Table>
  );
}
