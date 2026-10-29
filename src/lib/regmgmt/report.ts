// =============================================================================
// Finalist-ready exportable compliance / readiness report (Phase 10).
//
// This is NOT an "Official Score" report — `officialScoreIncluded` is the
// literal `false` and no company-wide score is ever computed. Missing / null
// values render as "—", never a fabricated 0. No new dependency: the report is
// a plain structured object plus a CSV string and a print-friendly HTML string
// built from the existing stack.
// =============================================================================

export interface ReportRequirementRow {
  requirementId: string;
  titleAr: string;
  authorityAr: string;
  applicabilityAr: string;
  verificationStatusAr: string;
  /** Requirement readiness, or null when not assessable. Rendered as "—" when null. */
  readiness: number | null;
  isCriticalBlocker: boolean;
  officialSourceReferenceAr: string | null;
  officialSourceUrls: string[];
  notesAr: string;
}

export interface ComplianceReport {
  companyNameAr: string;
  seasonAr: string;
  generatedAtIso: string;
  /** "مؤشر جاهزية سبّاق" — 0–100, or null (→ "—"). */
  readinessIndex: number | null;
  /** "نسبة التحقق" — 0–100, or null (→ "—"). */
  verificationCoverage: number | null;
  requirements: ReportRequirementRow[];
  gapsAr: string[];
  criticalBlockerIds: string[];
  unresolvedRequirementIds: string[];
  pendingVerificationIds: string[];
  /** ENFORCED — the report never contains a computed Official Score. */
  officialScoreIncluded: false;
}

/** Display helper: null → "—" (never "0"). */
export function displayValue(n: number | null | undefined): string {
  return n == null ? "—" : String(n);
}

export interface BuildReportInput {
  companyNameAr: string;
  seasonAr: string;
  generatedAtIso: string;
  readinessIndex: number | null;
  verificationCoverage: number | null;
  requirements: ReportRequirementRow[];
  gapsAr: string[];
  criticalBlockerIds: string[];
  unresolvedRequirementIds: string[];
  pendingVerificationIds: string[];
}

export function buildComplianceReport(input: BuildReportInput): ComplianceReport {
  return {
    companyNameAr: input.companyNameAr,
    seasonAr: input.seasonAr,
    generatedAtIso: input.generatedAtIso,
    readinessIndex: input.readinessIndex,
    verificationCoverage: input.verificationCoverage,
    requirements: input.requirements.map((r) => ({ ...r })),
    gapsAr: [...input.gapsAr],
    criticalBlockerIds: [...input.criticalBlockerIds],
    unresolvedRequirementIds: [...input.unresolvedRequirementIds],
    pendingVerificationIds: [...input.pendingVerificationIds],
    officialScoreIncluded: false,
  };
}

// -- CSV export (no dependency) --------------------------------------

function csvCell(s: string): string {
  const needsQuote = /[",\n\r]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export function toReportCsv(report: ComplianceReport): string {
  const lines: string[] = [];
  lines.push(["الشركة", report.companyNameAr].map(csvCell).join(","));
  lines.push(["الموسم", report.seasonAr].map(csvCell).join(","));
  lines.push(["مؤشر جاهزية سبّاق", displayValue(report.readinessIndex)].map(csvCell).join(","));
  lines.push(["نسبة التحقق", displayValue(report.verificationCoverage)].map(csvCell).join(","));
  lines.push("");
  lines.push(
    ["المعرّف", "المتطلب", "الجهة", "الانطباق", "حالة التحقق", "الجاهزية", "عائق حرج", "المصدر الرسمي"]
      .map(csvCell)
      .join(","),
  );
  for (const r of report.requirements) {
    lines.push(
      [
        r.requirementId,
        r.titleAr,
        r.authorityAr,
        r.applicabilityAr,
        r.verificationStatusAr,
        displayValue(r.readiness),
        r.isCriticalBlocker ? "نعم" : "لا",
        r.officialSourceReferenceAr ?? "—",
      ]
        .map(csvCell)
        .join(","),
    );
  }
  lines.push("");
  lines.push(["الفجوات"].map(csvCell).join(","));
  for (const g of report.gapsAr) lines.push([g].map(csvCell).join(","));
  lines.push("");
  lines.push(["عوائق حرجة", report.criticalBlockerIds.join(" ، ") || "—"].map(csvCell).join(","));
  lines.push(
    ["متطلبات غير محسومة", report.unresolvedRequirementIds.join(" ، ") || "—"].map(csvCell).join(","),
  );
  lines.push(
    ["بانتظار التحقق", report.pendingVerificationIds.join(" ، ") || "—"].map(csvCell).join(","),
  );
  // BOM so Arabic opens correctly in spreadsheet apps.
  return "﻿" + lines.join("\r\n");
}

// -- print-friendly HTML (no dependency) ---------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toReportHtml(report: ComplianceReport): string {
  const rows = report.requirements
    .map(
      (r) => `<tr>
      <td>${esc(r.requirementId)}</td>
      <td>${esc(r.titleAr)}</td>
      <td>${esc(r.authorityAr)}</td>
      <td>${esc(r.applicabilityAr)}</td>
      <td>${esc(r.verificationStatusAr)}</td>
      <td class="num">${esc(displayValue(r.readiness))}</td>
      <td>${r.isCriticalBlocker ? "نعم" : "لا"}</td>
      <td>${esc(r.officialSourceReferenceAr ?? "—")}</td>
    </tr>`,
    )
    .join("\n");
  const gaps = report.gapsAr.length
    ? `<ul>${report.gapsAr.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>`
    : "<p>—</p>";
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>تقرير الجاهزية — ${esc(report.companyNameAr)}</title>
<style>
  body{font-family:"Cairo",system-ui,sans-serif;color:#081e0d;margin:32px;background:#fff}
  h1{font-size:20px;margin:0 0 4px} .muted{color:#59605a;font-size:13px;margin:0 0 20px}
  .kpis{display:flex;gap:24px;margin:16px 0 24px}
  .kpi{border:1px solid #dddad5;border-radius:12px;padding:12px 18px;min-width:160px}
  .kpi b{display:block;font-size:24px} .kpi span{font-size:12px;color:#59605a}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #dddad5;padding:6px 8px;text-align:right;vertical-align:top}
  th{background:#e9efec} .num{text-align:center}
  .note{font-size:11px;color:#59605a;margin-top:20px}
</style></head><body>
<h1>تقرير جاهزية الامتثال</h1>
<p class="muted">${esc(report.companyNameAr)} — الموسم ${esc(report.seasonAr)} — أُنشئ ${esc(report.generatedAtIso)}</p>
<div class="kpis">
  <div class="kpi"><b>${esc(displayValue(report.readinessIndex))}</b><span>مؤشر جاهزية سبّاق</span></div>
  <div class="kpi"><b>${esc(displayValue(report.verificationCoverage))}</b><span>نسبة التحقق</span></div>
</div>
<table><thead><tr>
  <th>المعرّف</th><th>المتطلب</th><th>الجهة</th><th>الانطباق</th><th>حالة التحقق</th>
  <th>الجاهزية</th><th>عائق حرج</th><th>المصدر الرسمي</th>
</tr></thead><tbody>
${rows}
</tbody></table>
<h3>الفجوات</h3>${gaps}
<p><b>عوائق حرجة:</b> ${esc(report.criticalBlockerIds.join(" ، ") || "—")}</p>
<p><b>متطلبات غير محسومة:</b> ${esc(report.unresolvedRequirementIds.join(" ، ") || "—")}</p>
<p><b>بانتظار التحقق:</b> ${esc(report.pendingVerificationIds.join(" ، ") || "—")}</p>
<p class="note">هذا التقرير ليس تقييمًا رسميًا ولا يحل محل السلطة التنظيمية، ولا يحتسب أي درجة إجمالية. القيم غير المتاحة تُعرض بـ«—» ولا تُحتسب صفرًا.</p>
</body></html>`;
}
