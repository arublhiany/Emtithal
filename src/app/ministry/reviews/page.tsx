"use client";

import { useDemoStore } from "@/lib/store/demoStore";
import { useCompanyCompliance } from "@/lib/hooks/useCompanyCompliance";
import { PageHead, Panel, SectionTitle, Chip, BoundaryChip, EmptyState } from "@/components/ui/kit";
import { TICKET_STATUS_LABEL, EVIDENCE_VALIDATION_LABEL } from "@/lib/labels";
import { displayRequirementId } from "@/lib/data/regulatory";
import { UNRESOLVED_REQUIREMENT_AR } from "@/lib/ui/status";
import type { SupportTicketStatus } from "@/lib/types";

const ISSUE_LABEL: Record<string, string> = {
  wrong_document_interpretation: "تفسير غير صحيح للمستند",
  wrong_requirement_matching: "ربط غير صحيح بالمتطلب",
  wrong_extracted_info: "معلومات مستخرجة غير صحيحة",
  inappropriate_recommendation: "توصية غير مناسبة",
  wrong_analysis: "تحليل غير دقيق",
  missing_context: "سياق ناقص",
  other: "أخرى",
};

const STATUS_FLOW: SupportTicketStatus[] = [
  "open",
  "under_review",
  "waiting_for_user",
  "resolved",
  "closed",
];

export default function MinistryReviewsPage() {
  const { state, setTicketStatus } = useDemoStore();
  const { canonicalRequirements, regulatoryPendingIds } = useCompanyCompliance();
  const titleById = new Map(canonicalRequirements.map((r) => [r.id, r.titleAr] as const));

  const pendingEvidence = state.evidence.filter(
    (e) =>
      e.validationStatus === "pending_verification" || e.validationStatus === "needs_review",
  );

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="الجهات الحكومية"
        title="طابور المراجعة"
        subtitle="ثلاثة مسارات منفصلة: اعتراضات على نتائج التحليل، أدلة تحتاج تحققًا بشريًا، ومتطلبات قيد الاستكمال تنظيميًا."
      />

      <div>
        <SectionTitle
          hint={
            <span className="flex items-center gap-2">
              <BoundaryChip kind="AI" />
              <span className="text-xs text-[var(--color-ink-muted)]">{state.tickets.length}</span>
            </span>
          }
        >
          اعتراضات على نتائج التحليل
        </SectionTitle>
        {state.tickets.length === 0 ? (
          <EmptyState title="لا توجد اعتراضات مفتوحة على نتائج التحليل" />
        ) : (
          <Panel className="space-y-3">
            {state.tickets.map((t) => (
              <div
                key={t.id}
                className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-1 font-mono text-[11px] text-[var(--color-ink-faint)]">
                      {t.id} · {t.createdAtLabel} · {t.createdByRoleAr}
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{t.aiResultRefAr}</p>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      نوع المشكلة: {ISSUE_LABEL[t.issueType]}
                    </p>
                    <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-[var(--color-ink-muted)]">
                      {t.descriptionAr}
                    </p>
                  </div>
                  <select
                    value={t.status}
                    onChange={(e) => setTicketStatus(t.id, e.target.value as SupportTicketStatus)}
                    aria-label="تغيير حالة التذكرة"
                    className="shrink-0 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs"
                  >
                    {STATUS_FLOW.map((s) => (
                      <option key={s} value={s}>
                        {TICKET_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </Panel>
        )}
      </div>

      <div>
        <SectionTitle
          hint={
            <span className="flex items-center gap-2">
              <BoundaryChip kind="VERIFICATION" />
              <span className="text-xs text-[var(--color-ink-muted)]">{pendingEvidence.length}</span>
            </span>
          }
        >
          أدلة بانتظار التحقق البشري
        </SectionTitle>
        {pendingEvidence.length === 0 ? (
          <EmptyState title="لا توجد أدلة بانتظار التحقق البشري" />
        ) : (
          <Panel className="space-y-2">
            {pendingEvidence.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-[var(--color-ink)]">{e.fileName}</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">
                    {e.requirementIds.map(displayRequirementId).join("، ")} · {e.uploadedAtLabel}
                  </p>
                </div>
                <Chip tone="indigo" dot={false}>
                  {EVIDENCE_VALIDATION_LABEL[e.validationStatus]}
                </Chip>
              </div>
            ))}
          </Panel>
        )}
      </div>

      <div>
        <SectionTitle
          hint={
            <span className="flex items-center gap-2">
              <BoundaryChip kind="REGULATION" />
              <span className="text-xs text-[var(--color-ink-muted)]">
                {regulatoryPendingIds.length}
              </span>
            </span>
          }
        >
          {UNRESOLVED_REQUIREMENT_AR}
        </SectionTitle>
        <p className="mb-2 text-xs text-[var(--color-ink-muted)]">
          لا تُنسب إلى الشركة ولا تدخل في حساب الجاهزية.
        </p>
        {regulatoryPendingIds.length === 0 ? (
          <EmptyState title="لا توجد متطلبات قيد الاستكمال تنظيميًا" />
        ) : (
          <Panel className="space-y-2">
            {regulatoryPendingIds.map((id) => (
              <p key={id} className="text-sm text-[var(--color-ink)]">
                <span className="font-mono text-xs text-[var(--color-ink-muted)]">{id}</span> —{" "}
                {titleById.get(id) ?? ""}
              </p>
            ))}
          </Panel>
        )}
      </div>
    </div>
  );
}
