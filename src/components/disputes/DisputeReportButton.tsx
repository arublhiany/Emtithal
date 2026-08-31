"use client";

import { useState } from "react";
import { useDemoStore } from "@/lib/store/demoStore";
import type { SupportTicketIssueType } from "@/lib/types";

const ISSUE_OPTIONS: { id: SupportTicketIssueType; labelAr: string }[] = [
  { id: "wrong_document_interpretation", labelAr: "تفسير غير صحيح للمستند" },
  { id: "wrong_requirement_matching", labelAr: "ربط غير صحيح بالمتطلب" },
  { id: "wrong_extracted_info", labelAr: "معلومات مستخرجة غير صحيحة" },
  { id: "inappropriate_recommendation", labelAr: "توصية غير مناسبة" },
  { id: "wrong_analysis", labelAr: "تحليل غير دقيق" },
  { id: "missing_context", labelAr: "سياق ناقص" },
  { id: "other", labelAr: "أخرى" },
];

export function DisputeReportButton({
  aiResultRefAr,
  createdByRoleAr = "مسؤول الامتثال",
}: {
  aiResultRefAr: string;
  createdByRoleAr?: string;
}) {
  const { addTicket, state } = useDemoStore();
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<SupportTicketIssueType>("wrong_analysis");
  const [description, setDescription] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  function submit() {
    const id = `TCK-${(state.tickets.length + 1).toString().padStart(3, "0")}-${Date.now().toString().slice(-4)}`;
    addTicket({
      id,
      companyId: "company-alnoor",
      createdByRoleAr,
      aiResultRefAr,
      issueType,
      descriptionAr: description || "لا يوجد وصف إضافي.",
      status: "open",
      createdAtLabel: "الآن",
    });
    setSubmittedId(id);
  }

  if (submittedId) {
    return (
      <div className="rounded-lg border border-[var(--color-status-compliant)]/30 bg-[var(--color-status-compliant-bg)] px-4 py-3 text-sm text-[var(--color-status-compliant)]">
        تم إنشاء تذكرة مراجعة رقم {submittedId}. سيتم إشعارك عند مراجعتها من فريق الامتثال — لن
        يغيّر هذا الاعتراض النتيجة تلقائيًا.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-primary)] underline decoration-dotted underline-offset-4"
      >
        هل هذا التحليل غير دقيق؟ الإبلاغ عن النتيجة
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-bg)] space-y-3">
      <p className="text-sm font-semibold text-[var(--color-ink)]">
        الإبلاغ عن نتيجة الذكاء الاصطناعي — {aiResultRefAr}
      </p>
      <div>
        <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1.5">
          نوع المشكلة
        </label>
        <select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value as SupportTicketIssueType)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          {ISSUE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.labelAr}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1.5">
          وصف المشكلة (اختياري)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="اشرح لماذا تعتقد أن هذا التحليل غير دقيق..."
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm resize-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          إرسال طلب المراجعة
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
