"use client";

import { useState } from "react";
import { Btn, ErrorNote, Field, TextArea, TextInput } from "@/components/ui/kit";
import type { RequirementVersionInput } from "@/lib/regmgmt";

const AUTHORITIES: { id: string; labelAr: string }[] = [
  { id: "MOHU", labelAr: "وزارة الحج والعمرة" },
  { id: "MOH", labelAr: "وزارة الصحة" },
  { id: "CIVIL_DEFENSE", labelAr: "الدفاع المدني" },
];

export function RequirementForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  requireChangeSummary = true,
}: {
  initial?: Partial<RequirementVersionInput>;
  submitLabel: string;
  onSubmit: (input: RequirementVersionInput) => { ok: true } | { ok: false; errorAr: string };
  onCancel?: () => void;
  requireChangeSummary?: boolean;
}) {
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [authorityId, setAuthorityId] = useState(initial?.authorityId ?? "MOHU");
  const [domainAr, setDomainAr] = useState(initial?.domainAr ?? "تجربة ضيف الرحمن");
  const [trackAr, setTrackAr] = useState(initial?.trackAr ?? "");
  const [season, setSeason] = useState(initial?.season ?? "1447H");
  const [effectiveFrom, setEffectiveFrom] = useState(initial?.effectiveFrom ?? "");
  const [sourceRef, setSourceRef] = useState(initial?.officialSourceReferenceAr ?? "");
  const [sourceUrls, setSourceUrls] = useState((initial?.officialSourceUrls ?? []).join("\n"));
  const [locatorNote, setLocatorNote] = useState(initial?.officialSourceLocatorNoteAr ?? "");
  const [areas, setAreas] = useState((initial?.verificationAreasAr ?? []).join("\n"));
  const [changeSummary, setChangeSummary] = useState(initial?.changeSummaryAr ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    const input: RequirementVersionInput = {
      requirementId: initial?.requirementId,
      titleAr: titleAr.trim(),
      authorityId: authorityId || null,
      domainAr: domainAr.trim(),
      trackAr: trackAr.trim() || null,
      season: season.trim(),
      effectiveFrom: effectiveFrom.trim() || null,
      officialSourceReferenceAr: sourceRef.trim() || null,
      officialSourceUrls: sourceUrls.split(/\n+/).map((s) => s.trim()).filter(Boolean),
      officialSourceLocatorNoteAr: locatorNote.trim() || null,
      verificationAreasAr: areas.split(/\n+/).map((s) => s.trim()).filter(Boolean),
      changeSummaryAr: changeSummary.trim(),
    };
    const res = onSubmit(input);
    if (!res.ok) setError(res.errorAr);
  }

  return (
    <div className="card space-y-4 p-5">
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="عنوان المتطلب">
          <TextInput value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
        </Field>
        <Field label="الجهة المصدرة">
          <select
            value={authorityId}
            onChange={(e) => setAuthorityId(e.target.value)}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
          >
            {AUTHORITIES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.labelAr}
              </option>
            ))}
          </select>
        </Field>
        <Field label="المجال">
          <TextInput value={domainAr} onChange={(e) => setDomainAr(e.target.value)} />
        </Field>
        <Field label="المسار (اختياري)">
          <TextInput value={trackAr} onChange={(e) => setTrackAr(e.target.value)} />
        </Field>
        <Field label="الموسم">
          <TextInput value={season} onChange={(e) => setSeason(e.target.value)} />
        </Field>
        <Field label="تاريخ السريان" hint="مطلوب قبل تفعيل النسخة">
          <TextInput
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            placeholder="مثال: 1447-05-01"
          />
        </Field>
      </div>

      <Field label="المصدر الرسمي (مرجع)">
        <TextInput value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} />
      </Field>
      <Field label="روابط المصدر الرسمي" hint="رابط في كل سطر — يجب أن يبدأ بـ http">
        <TextArea value={sourceUrls} onChange={(e) => setSourceUrls(e.target.value)} />
      </Field>
      <Field label="محدِّد الموقع في المصدر (اختياري)">
        <TextInput value={locatorNote} onChange={(e) => setLocatorNote(e.target.value)} />
      </Field>
      <Field label="مجالات التحقق" hint="مجال في كل سطر">
        <TextArea value={areas} onChange={(e) => setAreas(e.target.value)} />
      </Field>
      <Field label={requireChangeSummary ? "ملخّص التغيير" : "ملاحظة الإصدار"}>
        <TextArea value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} />
      </Field>

      <div className="flex items-center gap-2 pt-1">
        <Btn variant="primary" onClick={submit}>
          {submitLabel}
        </Btn>
        {onCancel && (
          <Btn variant="ghost" onClick={onCancel}>
            إلغاء
          </Btn>
        )}
      </div>
    </div>
  );
}
