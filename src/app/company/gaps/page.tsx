"use client";

import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { PageHeader, SectionHeader, Card } from "@/components/ui/Card";
import { GapCard } from "@/components/gaps/GapCard";
import { RiskMatrix } from "@/components/risk/RiskMatrix";

export default function GapsPage() {
  const { gaps, risks } = useCompanyCompliance();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الفجوات والمخاطر"
        title="تحليل الفجوات والمخاطر"
        descriptionAr="كل فجوة مرتبطة بمعيار محدد مع تحديد الخطورة، نقص الأدلة، الأثر التشغيلي، والأثر التنظيمي المحتمل."
      />

      <Card>
        <SectionHeader
          title="مصفوفة المخاطر"
          subtitle="تصنيف المخاطر حسب الأثر واحتمالية الحدوث — كل خلية تعرض معايير الامتثال المتأثرة."
        />
        <RiskMatrix risks={risks} />
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4">
          الفجوات المكتشفة ({gaps.length})
        </h2>
        <div className="grid lg:grid-cols-2 gap-4">
          {gaps.map((g) => (
            <GapCard key={g.id} gap={g} />
          ))}
        </div>
      </div>
    </div>
  );
}
