"use client";

import { useMemo, useState } from "react";
import { useDemoStore } from "@/lib/store/demoStore";
import { PageHeader } from "@/components/ui/Card";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { EvidenceUploadForm } from "@/components/evidence/EvidenceUploadForm";
import type { Evidence } from "@/lib/types";

const FILTERS: { id: "all" | Evidence["status"]; labelAr: string }[] = [
  { id: "all", labelAr: "الكل" },
  { id: "found", labelAr: "مكتملة" },
  { id: "needs_review", labelAr: "بانتظار المراجعة" },
  { id: "outdated", labelAr: "قديمة" },
  { id: "missing", labelAr: "مفقودة" },
];

export default function EvidencePage() {
  const { state, requestEvidenceReview } = useDemoStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const filtered = useMemo(
    () => (filter === "all" ? state.evidence : state.evidence.filter((e) => e.status === filter)),
    [state.evidence, filter]
  );

  const counts = useMemo(() => {
    return {
      found: state.evidence.filter((e) => e.status === "found").length,
      needs_review: state.evidence.filter((e) => e.status === "needs_review").length,
      outdated: state.evidence.filter((e) => e.status === "outdated").length,
      missing: state.evidence.filter((e) => e.status === "missing").length,
    };
  }, [state.evidence]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الأدلة"
        title="مركز الأدلة"
        descriptionAr="رفع الأدلة وربطها بالمعايير، ومتابعة تحليل الذكاء الاصطناعي وحالة التحقق لكل دليل."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.id
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {f.labelAr}
                {f.id !== "all" && (
                  <span className="mr-1 opacity-70">({counts[f.id]})</span>
                )}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((e) => (
              <EvidenceCard key={e.id} evidence={e} onRequestReview={requestEvidenceReview} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--color-ink-muted)] text-center py-10">
              لا توجد أدلة ضمن هذا التصنيف.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <EvidenceUploadForm />
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-2">ملاحظة حول الأدلة الناقصة</h3>
            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
              الأدلة المصنّفة «قديمة» أو «بانتظار المراجعة» ترتبط مباشرة بفجوات ظاهرة في صفحة
              «الفجوات والمخاطر». استكمالها يرفع نتيجة المعيار المرتبط بها فور اعتمادها.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
