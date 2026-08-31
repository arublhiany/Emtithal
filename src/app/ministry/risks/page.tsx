"use client";

import Link from "next/link";
import { useGovernmentPortfolio, type PortfolioRow } from "@/lib/hooks/useGovernmentPortfolio";
import { PageHead, Panel, SectionTitle, Chip } from "@/components/ui/kit";
import { KpiTile } from "@/components/ui/viz";
import { READINESS_INDEX_AR, VERIFICATION_COVERAGE_AR, show } from "@/lib/ui/status";

// Deterministic ordering only — most critical blockers first, then most items
// pending verification, then lowest available readiness. No invented risk tier.
function rank(a: PortfolioRow, b: PortfolioRow): number {
  if (b.criticalBlockerCount !== a.criticalBlockerCount)
    return b.criticalBlockerCount - a.criticalBlockerCount;
  if (b.pendingVerificationCount !== a.pendingVerificationCount)
    return b.pendingVerificationCount - a.pendingVerificationCount;
  const ar = a.readiness ?? -1;
  const br = b.readiness ?? -1;
  return ar - br;
}

export default function MinistryRisksPage() {
  const p = useGovernmentPortfolio();
  const ordered = [...p.rows].sort(rank);

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="الجهات الحكومية"
        title="أولويات المتابعة الرقابية (تجريبي)"
        subtitle="ترتيب الشركات حسب العوائق الحرجة، ثم البنود بانتظار التحقق، ثم الجاهزية. لا يُحتسب تصنيف خطر ولا درجة رسمية."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="عدد الشركات" value={p.count} icon="companies" />
        <KpiTile
          label="بعائق حرج"
          value={p.companiesWithCriticalBlocker}
          icon="warning"
          tone="red"
        />
        <KpiTile
          label="بحاجة متابعة"
          value={p.companiesNeedingAttention}
          icon="risks"
          tone="amber"
        />
        <KpiTile
          label="بنود بانتظار التحقق"
          value={p.totalPendingVerification}
          icon="reviews"
          tone="indigo"
        />
      </div>

      <div>
        <SectionTitle hint={`${ordered.length} شركة`}>الترتيب حسب الأولوية</SectionTitle>
        <Panel className="space-y-2">
          {ordered.map((c, i) => (
            <Link
              key={c.companyId}
              href={`/ministry/companies/${encodeURIComponent(c.companyId)}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-bg)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-5 shrink-0 text-xs text-[var(--color-ink-faint)]">{i + 1}</span>
                <span className="truncate text-sm font-medium text-[var(--color-ink)]">
                  {c.nameAr}
                </span>
                {c.criticalBlockerCount > 0 ? (
                  <Chip tone="red">عائق حرج ({c.criticalBlockerCount})</Chip>
                ) : c.needsAttention ? (
                  <Chip tone="amber">بحاجة متابعة</Chip>
                ) : (
                  <Chip tone="neutral" dot={false}>
                    لا توجد عوائق
                  </Chip>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--color-ink-muted)]">
                <span>
                  بانتظار التحقق: <b className="tabular-nums">{c.pendingVerificationCount}</b>
                </span>
                <span>
                  {VERIFICATION_COVERAGE_AR}: <b className="tabular-nums">{show(c.coverage)}</b>
                </span>
                <span>
                  {READINESS_INDEX_AR}: <b className="tabular-nums">{show(c.readiness)}</b>
                </span>
              </div>
            </Link>
          ))}
        </Panel>
      </div>

      <p className="text-xs text-[var(--color-ink-muted)]">
        نقص الأدلة أو وجود بنود بانتظار التحقق لا يعني عدم امتثال. التقييم التفصيلي على مستوى كل
        متطلب متاح من صفحة الشركة.
      </p>
    </div>
  );
}
