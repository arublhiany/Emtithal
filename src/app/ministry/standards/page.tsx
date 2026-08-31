"use client";

import { useState } from "react";
import { getRequirements } from "@/lib/data/requirements";
import { PageHeader, Card, SectionHeader } from "@/components/ui/Card";
import { DemoConfigBadge } from "@/components/ui/Badge";
import type { StandardLifecycleStatus } from "@/lib/types";

const LIFECYCLE_LABEL: Record<StandardLifecycleStatus, string> = {
  draft: "مسودة",
  approved: "معتمد",
  active: "فعّال",
  superseded: "مستبدَل",
  retired: "متوقف",
};

const LIFECYCLE_TONE: Record<StandardLifecycleStatus, string> = {
  draft: "var(--color-ink-muted)",
  approved: "var(--color-status-review)",
  active: "var(--color-status-compliant)",
  superseded: "var(--color-status-partial)",
  retired: "var(--color-ink-faint)",
};

export default function StandardsPage() {
  const requirements = getRequirements();
  const [localStatus, setLocalStatus] = useState<Record<string, StandardLifecycleStatus>>({});
  const [savedNote, setSavedNote] = useState<string | null>(null);

  function toggleStatus(id: string, current: StandardLifecycleStatus) {
    const next: StandardLifecycleStatus = current === "active" ? "retired" : "active";
    setLocalStatus((s) => ({ ...s, [id]: next }));
    setSavedNote(`تم تحديث حالة ${id} إلى «${LIFECYCLE_LABEL[next]}» ضمن هذه الجلسة (عرض تجريبي).`);
    window.setTimeout(() => setSavedNote(null), 4000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="المتطلبات والمعايير"
        title="إدارة المعايير التنظيمية"
        descriptionAr="عرض دورة حياة كل معيار، الإصدار الحالي، الوزن، تاريخ السريان، وسجل التغييرات. يمكن للمستخدم المخوّل من الوزارة تفعيل أو إيقاف معيار."
        action={<DemoConfigBadge size="md" />}
      />

      <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-tint)] px-4 py-3 text-xs text-[var(--color-accent-dark)] leading-relaxed">
        الأوزان الرسمية للمعايير تُعرض للقراءة فقط كبيانات تعريفية من المصدر الرسمي، ولا تُستخدم
        في حساب مؤشر جاهزية امتثال (V1) — وهو متوسط غير مرجّح. لا يمكن تعديل الأوزان الرسمية من
        هذه الشاشة، ولا تُحسب أي درجة رسمية.
      </div>

      {savedNote && (
        <div className="rounded-lg bg-[var(--color-status-compliant-bg)] text-[var(--color-status-compliant)] text-xs px-4 py-2.5">
          {savedNote}
        </div>
      )}

      <div className="space-y-4">
        {requirements.map((r) => {
          const status = localStatus[r.id] ?? r.status;
          return (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] font-mono text-[var(--color-ink-faint)] mb-1">
                    {r.id} · الإصدار {r.version}
                    {r.criticalGate && (
                      <span className="text-[var(--color-status-noncompliant)]"> · معيار حرج</span>
                    )}
                  </p>
                  <h3 className="text-sm font-semibold text-[var(--color-ink)]">{r.nameAr}</h3>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-1 max-w-2xl leading-relaxed">
                    {r.descriptionAr}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ color: LIFECYCLE_TONE[status], background: "var(--color-bg)" }}
                  >
                    {LIFECYCLE_LABEL[status]}
                  </span>
                  <button
                    onClick={() => toggleStatus(r.id, status)}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-bg)] transition-colors"
                  >
                    {status === "active" ? "إيقاف المعيار" : "تفعيل المعيار"}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-4 gap-3 mb-4 text-xs">
                <Field label="الوزن" value={`${r.weight}%`} />
                <Field label="تاريخ السريان" value={r.effectiveDate} />
                <Field label="آخر تحديث" value={r.lastUpdated} />
                <Field label="المصدر" value={r.source} />
              </div>

              <SectionHeader title="سجل الإصدارات" />
              <div className="space-y-2">
                {r.versionHistory.map((v) => (
                  <div
                    key={v.version}
                    className="flex items-center justify-between rounded-lg bg-[var(--color-bg)] px-3 py-2 text-xs"
                  >
                    <span className="text-[var(--color-ink)]">
                      الإصدار {v.version} — وزن {v.weight}% — {LIFECYCLE_LABEL[v.status]}
                    </span>
                    <span className="text-[var(--color-ink-faint)]">{v.effectiveFrom}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--color-bg)] p-2.5">
      <p className="text-[var(--color-ink-muted)] mb-0.5">{label}</p>
      <p className="text-[var(--color-ink)] font-medium">{value}</p>
    </div>
  );
}
