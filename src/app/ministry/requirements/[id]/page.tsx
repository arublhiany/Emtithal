"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRegMgmt } from "@/components/regmgmt/RegMgmtProvider";
import { RequirementForm } from "@/components/regmgmt/RequirementForm";
import {
  PageHead,
  Panel,
  SectionTitle,
  Chip,
  Btn,
  Field,
  TextInput,
  EmptyState,
  AlertBanner,
  BoundaryChip,
} from "@/components/ui/kit";
import {
  AUDIT_ACTION_LABEL_AR,
  IMPACT_STATE_LABEL_AR,
  LIFECYCLE_LABEL_AR,
  REG_CHANGE_TYPE_LABEL_AR,
  auditForRequirement,
  type ImpactAnalysis,
  type ReqLifecycleStatus,
} from "@/lib/regmgmt";
import { APPLICABILITY_AR, AUTHORITY_NAME_AR } from "@/lib/regmgmt/labels";

const STATUS_TONE: Record<ReqLifecycleStatus, "green" | "amber" | "neutral" | "red"> = {
  ACTIVE: "green",
  DRAFT: "amber",
  SUPERSEDED: "neutral",
  DEACTIVATED: "red",
};

export default function RequirementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const { state, issueVersion, activateVersion, deactivate, runImpactAndNotify } = useRegMgmt();

  const managed = state.managed.find((m) => m.requirementId === id) ?? null;
  const audit = useMemo(() => auditForRequirement(state.audit, id), [state.audit, id]);
  const [showForm, setShowForm] = useState(false);
  const [deactivateFrom, setDeactivateFrom] = useState("");
  const [deactivateReason, setDeactivateReason] = useState("");
  const [impact, setImpact] = useState<ImpactAnalysis | null>(null);
  const [notif, setNotif] = useState<string | null>(null);

  if (!managed) {
    return (
      <div>
        <PageHead eyebrow="إدارة المتطلبات" title="المتطلب غير موجود" />
        <EmptyState title="لا يوجد متطلب بهذا المعرّف." hint={id} />
        <Link
          href="/ministry/requirements"
          className="mt-4 inline-block text-sm font-semibold text-[var(--color-primary)]"
        >
          ← العودة للقائمة
        </Link>
      </div>
    );
  }

  const active = managed.versions.find((v) => v.version === managed.activeVersion) ?? null;
  const draft = managed.versions.find((v) => v.version === managed.draftVersion) ?? null;
  const shown = active ?? draft ?? managed.versions[managed.versions.length - 1];
  const shownStatus: ReqLifecycleStatus = shown?.status ?? "DEACTIVATED";
  const notifsForReq = state.notifications.filter((n) => n.requirementId === id);

  function doImpact(changeType: Parameters<typeof runImpactAndNotify>[1]) {
    const ia = runImpactAndNotify(id, changeType);
    setImpact(ia);
    setNotif(
      ia
        ? `تم إنشاء ${ia.impacts.filter((i) => i.state !== "NO_IMPACT").length} إشعارًا للشركات المتأثرة فقط.`
        : "تعذّر تشغيل التحليل.",
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow={`إدارة المتطلبات · ${managed.origin === "CANONICAL_BASELINE" ? "أساس معتمد" : "متطلب حكومي"}`}
        title={managed.identityTitleAr}
        subtitle={`المعرّف ${managed.requirementId} — النسخة السارية ${managed.activeVersion ?? "—"}`}
        actions={
          <>
            {!draft && shownStatus !== "DEACTIVATED" && (
              <Btn variant="secondary" onClick={() => setShowForm((s) => !s)}>
                {showForm ? "إغلاق" : "إصدار نسخة جديدة"}
              </Btn>
            )}
            {draft && (
              <Btn variant="primary" onClick={() => activateVersion(id, draft.version)}>
                تفعيل النسخة {draft.version}
              </Btn>
            )}
          </>
        }
      />

      {draft && (
        <AlertBanner tone="amber" title={`توجد مسودة مفتوحة — النسخة ${draft.version}`}>
          المسودة لا تدخل حساب الامتثال أو الجاهزية. حدّد تاريخ السريان ثم فعّلها لتصبح النسخة السارية،
          وتُستبدل النسخة الحالية مع بقائها في السجل.
        </AlertBanner>
      )}

      {showForm && (
        <div>
          <SectionTitle>إصدار نسخة جديدة</SectionTitle>
          <RequirementForm
            initial={{
              requirementId: id,
              titleAr: shown?.titleAr,
              authorityId: shown?.authorityId ?? null,
              domainAr: shown?.domainAr,
              trackAr: shown?.trackAr ?? "",
              season: shown?.season,
              officialSourceReferenceAr: shown?.officialSourceReferenceAr,
              officialSourceUrls: shown?.officialSourceUrls,
              officialSourceLocatorNoteAr: shown?.officialSourceLocatorNoteAr,
              verificationAreasAr: shown?.verificationAreasAr,
            }}
            submitLabel="إصدار كمسودة"
            onCancel={() => setShowForm(false)}
            onSubmit={(input) => {
              const res = issueVersion(id, input);
              if (res.ok) setShowForm(false);
              return res;
            }}
          />
        </div>
      )}

      {/* current version */}
      <div>
        <SectionTitle
          hint={<Chip tone={STATUS_TONE[shownStatus]}>{LIFECYCLE_LABEL_AR[shownStatus]}</Chip>}
        >
          النسخة {shown?.version} — التفاصيل
        </SectionTitle>
        <Panel className="grid gap-3 sm:grid-cols-2">
          <KV label="الجهة" value={AUTHORITY_NAME_AR[shown?.authorityId ?? ""] ?? "—"} />
          <KV label="المجال / المسار" value={`${shown?.domainAr ?? "—"}${shown?.trackAr ? ` / ${shown.trackAr}` : ""}`} />
          <KV label="الموسم" value={shown?.season ?? "—"} />
          <KV label="سارٍ من" value={shown?.effectiveFrom ?? "—"} />
          <KV label="سارٍ حتى" value={shown?.effectiveUntil ?? "—"} />
          <KV label="المصدر الرسمي" value={shown?.officialSourceReferenceAr ?? "—"} />
          <KV
            label="روابط المصدر"
            value={
              shown?.officialSourceUrls.length ? (
                <span className="flex flex-col gap-1">
                  {shown.officialSourceUrls.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">
                      {u}
                    </a>
                  ))}
                </span>
              ) : (
                "—"
              )
            }
          />
          <KV label="محدِّد الموقع" value={shown?.officialSourceLocatorNoteAr ?? "—"} />
          <KV
            label="مجالات التحقق"
            value={shown?.verificationAreasAr.length ? shown.verificationAreasAr.join("؛ ") : "—"}
          />
          <KV label="ملخّص التغيير" value={shown?.changeSummaryAr ?? "—"} />
        </Panel>
      </div>

      {/* deactivate */}
      {active && (
        <Panel>
          <SectionTitle>إلغاء المتطلب</SectionTitle>
          <p className="mb-3 text-xs text-[var(--color-ink-muted)]">
            الإلغاء لا يحذف السجل — تبقى النسخة قابلة للتتبع تاريخيًا، ويُحدَّد تاريخ نهاية السريان.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44">
              <Field label="سارٍ حتى">
                <TextInput
                  value={deactivateFrom}
                  onChange={(e) => setDeactivateFrom(e.target.value)}
                  placeholder="1447-06-01"
                />
              </Field>
            </div>
            <div className="min-w-52 flex-1">
              <Field label="السبب">
                <TextInput
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                />
              </Field>
            </div>
            <Btn
              variant="danger"
              onClick={() => deactivate(id, deactivateFrom.trim(), deactivateReason.trim())}
            >
              إلغاء المتطلب
            </Btn>
          </div>
        </Panel>
      )}

      {/* version history */}
      <div>
        <SectionTitle hint={`${managed.versions.length} نسخة`}>سجل النسخ</SectionTitle>
        <Panel className="space-y-3">
          {[...managed.versions]
            .sort((a, b) => b.version - a.version)
            .map((v) => (
              <div
                key={v.version}
                className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0"
              >
                <span className="font-mono text-xs text-[var(--color-ink-muted)]">v{v.version}</span>
                <Chip tone={STATUS_TONE[v.status]}>{LIFECYCLE_LABEL_AR[v.status]}</Chip>
                <span className="text-xs text-[var(--color-ink-muted)]">
                  {v.origin === "CANONICAL_BASELINE" ? "أساس معتمد" : `أنشأها ${v.createdByAr}`}
                </span>
                <span className="text-xs text-[var(--color-ink-muted)]">
                  {v.effectiveFrom ? `سارٍ من ${v.effectiveFrom}` : "بلا تاريخ سريان"}
                  {v.effectiveUntil ? ` حتى ${v.effectiveUntil}` : ""}
                </span>
                <span className="w-full text-xs text-[var(--color-ink)]">{v.changeSummaryAr}</span>
              </div>
            ))}
        </Panel>
      </div>

      {/* audit trail */}
      <div>
        <SectionTitle hint={`${audit.length} حدث`}>سجل التدقيق</SectionTitle>
        <Panel>
          {audit.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)]">
              لا توجد إجراءات مُدوَّنة بعد لهذا المتطلب.
            </p>
          ) : (
            <ol className="space-y-3">
              {audit.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 text-xs">
                  <Chip tone="neutral" dot={false}>
                    {AUDIT_ACTION_LABEL_AR[a.action]}
                  </Chip>
                  <span className="text-[var(--color-ink)]">{a.summaryAr}</span>
                  {(a.fromValueAr || a.toValueAr) && (
                    <span className="text-[var(--color-ink-muted)]">
                      {a.fromValueAr ?? "—"} ← {a.toValueAr ?? "—"}
                    </span>
                  )}
                  <span className="text-[var(--color-ink-faint)]">
                    {a.actorAr} · {a.atIso.slice(0, 16).replace("T", " ")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      {/* impact + notifications */}
      <div>
        <SectionTitle hint={<BoundaryChip kind="VERIFICATION" />}>
          تحليل الأثر على الشركات
        </SectionTitle>
        <Panel className="space-y-3">
          <p className="text-xs text-[var(--color-ink-muted)]">
            يُحدَّد نطاق الشركات المتأثرة وفق قواعد الانطباق المعتمدة، ويصل الإشعار إلى الشركات
            المتأثرة فقط. تغيّر المتطلب لا يجعل أي شركة «غير ملتزمة» تلقائيًا.
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["NEW_VERSION", "نسخة جديدة"],
                ["UPCOMING_EFFECTIVE_DATE", "تذكير بتاريخ سريان"],
                ["DEACTIVATED_REQUIREMENT", "أثر الإلغاء"],
              ] as const
            ).map(([ct, label]) => (
              <Btn key={ct} variant="secondary" onClick={() => doImpact(ct)}>
                {label}
              </Btn>
            ))}
          </div>
          {notif && <p className="text-xs text-[var(--color-status-compliant)]">{notif}</p>}
          {impact && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-xs">
                <thead>
                  <tr className="text-right text-[var(--color-ink-muted)]">
                    <th className="py-2">الشركة</th>
                    <th className="py-2">الانطباق</th>
                    <th className="py-2">الحالة الناتجة</th>
                    <th className="py-2">السبب</th>
                  </tr>
                </thead>
                <tbody>
                  {impact.impacts.map((i) => (
                    <tr key={i.companyId} className="border-t border-[var(--color-border)]">
                      <td className="py-2 text-[var(--color-ink)]">{i.companyNameAr}</td>
                      <td className="py-2">{APPLICABILITY_AR[i.applicability] ?? i.applicability}</td>
                      <td className="py-2">
                        <Chip
                          tone={
                            i.state === "NO_IMPACT"
                              ? "neutral"
                              : i.state === "NEW_EVIDENCE_REQUIRED"
                                ? "amber"
                                : "indigo"
                          }
                        >
                          {IMPACT_STATE_LABEL_AR[i.state]}
                        </Chip>
                      </td>
                      <td className="py-2 text-[var(--color-ink-muted)]">{i.reasonAr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* recorded notifications */}
      {notifsForReq.length > 0 && (
        <div>
          <SectionTitle hint={`${notifsForReq.length} إشعار`}>الإشعارات التنظيمية المُنشأة</SectionTitle>
          <Panel className="space-y-3">
            {notifsForReq
              .slice()
              .reverse()
              .map((n) => (
                <div
                  key={n.id}
                  className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] pb-3 text-xs last:border-0 last:pb-0"
                >
                  <Chip tone={n.actionRequired ? "amber" : "neutral"}>
                    {REG_CHANGE_TYPE_LABEL_AR[n.type]}
                  </Chip>
                  <span className="font-medium text-[var(--color-ink)]">{n.titleAr}</span>
                  <span className="w-full text-[var(--color-ink-muted)]">{n.bodyAr}</span>
                  <span className="text-[var(--color-ink-faint)]">
                    للشركة {n.companyId} · هدف: {n.targetHref}
                  </span>
                </div>
              ))}
          </Panel>
        </div>
      )}

      <Link
        href="/ministry/requirements"
        className="inline-block text-sm font-semibold text-[var(--color-primary)]"
      >
        ← العودة للقائمة
      </Link>
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[var(--color-ink-faint)]">{label}</p>
      <div className="mt-0.5 text-sm text-[var(--color-ink)]">{value || "—"}</div>
    </div>
  );
}
