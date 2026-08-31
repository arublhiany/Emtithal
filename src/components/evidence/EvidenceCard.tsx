import type { Evidence } from "@/lib/types";
import { ConfidenceBadge, NeedsHumanReviewBadge } from "@/components/ui/Badge";
import { EVIDENCE_VALIDATION_LABEL } from "@/lib/labels";
import { DisputeReportButton } from "@/components/disputes/DisputeReportButton";
import { NavIcon } from "@/components/layout/NavIcon";

const FILE_TYPE_LABEL: Record<Evidence["fileType"], string> = {
  pdf: "PDF",
  excel: "Excel",
  csv: "CSV",
  word: "Word",
  image: "صورة",
  other: "ملف",
};

const STATUS_LABEL: Record<Evidence["status"], string> = {
  found: "دليل مكتمل",
  missing: "دليل مفقود",
  outdated: "دليل قديم",
  needs_review: "بانتظار المراجعة",
};

const STATUS_TONE: Record<Evidence["status"], { fg: string; bg: string }> = {
  found: { fg: "var(--color-status-compliant)", bg: "var(--color-status-compliant-bg)" },
  missing: { fg: "var(--color-status-noncompliant)", bg: "var(--color-status-noncompliant-bg)" },
  outdated: { fg: "var(--color-status-partial)", bg: "var(--color-status-partial-bg)" },
  needs_review: { fg: "var(--color-status-review)", bg: "var(--color-status-review-bg)" },
};

export function EvidenceCard({
  evidence,
  onRequestReview,
}: {
  evidence: Evidence;
  onRequestReview?: (id: string) => void;
}) {
  const tone = STATUS_TONE[evidence.status];

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="mt-0.5 shrink-0 text-[var(--color-ink-muted)]"
            title={FILE_TYPE_LABEL[evidence.fileType]}
            aria-hidden
          >
            <NavIcon name="document" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-ink)] break-words">
              {evidence.fileName}
            </p>
            <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
              {evidence.uploadedAtLabel} · {evidence.sizeLabel} ·{" "}
              {evidence.requirementIds.join("، ")}
            </p>
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
          style={{ color: tone.fg, background: tone.bg }}
        >
          {STATUS_LABEL[evidence.status]}
        </span>
      </div>

      <div className="rounded-lg bg-[var(--color-bg)] p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[var(--color-ink-muted)]">تحليل الذكاء الاصطناعي</p>
          <ConfidenceBadge level={evidence.analysis.confidence} size="sm" />
        </div>
        <p className="text-xs text-[var(--color-ink)] leading-relaxed">
          {evidence.analysis.summaryAr}
        </p>
        {evidence.analysis.extractedFields.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-1.5 pt-1">
            {evidence.analysis.extractedFields.map((f) => (
              <div key={f.labelAr} className="text-[11px]">
                <span className="text-[var(--color-ink-muted)]">{f.labelAr}: </span>
                <span className="font-medium text-[var(--color-ink)]">{f.value}</span>
                {f.locationAr && (
                  <span className="text-[var(--color-ink-faint)]"> ({f.locationAr})</span>
                )}
              </div>
            ))}
          </div>
        )}
        {evidence.analysis.missingAr.length > 0 && (
          <div className="pt-1">
            <p className="text-[11px] font-medium text-[var(--color-status-noncompliant)] mb-1">
              عناصر مفقودة:
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              {evidence.analysis.missingAr.map((m) => (
                <li key={m} className="text-[11px] text-[var(--color-ink-muted)]">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-[var(--color-ink-muted)]">
          حالة التحقق: {EVIDENCE_VALIDATION_LABEL[evidence.validationStatus]}
        </span>
        <div className="flex items-center gap-3">
          {evidence.validationStatus === "needs_review" && <NeedsHumanReviewBadge size="sm" />}
          {onRequestReview && evidence.validationStatus !== "needs_review" && (
            <button
              onClick={() => onRequestReview(evidence.id)}
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              طلب مراجعة بشرية
            </button>
          )}
        </div>
      </div>
      <DisputeReportButton aiResultRefAr={`تحليل الدليل ${evidence.fileName}`} />
    </div>
  );
}
