// =============================================================================
// Phase 10 tests — exportable compliance/readiness report (NOT an Official Score).
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildComplianceReport,
  toReportCsv,
  toReportHtml,
  displayValue,
  type ReportRequirementRow,
} from "@/lib/regmgmt";

const rows: ReportRequirementRow[] = [
  {
    requirementId: "HAJ-EXP-05",
    titleAr: "توثيق فعاليات ومبادرات فريق السعادة",
    authorityAr: "وزارة الحج والعمرة",
    applicabilityAr: "منطبق",
    verificationStatusAr: "بانتظار التحقق",
    readiness: null, // not assessable
    isCriticalBlocker: false,
    officialSourceReferenceAr: "وثيقة رسمية",
    officialSourceUrls: ["https://uqu.edu.sa/x"],
    notesAr: "",
  },
  {
    requirementId: "HAJ-EXP-01",
    titleAr: "معيار تجريبي",
    authorityAr: "وزارة الحج والعمرة",
    applicabilityAr: "منطبق",
    verificationStatusAr: "ملتزم جزئيًا",
    readiness: 62,
    isCriticalBlocker: true,
    officialSourceReferenceAr: null,
    officialSourceUrls: [],
    notesAr: "",
  },
];

const base = () =>
  buildComplianceReport({
    companyNameAr: "شركة النور لخدمات الحج (تجريبي)",
    seasonAr: "1447H",
    generatedAtIso: "2026-09-05T00:00:00.000Z",
    readinessIndex: null,
    verificationCoverage: 40,
    requirements: rows,
    gapsAr: ["فجوة تجريبية"],
    criticalBlockerIds: ["HAJ-EXP-01"],
    unresolvedRequirementIds: [],
    pendingVerificationIds: ["HAJ-EXP-05"],
  });

test("displayValue: null/undefined → '—', never '0'", () => {
  assert.equal(displayValue(null), "—");
  assert.equal(displayValue(undefined), "—");
  assert.equal(displayValue(0), "0");
  assert.equal(displayValue(71), "71");
});

test("the report never includes a computed Official Score", () => {
  const r = base();
  assert.equal(r.officialScoreIncluded, false);
  const csv = toReportCsv(r);
  const html = toReportHtml(r);
  assert.equal(/official\s*score/i.test(csv), false);
  assert.equal(/official\s*score/i.test(html), false);
  assert.equal(/الدرجة الرسمية/.test(csv), false);
  // the canonical Arabic terms ARE used
  assert.match(csv, /مؤشر جاهزية امتثال/);
  assert.match(csv, /نسبة التحقق/);
  assert.match(html, /مؤشر جاهزية امتثال/);
});

test("null readiness is exported as '—', never a fabricated zero", () => {
  const r = base();
  const csv = toReportCsv(r);
  const html = toReportHtml(r);
  // the readiness-index KPI is null → shows '—'
  assert.match(csv, /مؤشر جاهزية امتثال,—/);
  assert.match(html, /<b>—<\/b><span>مؤشر جاهزية امتثال<\/span>/);
  // the not-assessable requirement row shows '—' for its readiness, the other shows 62
  const line = csv.split("\r\n").find((l) => l.startsWith("HAJ-EXP-05"))!;
  assert.match(line, /,—,/);
  const line2 = csv.split("\r\n").find((l) => l.startsWith("HAJ-EXP-01"))!;
  assert.match(line2, /,62,/);
  // no accidental ",0," injected for missing values
  assert.equal(csv.includes("مؤشر جاهزية امتثال,0"), false);
});

test("the report echoes only supplied canonical values — nothing fabricated", () => {
  const r = base();
  assert.equal(r.requirements.length, 2);
  assert.deepEqual(r.criticalBlockerIds, ["HAJ-EXP-01"]);
  assert.deepEqual(r.pendingVerificationIds, ["HAJ-EXP-05"]);
  assert.equal(r.readinessIndex, null);
  assert.equal(r.verificationCoverage, 40);
  // a caller-mutated array does not leak back into the report
  r.criticalBlockerIds.push("HACK");
  assert.deepEqual(base().criticalBlockerIds, ["HAJ-EXP-01"]);
});

test("CSV opens Arabic correctly (UTF-8 BOM) and quotes cells with commas/quotes", () => {
  const r = buildComplianceReport({
    companyNameAr: 'شركة "الاختبار", للحج',
    seasonAr: "1447H",
    generatedAtIso: "2026-09-05T00:00:00.000Z",
    readinessIndex: 55,
    verificationCoverage: null,
    requirements: [],
    gapsAr: [],
    criticalBlockerIds: [],
    unresolvedRequirementIds: [],
    pendingVerificationIds: [],
  });
  const csv = toReportCsv(r);
  assert.ok(csv.startsWith("﻿"));
  assert.match(csv, /"شركة ""الاختبار"", للحج"/);
  assert.match(csv, /نسبة التحقق,—/);
});
