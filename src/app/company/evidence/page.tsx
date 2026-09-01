"use client";

import { useMemo, useState } from "react";
import { useDemoStore } from "@/lib/store/demoStore";
import { PageHead, Panel } from "@/components/ui/kit";
import { KpiTile } from "@/components/ui/viz";
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
    [state.evidence, filter],
  );

  const counts = useMemo(
    () => ({
      found: state.evidence.filter((e) => e.status === "found").length,
      needs_review: state.evidence.filter((e) => e.status === "needs_review").length,
      outdated: state.evidence.filter((e) => e.status === "outdated").length,
      missing: state.evidence.filter((e) => e.status === "missing").length,
    }),
    [state.evidence],
  );

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="الأدلة"
        title="مركز الأدلة"
        subtitle="رفع الأدلة وربطها بالمتطلبات. رفع ملف لا يعني التحقق منه؛ الاعتماد بعد المراجعة."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="مكتملة" value={counts.found} icon="compliance" tone="green" />
        <KpiTile label="بانتظار المراجعة" value={counts.needs_review} icon="reviews" tone="indigo" />
        <KpiTile label="قديمة" value={counts.outdated} icon="document" tone="amber" />
        <KpiTile label="مفقودة" value={counts.missing} icon="warning" tone="red" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.id
                    ? "bg-[var(--color-primary)] text-white"
                    : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {f.labelAr}
                {f.id !== "all" && <span className="ms-1 opacity-70">({counts[f.id]})</span>}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((e) => (
              <EvidenceCard key={e.id} evidence={e} onRequestReview={requestEvidenceReview} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-[var(--color-ink-muted)]">
              لا توجد أدلة ضمن هذا التصنيف.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <EvidenceUploadForm />
          <Panel>
            <h3 className="mb-2 text-sm font-semibold text-[var(--color-ink)]">
              الأدلة القديمة والمعلّقة
            </h3>
            <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
              الأدلة «القديمة» و«بانتظار المراجعة» ترتبط ببنود في «الفجوات»؛ اعتمادها يرفع جاهزية
              متطلبها.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
