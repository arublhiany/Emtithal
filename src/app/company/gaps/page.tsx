"use client";

import Link from "next/link";
import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { PageHead, Panel, SectionTitle, Chip, EmptyState } from "@/components/ui/kit";
import { KpiTile } from "@/components/ui/viz";
import { UNRESOLVED_REQUIREMENT_AR } from "@/lib/ui/status";

export default function GapsPage() {
  const {
    canonicalRequirements,
    criticalBlockers,
    verificationGaps,
    pendingWarnings,
    insufficientDataWarnings,
    regulatoryPendingIds,
    applicabilityPendingIds,
  } = useCompanyCompliance();

  const titleById = new Map(canonicalRequirements.map((r) => [r.id, r.titleAr] as const));
  const label = (id: string) => `${id} — ${titleById.get(id) ?? ""}`.trim();

  const nonBlockerGaps = verificationGaps.filter((g) => !g.isCriticalBlocker);
  const nothing =
    criticalBlockers.length +
      nonBlockerGaps.length +
      pendingWarnings.length +
      insufficientDataWarnings.length +
      regulatoryPendingIds.length +
      applicabilityPendingIds.length ===
    0;

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="الفجوات والمخاطر"
        title="تحليل الفجوات"
        subtitle="كل بند مرتبط بمتطلب محدد. نقص الأدلة لا يعني عدم امتثال."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="عوائق حرجة" value={criticalBlockers.length} icon="warning" tone="red" />
        <KpiTile label="فجوات تحقق" value={nonBlockerGaps.length} icon="risks" tone="amber" />
        <KpiTile label="بانتظار التحقق" value={pendingWarnings.length} icon="reviews" tone="indigo" />
        <KpiTile label="انطباق غير مؤكد" value={applicabilityPendingIds.length} icon="requirements" />
      </div>

      {nothing ? (
        <EmptyState
          title="لا توجد فجوات مفتوحة"
          hint="جميع المتطلبات المنطبقة القابلة للتقييم ضمن الحدود، ولا توجد بنود بانتظار التحقق."
        />
      ) : (
        <div className="space-y-5">
          <GapGroup
            title="عوائق حرجة"
            tone="red"
            hint="متطلب حرج بحالة غير ملتزم — يُعالج قبل أي إجراء آخر."
            items={criticalBlockers.map((b) => ({
              key: b.requirementId,
              primary: `${b.requirementId} — ${b.titleAr}`,
              secondary: b.reasonAr,
            }))}
          />
          <GapGroup
            title="فجوات التحقق"
            tone="amber"
            hint="متطلبات منطبقة بحالة ملتزم جزئيًا أو غير ملتزم، دون أن تكون عائقًا حرجًا."
            items={nonBlockerGaps.map((g) => ({
              key: g.requirementId,
              primary: `${g.requirementId} — ${g.titleAr}`,
              secondary:
                g.numericGap != null
                  ? `الفجوة الكمية: ${g.numericGap}`
                  : g.unsatisfiedSubRequirements.length
                    ? `متطلبات فرعية غير مستوفاة: ${g.unsatisfiedSubRequirements.length}`
                    : undefined,
            }))}
          />
          <GapGroup
            title="بانتظار التحقق"
            tone="indigo"
            hint="بيانات مُعلنة لم تُعتمد بعد — ليست عدم امتثال ولا تُحتسب صفرًا."
            items={pendingWarnings.map((id) => ({ key: id, primary: label(id) }))}
          />
          <GapGroup
            title="بيانات غير كافية"
            tone="neutral"
            hint="لا تتوفر بيانات كافية لتقييم المتطلب — لا يُفسَّر كعدم امتثال."
            items={insufficientDataWarnings.map((id) => ({ key: id, primary: label(id) }))}
          />
          <GapGroup
            title={UNRESOLVED_REQUIREMENT_AR}
            tone="amber"
            hint="متطلب قيد الاستكمال على مستوى التنظيم — لا يُحتسب على الشركة ولا يدخل في حساب الجاهزية."
            items={regulatoryPendingIds.map((id) => ({ key: id, primary: label(id) }))}
          />
          <GapGroup
            title="انطباق غير مؤكد"
            tone="neutral"
            hint="لم يتضح ما إذا كان المتطلب ينطبق على الشركة — يلزم استكمال بيانات الملف."
            items={applicabilityPendingIds.map((id) => ({ key: id, primary: label(id) }))}
          />
        </div>
      )}

      <p className="text-xs text-[var(--color-ink-muted)]">
        استكمال الأدلة وربط مصادر البيانات يعالج بنود «بانتظار التحقق» و«بيانات غير كافية».{" "}
        <Link href="/company/evidence" className="font-semibold text-[var(--color-primary)] hover:underline">
          إدارة الأدلة ←
        </Link>
      </p>
    </div>
  );
}

function GapGroup({
  title,
  tone,
  hint,
  items,
}: {
  title: string;
  tone: "red" | "amber" | "indigo" | "neutral";
  hint: string;
  items: { key: string; primary: string; secondary?: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <SectionTitle hint={<Chip tone={tone}>{items.length}</Chip>}>{title}</SectionTitle>
      <p className="mb-2 text-xs text-[var(--color-ink-muted)]">{hint}</p>
      <Panel className="space-y-3">
        {items.map((it) => (
          <div
            key={it.key}
            className="border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0"
          >
            <p className="text-sm text-[var(--color-ink)]">{it.primary}</p>
            {it.secondary && (
              <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">{it.secondary}</p>
            )}
          </div>
        ))}
      </Panel>
    </div>
  );
}
