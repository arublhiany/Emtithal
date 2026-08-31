"use client";

import { useMemo, useState } from "react";
import { PageHead, Panel, SectionTitle, Btn, Table, Td, Chip } from "@/components/ui/kit";
import {
  buildComplianceReport,
  displayValue,
  toReportCsv,
  toReportHtml,
  type ComplianceReport,
  type ReportRequirementRow,
} from "@/lib/regmgmt";
import { AUTHORITY_NAME_AR } from "@/lib/regmgmt/labels";
import { getRegulatoryRequirements } from "@/lib/data/regulatory";
import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
import { DEMO_VERIFICATION_INPUTS } from "@/lib/data/demo/verificationInputs";
import { verifyAll } from "@/lib/engine/verificationEngine";

const APPLICABILITY_AR: Record<string, string> = {
  APPLICABLE: "منطبق",
  NOT_APPLICABLE: "غير منطبق",
  INSUFFICIENT_DATA: "بيانات غير كافية",
};
const STATUS_AR: Record<string, string> = {
  COMPLIANT: "ملتزم",
  PARTIALLY_COMPLIANT: "ملتزم جزئيًا",
  NON_COMPLIANT: "غير ملتزم",
  PENDING_VERIFICATION: "بانتظار التحقق",
  INSUFFICIENT_DATA: "بيانات غير كافية",
  NOT_APPLICABLE: "غير منطبق",
};

function buildDemoReport(): ComplianceReport {
  const reqs = getRegulatoryRequirements();
  const run = verifyAll(reqs, DEMO_COMPANY_PROFILE, DEMO_VERIFICATION_INPUTS);
  const byId = new Map(reqs.map((r) => [r.id, r]));
  const rows: ReportRequirementRow[] = run.results.map((r) => {
    const req = byId.get(r.requirementId);
    return {
      requirementId: r.requirementId,
      titleAr: r.titleAr,
      authorityAr: AUTHORITY_NAME_AR[r.authorityId] ?? r.authorityId,
      applicabilityAr: APPLICABILITY_AR[r.applicability] ?? r.applicability,
      verificationStatusAr: STATUS_AR[r.status] ?? r.status,
      readiness: r.readiness, // null → "—" in the report, never 0
      isCriticalBlocker: run.criticalBlockers.some((b) => b.requirementId === r.requirementId),
      officialSourceReferenceAr: req?.officialSource ? req.officialSource.reference : null,
      officialSourceUrls: req?.officialSource ? [...req.officialSource.urls] : [],
      notesAr: r.regulatoryPending ? "متطلب قيد الاستكمال تنظيميًا" : "",
    };
  });
  return buildComplianceReport({
    companyNameAr: `${DEMO_COMPANY_PROFILE.legalNameAr}`,
    seasonAr: DEMO_COMPANY_PROFILE.season,
    generatedAtIso: new Date().toISOString(),
    readinessIndex: run.readiness.value, // null → "—"
    verificationCoverage: run.coverage.value, // null → "—"
    requirements: rows,
    gapsAr: run.verificationGaps.map(
      (g) => `${g.requirementId} — ${g.titleAr} (${STATUS_AR[g.status] ?? g.status})`,
    ),
    criticalBlockerIds: run.criticalBlockers.map((b) => b.requirementId),
    unresolvedRequirementIds: [...run.regulatoryPendingIds],
    pendingVerificationIds: [...run.pendingWarnings],
  });
}

export default function GovernmentReportsPage() {
  const report = useMemo(() => buildDemoReport(), []);
  const [done, setDone] = useState<string | null>(null);

  function downloadCsv() {
    const blob = new Blob([toReportCsv(report)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emtithal-readiness-${report.seasonAr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDone("تم تنزيل ملف CSV.");
  }

  function openPrintable() {
    const w = window.open("", "_blank");
    if (!w) {
      setDone("تعذّر فتح نافذة الطباعة — اسمح بالنوافذ المنبثقة.");
      return;
    }
    w.document.write(toReportHtml(report));
    w.document.close();
    w.focus();
    setDone("فُتح التقرير الجاهز للطباعة في تبويب جديد.");
  }

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="الجهات الحكومية"
        title="تقرير جاهزية الامتثال"
        subtitle="تقرير قابل للتصدير مبني على البيانات المعتمدة. ليس تقييمًا رسميًا، والقيم غير المتاحة تظهر «—»."
        actions={
          <>
            <Btn variant="secondary" onClick={downloadCsv}>
              تنزيل CSV
            </Btn>
            <Btn variant="primary" onClick={openPrintable}>
              تقرير للطباعة / PDF
            </Btn>
          </>
        }
      />
      {done && <p className="text-xs text-[var(--color-status-compliant)]">{done}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel>
          <p className="text-xs text-[var(--color-ink-muted)]">مؤشر جاهزية امتثال</p>
          <p className="mt-1 text-3xl font-bold text-[var(--color-ink)] tabular-nums">
            {displayValue(report.readinessIndex)}
          </p>
        </Panel>
        <Panel>
          <p className="text-xs text-[var(--color-ink-muted)]">نسبة التحقق</p>
          <p className="mt-1 text-3xl font-bold text-[var(--color-ink)] tabular-nums">
            {displayValue(report.verificationCoverage)}
          </p>
        </Panel>
      </div>

      <div>
        <SectionTitle hint={`${report.companyNameAr} — ${report.seasonAr}`}>
          المتطلبات
        </SectionTitle>
        <Table head={["المعرّف", "المتطلب", "الجهة", "الانطباق", "حالة التحقق", "الجاهزية", "عائق حرج"]}>
          {report.requirements.map((r) => (
            <tr key={r.requirementId}>
              <Td className="font-mono text-xs text-[var(--color-ink-muted)]">{r.requirementId}</Td>
              <Td className="font-medium text-[var(--color-ink)]">{r.titleAr}</Td>
              <Td className="text-xs text-[var(--color-ink-muted)]">{r.authorityAr}</Td>
              <Td className="text-xs">{r.applicabilityAr}</Td>
              <Td className="text-xs">{r.verificationStatusAr}</Td>
              <Td className="tabular-nums">{displayValue(r.readiness)}</Td>
              <Td>{r.isCriticalBlocker ? <Chip tone="red">عائق حرج</Chip> : "—"}</Td>
            </tr>
          ))}
        </Table>
      </div>

      <p className="text-[11px] text-[var(--color-ink-faint)]">
        تصدير هذه النسخة يعتمد الإمكانات المتاحة في المنصة دون مكتبة إضافية: تنزيل CSV، وتقرير HTML
        جاهز للطباعة (يمكن حفظه PDF من نافذة الطباعة).
      </p>
    </div>
  );
}
