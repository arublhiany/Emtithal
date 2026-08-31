"use client";

import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { PageHeader } from "@/components/ui/Card";
import { RequirementCard } from "@/components/requirements/RequirementCard";
import { DemoConfigBadge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";

export default function CompliancePage() {
  const { requirements, readinessValue, readinessAvailable, readiness } = useCompanyCompliance();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الامتثال"
        title="المعايير الخمسة المعتمدة للنموذج التجريبي"
        descriptionAr="تقييم مفصّل لكل معيار: النتيجة، الحالة، مستوى الخطر، حالة الأدلة، وسبب الفجوة إن وُجدت."
        action={<DemoConfigBadge size="md" />}
      />

      <div className="card p-5 flex flex-wrap items-center gap-6">
        <ScoreRing
          score={readinessAvailable ? readinessValue : null}
          size={96}
          strokeWidth={10}
          label="مؤشر جاهزية امتثال"
        />
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">{readiness.labelAr}</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1 max-w-md leading-relaxed">
            مؤشر جاهزية امتثال (V1): متوسط غير مرجّح لجاهزية المتطلبات المنطبقة القابلة للتقييم
            فقط، محسوب بمحرك التحقق الحتمي. لا يُستخدم أي وزن في حسابه، والأوزان الرسمية المنشورة
            تُعرض كبيانات تعريفية فقط. لا توجد درجة رسمية.
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
