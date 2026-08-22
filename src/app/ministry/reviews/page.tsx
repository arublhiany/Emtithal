"use client";

import { useDemoStore } from "@/lib/store/demoStore";
import { PageHeader, Card, SectionHeader } from "@/components/ui/Card";
import { TICKET_STATUS_LABEL, EVIDENCE_VALIDATION_LABEL } from "@/lib/labels";
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
  const pendingEvidence = state.evidence.filter(
    (e) => e.validationStatus === "pending_verification" || e.validationStatus === "needs_review"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="المراجعات"
        title="طابور المراجعة البشرية"
        descriptionAr="تذاكر الاعتراض على نتائج الذكاء الاصطناعي، والأدلة التي تحتاج تحققًا بشريًا."
      />

      <Card>
        <SectionHeader
          title="تذاكر مراجعة نتائج الذكاء الاصطناعي"
          subtitle={`${state.tickets.length} تذكرة`}
        />
        {state.tickets.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-muted)]">لا توجد تذاكر مراجعة حاليًا.</p>
        ) : (
          <div className="space-y-3">
            {state.tickets.map((t) => (
              <div key={t.id} className="rounded-lg border border-[var(--color-border)] p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[11px] font-mono text-[var(--color-ink-faint)] mb-1">
                      {t.id} · {t.createdAtLabel} · {t.createdByRoleAr}
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {t.aiResultRefAr}
                    </p>
                    <p className="text-xs text-[var(--color-accent-dark)] mt-1">
                      نوع المشكلة: {ISSUE_LABEL[t.issueType]}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-1.5 leading-relaxed max-w-xl">
                      {t.descriptionAr}
                    </p>
                  </div>
                  <select
                    value={t.status}
                    onChange={(e) =>
                      setTicketStatus(t.id, e.target.value as SupportTicketStatus)
                    }
                    className="text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 shrink-0"
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
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader
          title="أدلة بانتظار التحقق البشري"
          subtitle={`${pendingEvidence.length} دليل`}
        />
        <div className="space-y-2">
          {pendingEvidence.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2.5"
            >
              <div>
                <p className="text-sm text-[var(--color-ink)]">{e.fileName}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">
                  {e.requirementIds.join("، ")} · {e.uploadedAtLabel}
                </p>
              </div>
              <span className="text-xs text-[var(--color-status-review)] font-medium">
                {EVIDENCE_VALIDATION_LABEL[e.validationStatus]}
              </span>
            </div>
          ))}
          {pendingEvidence.length === 0 && (
            <p className="text-sm text-[var(--color-ink-muted)]">لا توجد أدلة بانتظار التحقق.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
