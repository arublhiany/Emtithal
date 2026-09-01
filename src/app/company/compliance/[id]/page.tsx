"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRequirementById } from "@/lib/data/requirements";
import {
  getRequirementByCanonicalId,
  resolveRequirementId,
  toLegacyRequirementId,
} from "@/lib/data/regulatory";
import { useDemoStore } from "@/lib/store/demoStore";
import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
import { PageHead, Panel, SectionTitle, Chip } from "@/components/ui/kit";
import { ConfidenceBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/viz";
import { DisputeReportButton } from "@/components/disputes/DisputeReportButton";
import {
  RECOMMENDATION_BASIS_AR,
  RECOMMENDATION_HEADING_AR,
  buildComplianceRecommendation,
} from "@/lib/recommendation/complianceRecommendation";
import { EVIDENCE_DIMENSION_STATE_LABEL, EVIDENCE_VALIDATION_LABEL } from "@/lib/labels";
import {
  APPLICABILITY_LABEL_AR,
  OFFICIAL_WEIGHT_LABEL_AR,
  OFFICIAL_WEIGHT_NOTE_AR,
  STATUS_LABEL_AR,
  STATUS_TONE,
  formatSeasonAr,
  officialWeightText,
  show,
} from "@/lib/ui/status";

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
  const { id: raw } = use(params);
  const param = decodeURIComponent(raw).toUpperCase();
  const canonicalId = resolveRequirementId(param) ?? param;
  // The per-criterion narrative fixture is keyed by the legacy ID.
  const legacyId = toLegacyRequirementId(canonicalId) ?? param;
  const requirement = getRequirementById(legacyId);
  const matrixReq = getRequirementByCanonicalId(canonicalId);
  const { canonicalRequirements } = useCompanyCompliance();
  const { state } = useDemoStore();

  if (!requirement) return notFound();

  const canonical = canonicalRequirements.find((r) => r.id === canonicalId);
  const evidence = state.evidence.filter((e) => requirement.evidenceIds.includes(e.id));
  const assessable = canonical?.applicability === "APPLICABLE" && canonical?.readiness != null;

  const recommendation = canonical
    ? buildComplianceRecommendation({
        requirementId: canonical.id,
        titleAr: canonical.titleAr,
        status: canonical.status,
        applicability: canonical.applicability,
        isUnresolvedRegulatory: canonical.isUnresolvedRegulatory,
        isCriticalBlocker: canonical.isCriticalBlocker,
        recommendedActionAr: requirement.recommendedActionAr,
        incompleteEvidenceAr: requirement.evidenceDimensions
          .filter((d) => d.state === "missing" || d.state === "unclear")
          .map((d) => d.labelAr),
        // approved company capability profile — applied only where it materially
        // scopes the recommended action (see complianceRecommendation.ts)
        company: {
          servicesAr: DEMO_COMPANY_PROFILE.servicesAr,
          locationsAr: DEMO_COMPANY_PROFILE.locationsAr,
          workforceSize: DEMO_COMPANY_PROFILE.workforce.count,
          pilgrimsServed: DEMO_COMPANY_PROFILE.pilgrims.count,
          usesExternalProviders:
            DEMO_COMPANY_PROFILE.declaredFacts.contractsExternalServiceProviders,
          companyResponsibleForCamp:
            DEMO_COMPANY_PROFILE.declaredFacts.companyResponsibleForCamp,
        },
      })
    : null;

  return (
    <div className="space-y-6">
      <Link
        href="/company/compliance"
        className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        ← العودة إلى المتطلبات
      </Link>

      <PageHead
        eyebrow={canonical ? `${canonical.authorityNameAr} · ${canonicalId}` : canonicalId}
        title={canonical?.titleAr ?? requirement.nameAr}
        subtitle={requirement.descriptionAr}
        actions={
          canonical ? (
            <>
              <Chip tone={STATUS_TONE[canonical.status]}>{STATUS_LABEL_AR[canonical.status]}</Chip>
              {canonical.applicability !== "APPLICABLE" &&
                APPLICABILITY_LABEL_AR[canonical.applicability] !==
                  STATUS_LABEL_AR[canonical.status] && (
                  <Chip tone="neutral" dot={false}>
                    {APPLICABILITY_LABEL_AR[canonical.applicability]}
                  </Chip>
                )}
              {canonical.isCriticalBlocker && <Chip tone="red">عائق حرج</Chip>}
            </>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <SectionTitle>نتيجة التقييم</SectionTitle>
            <div className="mb-4 flex items-center gap-4">
              <span className="text-4xl font-bold tabular-nums text-[var(--color-ink)]">
                {assessable ? show(canonical?.readiness ?? null) : "—"}
              </span>
              <div className="flex-1">
                <ProgressBar
                  value={assessable ? (canonical?.readiness ?? null) : null}
                  tone={canonical ? STATUS_TONE[canonical.status] : "neutral"}
                />
              </div>
            </div>
            <p className="text-xs text-[var(--color-ink-muted)]">
              محسوبة آليًا؛ نقص الأدلة لا يعني عدم امتثال.
            </p>
            <div className="mt-3 rounded-[var(--radius-control)] bg-[var(--color-bg)] p-3 text-sm">
              <p className="mb-1 text-xs text-[var(--color-ink-muted)]">شرح الفجوة</p>
              <p className="leading-relaxed text-[var(--color-ink)]">
                {requirement.gapExplanationAr}
              </p>
            </div>
          </Panel>

          {recommendation && (
            <Panel className="border-r-2 border-[var(--color-primary)]">
              <SectionTitle>{RECOMMENDATION_HEADING_AR}</SectionTitle>
              <p className="text-[11px] text-[var(--color-ink-faint)]">{RECOMMENDATION_BASIS_AR}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]">
                {recommendation.actionAr}
              </p>
            </Panel>
          )}

          <Panel>
            <SectionTitle>أبعاد الأدلة</SectionTitle>
            <div className="space-y-2.5">
              {requirement.evidenceDimensions.map((d) => {
                const tone = DIM_TONE[d.state];
                return (
                  <div
                    key={d.key}
                    className="flex items-start justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)]">{d.labelAr}</p>
                      {d.note && (
                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">
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
          </Panel>

          <Panel>
            <SectionTitle>الأدلة المرتبطة</SectionTitle>
            {evidence.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">لا توجد أدلة مرتبطة بعد.</p>
            ) : (
              <div className="space-y-2">
                {evidence.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--color-ink)]">{e.fileName}</p>
                      <p className="text-xs text-[var(--color-ink-faint)]">
                        {e.uploadedAtLabel} · {e.sizeLabel}
                      </p>
                    </div>
                    <Chip tone="indigo" dot={false}>
                      {EVIDENCE_VALIDATION_LABEL[e.validationStatus]}
                    </Chip>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/company/evidence"
              className="mt-3 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              إدارة الأدلة ←
            </Link>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <SectionTitle>قراءة مساعدة</SectionTitle>
            <ConfidenceBadge level={requirement.confidence} />
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-ink-muted)]">
              {requirement.confidenceReasonAr}
            </p>
            <div className="mt-4 border-t border-[var(--color-border)] pt-4">
              <DisputeReportButton aiResultRefAr={`تقييم متطلب ${canonicalId}`} />
            </div>
          </Panel>

          <Panel>
            <SectionTitle>معلومات المتطلب</SectionTitle>
            <dl className="space-y-2.5 text-sm">
              <Row
                label="المصدر الرسمي"
                value={matrixReq?.officialSource?.reference ?? "—"}
              />
              <Row label="المرجع في المصفوفة" value={matrixReq?.matrixSourceRef ?? "—"} />
              <Row label="الجهة" value={canonical?.authorityNameAr ?? "—"} />
              <Row label="الموسم" value={formatSeasonAr(matrixReq?.season)} />
              <Row
                label={OFFICIAL_WEIGHT_LABEL_AR}
                value={officialWeightText(canonical?.officialWeightPercent ?? null)}
              />
            </dl>
            {matrixReq?.officialSource?.urls.length ? (
              <ul className="mt-2 space-y-1">
                {matrixReq.officialSource.urls.map((u) => (
                  <li key={u}>
                    <a
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-xs text-[var(--color-primary)] hover:underline"
                    >
                      {u}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-ink-faint)]">
              {OFFICIAL_WEIGHT_NOTE_AR}
            </p>
          </Panel>

          <Panel>
            <SectionTitle>سجل الإصدارات</SectionTitle>
            <div className="space-y-3">
              {requirement.versionHistory.map((v) => (
                <div
                  key={v.version}
                  className="border-r-2 border-[var(--color-primary-tint-strong)] pr-3 text-xs"
                >
                  <p className="font-semibold text-[var(--color-ink)]">الإصدار {v.version}</p>
                  <p className="mt-0.5 text-[var(--color-ink-muted)]">من {v.effectiveFrom}</p>
                  <p className="mt-0.5 text-[var(--color-ink-faint)]">{v.changeNote}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--color-ink-muted)]">{label}</dt>
      <dd className="text-left font-medium text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}
