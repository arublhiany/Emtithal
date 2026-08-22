import Link from "next/link";
import type { Gap } from "@/lib/types";
import { RiskBadge } from "@/components/ui/Badge";
import { PRIORITY_LABEL } from "@/lib/labels";

export function GapCard({ gap }: { gap: Gap }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono text-[var(--color-ink-faint)] mb-1">
            {gap.id} · معيار {gap.requirementId} · أولوية {PRIORITY_LABEL[gap.priority]}
          </p>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">{gap.titleAr}</h3>
        </div>
        <RiskBadge level={gap.severity} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <Field label="الحالة الحالية" value={gap.currentStateAr} />
        <Field label="الحالة المطلوبة" value={gap.requiredStateAr} />
        <Field label="نقص الأدلة" value={gap.evidenceDeficiencyAr} />
        <Field label="الأثر التشغيلي" value={gap.operationalImpactAr} />
      </div>

      <div className="rounded-lg bg-[var(--color-status-noncompliant-bg)]/40 border border-[var(--color-status-noncompliant)]/20 p-3">
        <p className="text-[11px] font-medium text-[var(--color-status-noncompliant)] mb-1">
          الخطر التنظيمي
        </p>
        <p className="text-xs text-[var(--color-ink)] leading-relaxed">{gap.regulatoryRiskAr}</p>
      </div>

      <div className="rounded-lg bg-[var(--color-primary-tint)] p-3">
        <p className="text-[11px] font-medium text-[var(--color-primary)] mb-1">
          الإجراء المقترح
        </p>
        <p className="text-xs text-[var(--color-ink)] leading-relaxed">{gap.suggestedActionAr}</p>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-[var(--color-ink-faint)]">
          اكتُشفت {gap.detectedAtLabel}
        </span>
        <Link
          href={`/company/compliance/${gap.requirementId}`}
          className="text-xs font-medium text-[var(--color-primary)] hover:underline"
        >
          عرض المعيار ←
        </Link>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--color-ink-muted)] mb-0.5">{label}</p>
      <p className="text-[var(--color-ink)] leading-relaxed">{value}</p>
    </div>
  );
}
