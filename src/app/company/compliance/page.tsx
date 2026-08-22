"use client";

import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { PageHeader } from "@/components/ui/Card";
import { RequirementCard } from "@/components/requirements/RequirementCard";
import { DemoConfigBadge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";

export default function CompliancePage() {
  const { requirements, overallScore, readiness } = useCompanyCompliance();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الامتثال"
        title="المعايير الخمسة المعتمدة للنموذج التجريبي"
        descriptionAr="تقييم مفصّل لكل معيار: النتيجة، الحالة، مستوى الخطر، حالة الأدلة، وسبب الفجوة إن وُجدت."
        action={<DemoConfigBadge size="md" />}
      />

      <div className="card p-5 flex flex-wrap items-center gap-6">
        <ScoreRing score={overallScore} size={96} strokeWidth={10} label="من 100" />
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">{readiness.labelAr}</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1 max-w-md leading-relaxed">
            النتيجة الإجمالية محسوبة بواسطة محرك الامتثال الحتمي كمتوسط مرجّح لنتائج المعايير
            الخمسة وفق الأوزان التجريبية (20% لكل معيار). راجع{" "}
            <span className="font-medium">وثيقة متطلبات النموذج التجريبي</span> لمزيد من التفاصيل.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {requirements.map((r) => (
          <RequirementCard key={r.id} requirement={r} />
        ))}
      </div>
    </div>
  );
}
