"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRequirementById } from "@/lib/data/requirements";
import { useDemoStore } from "@/lib/store/demoStore";
import { PageHeader, Card, SectionHeader } from "@/components/ui/Card";
import {
  StatusBadge,
  RiskBadge,
  ConfidenceBadge,
  DemoConfigBadge,
} from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ScoreRing";
import { DisputeReportButton } from "@/components/disputes/DisputeReportButton";
import { EVIDENCE_DIMENSION_STATE_LABEL, EVIDENCE_VALIDATION_LABEL } from "@/lib/labels";

const DIM_TONE: Record<string, { fg: string; bg: string }> = {
  found: { fg: "var(--color-status-compliant)", bg: "var(--color-status-compliant-bg)" },
  missing: { fg: "var(--color-status-noncompliant)", bg: "var(--color-status-noncompliant-bg)" },
  unclear: { fg: "var(--color-status-partial)", bg: "var(--color-status-partial-bg)" },
  pending_verification: {
    fg: "var(--color-status-review)",
    bg: "var(--color-status-review-bg)",
  },
};

export default function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const requirement = getRequirementById(id.toUpperCase());
  const { state } = useDemoStore();

  if (!requirement) return notFound();

  const evidence = state.evidence.filter((e) => requirement.evidenceIds.includes(e.id));

  return (
    <div className="space-y-6">
      <Link
        href="/company/compliance"
        className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        ← العودة إلى المعايير
      </Link>

      <PageHeader
        eyebrow={`معيار ${requirement.id} · الإصدار ${requirement.version}`}
        title={requirement.nameAr}
        descriptionAr={requirement.descriptionAr}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={requirement.complianceStatus} />
            <RiskBadge level={requirement.riskLevel} />
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <SectionHeader
              title="النتيجة والتقييم"
              subtitle={`آخر تقييم: ${requirement.lastEvaluation}`}
            />
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl font-bold tabular-nums text-[var(--color-ink)]">
                {requirement.score}
              </span>
              <div className="flex-1">
                <ProgressBar value={requirement.score} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-[var(--color-bg)] p-3">
                <p className="text-[var(--color-ink-muted)] text-xs mb-1">شرح الفجوة</p>
                <p className="text-[var(--color-ink)] leading-relaxed">
                  {requirement.gapExplanationAr}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-bg)] p-3">
                <p className="text-[var(--color-ink-muted)] text-xs mb-1">
                  الإجراء التصحيحي الموصى به
                </p>
                <p className="text-[var(--color-ink)] leading-relaxed">
                  {requirement.recommendedActionAr}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader
              title="أبعاد الأدلة"
              subtitle="يحسب محرك الامتثال النتيجة آليًا من حالة كل بُعد من أبعاد الأدلة."
            />
            <div className="space-y-2.5">
              {requirement.evidenceDimensions.map((d) => {
                const tone = DIM_TONE[d.state];
                return (
                  <div
                    key={d.key}
                    className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)]">{d.labelAr}</p>
                      {d.note && (
                        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 leading-relaxed">
                          {d.note}
                        </p>
                      )}
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ color: tone.fg, background: tone.bg }}
                    >
                      {EVIDENCE_DIMENSION_STATE_LABEL[d.state]}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionHeader title="الأدلة المرتبطة" />
            {evidence.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">لا توجد أدلة مرتبطة بعد.</p>
            ) : (
              <div className="space-y-2">
                {evidence.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm text-[var(--color-ink)]">{e.fileName}</p>
                      <p className="text-xs text-[var(--color-ink-faint)]">
                        {e.uploadedAtLabel} · {e.sizeLabel}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      {EVIDENCE_VALIDATION_LABEL[e.validationStatus]}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/company/evidence"
              className="inline-block mt-3 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              إدارة الأدلة ←
            </Link>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionHeader title="تحليل الذكاء الاصطناعي" />
            <ConfidenceBadge level={requirement.confidence} />
            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed mt-3">
              {requirement.confidenceReasonAr}
            </p>
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <DisputeReportButton aiResultRefAr={`تقييم معيار ${requirement.id}`} />
            </div>
          </Card>

          <Card>
            <SectionHeader title="معلومات المعيار" />
            <dl className="space-y-2.5 text-sm">
              <Row label="المصدر" value={requirement.source} />
              <Row label="المرجع" value={requirement.sourceReference} />
              <Row label="تاريخ السريان" value={requirement.effectiveDate} />
              <Row label="آخر تحديث" value={requirement.lastUpdated} />
              <Row label="طريقة التقييم" value="هجينة (أدلة + ذكاء اصطناعي + قواعد حتمية)" />
              <Row label="الوزن" value={`${requirement.weight}%`} />
            </dl>
            <div className="mt-3">
              <DemoConfigBadge />
            </div>
          </Card>

          <Card>
            <SectionHeader title="سجل الإصدارات" />
            <div className="space-y-3">
              {requirement.versionHistory.map((v) => (
                <div key={v.version} className="text-xs border-r-2 border-[var(--color-primary-tint-strong)] pr-3">
                  <p className="font-semibold text-[var(--color-ink)]">
                    الإصدار {v.version} — الوزن {v.weight}%
                  </p>
                  <p className="text-[var(--color-ink-muted)] mt-0.5">من {v.effectiveFrom}</p>
                  <p className="text-[var(--color-ink-faint)] mt-0.5">{v.changeNote}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[var(--color-ink-muted)]">{label}</dt>
      <dd className="text-[var(--color-ink)] font-medium">{value}</dd>
    </div>
  );
}
