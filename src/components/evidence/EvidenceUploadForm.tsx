"use client";

import { useRef, useState } from "react";
import { useDemoStore } from "@/lib/store/demoStore";
import { getRegulatoryRequirements } from "@/lib/data/regulatory";
import type { Evidence, EvidenceFileType } from "@/lib/types";
import { DEMO_COMPANY_ID } from "@/lib/data/company";

function inferFileType(name: string): EvidenceFileType {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "xlsx" || ext === "xls") return "excel";
  if (ext === "csv") return "csv";
  if (ext === "doc" || ext === "docx") return "word";
  if (["png", "jpg", "jpeg", "webp"].includes(ext ?? "")) return "image";
  return "other";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidenceUploadForm() {
  const { addEvidence } = useDemoStore();
  const requirements = getRegulatoryRequirements();
  const [requirementId, setRequirementId] = useState(requirements[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);

    // Simulated client-side processing delay — no server-side storage exists
    // in this MVP; the file itself is never uploaded anywhere.
    window.setTimeout(() => {
      const requirement = requirements.find((r) => r.id === requirementId)!;
      const reqTitleAr = requirement.titleAr;
      const evidence: Evidence = {
        id: `EV-DEMO-${Date.now()}`,
        companyId: DEMO_COMPANY_ID,
        requirementIds: [requirementId],
        fileName: file.name,
        fileType: inferFileType(file.name),
        uploadedAtLabel: "الآن",
        uploadedAt: new Date().toISOString(),
        sizeLabel: formatSize(file.size),
        status: "needs_review",
        validationStatus: "pending_verification",
        analysis: {
          summaryAr: `تم استلام الملف وربطه بمتطلب ${requirementId} — ${reqTitleAr}. معالجة أولية داخل المتصفح فقط، وبانتظار المراجعة البشرية لاعتماد المحتوى.`,
          extractedFields: [],
          matchedRequirementIds: [requirementId],
          missingAr: [],
          confidence: "low",
          confidenceReasonAr:
            "رفع داخل الجلسة الحالية فقط؛ لا تتوفر معالجة مستندات فعلية.",
        },
        isDemoUpload: true,
      };
      addEvidence(evidence);
      setSubmitting(false);
      setDone(true);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      window.setTimeout(() => setDone(false), 3500);
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">رفع دليل جديد</h3>
        <p className="text-xs text-[var(--color-ink-muted)] mt-1 leading-relaxed">
          يُحفظ الملف داخل هذه الجلسة في المتصفح فقط، دون تخزين على خادم.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1.5">
          ربط الدليل بمتطلب
        </label>
        <select
          value={requirementId}
          onChange={(e) => setRequirementId(e.target.value)}
          aria-label="ربط الدليل بمتطلب"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          {requirements.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} — {r.titleAr}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1.5">
          الملف (PDF أو Excel أو صورة)
        </label>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-[var(--color-ink-muted)] file:ml-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary-tint)] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[var(--color-primary)] file:cursor-pointer cursor-pointer"
        />
      </div>

      <button
        type="submit"
        disabled={!file || submitting}
        className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "جارٍ المعالجة…" : "رفع الدليل"}
      </button>

      {done && (
        <p className="text-xs text-[var(--color-status-compliant)] font-medium">
          تم رفع الدليل وإضافته بحالة «بانتظار المراجعة».
        </p>
      )}
    </form>
  );
}
