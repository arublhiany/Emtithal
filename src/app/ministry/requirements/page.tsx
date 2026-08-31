"use client";

import Link from "next/link";
import { useRegMgmt } from "@/components/regmgmt/RegMgmtProvider";
import { PageHead, Chip, Table, Td, Btn } from "@/components/ui/kit";
import { LIFECYCLE_LABEL_AR, type ReqLifecycleStatus } from "@/lib/regmgmt";
import { AUTHORITY_NAME_AR } from "@/lib/regmgmt/labels";

const STATUS_TONE: Record<ReqLifecycleStatus, "green" | "amber" | "neutral" | "red"> = {
  ACTIVE: "green",
  DRAFT: "amber",
  SUPERSEDED: "neutral",
  DEACTIVATED: "red",
};

export default function RequirementsListPage() {
  const { state } = useRegMgmt();
  const rows = [...state.managed].sort((a, b) => a.requirementId.localeCompare(b.requirementId));
  const drafts = rows.filter((m) => m.draftVersion != null).length;

  return (
    <div>
      <PageHead
        eyebrow="الجهات الحكومية"
        title="إدارة المتطلبات التنظيمية"
        subtitle="دورة حياة كاملة للمتطلب: إنشاء، تحديث، إصدار نسخة، وإلغاء، مع حفظ السجل كاملًا."
        actions={
          <Link href="/ministry/requirements/new">
            <Btn variant="primary">متطلب جديد</Btn>
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-[var(--color-ink-muted)]">إجمالي المتطلبات المُدارة</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-ink)] tabular-nums">{rows.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--color-ink-muted)]">سارية الآن</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-ink)] tabular-nums">
            {rows.filter((m) => m.activeVersion != null).length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--color-ink-muted)]">مسودات مفتوحة</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-ink)] tabular-nums">{drafts}</p>
        </div>
      </div>

      <Table head={["المعرّف", "المتطلب", "الجهة", "النسخة السارية", "الحالة", "المصدر", ""]}>
        {rows.map((m) => {
          const active = m.versions.find((v) => v.version === m.activeVersion) ?? null;
          const draft = m.versions.find((v) => v.version === m.draftVersion) ?? null;
          const shownStatus: ReqLifecycleStatus = active
            ? "ACTIVE"
            : draft
              ? "DRAFT"
              : (m.versions[m.versions.length - 1]?.status ?? "DEACTIVATED");
          const src = active?.officialSourceReferenceAr ?? m.versions[0]?.officialSourceReferenceAr;
          return (
            <tr key={m.requirementId}>
              <Td className="font-mono text-xs text-[var(--color-ink-muted)]">{m.requirementId}</Td>
              <Td className="font-medium text-[var(--color-ink)]">{m.identityTitleAr}</Td>
              <Td className="text-xs text-[var(--color-ink-muted)]">
                {AUTHORITY_NAME_AR[active?.authorityId ?? m.versions[0]?.authorityId ?? ""] ?? "—"}
              </Td>
              <Td className="tabular-nums">{m.activeVersion ?? "—"}</Td>
              <Td>
                <Chip tone={STATUS_TONE[shownStatus]}>{LIFECYCLE_LABEL_AR[shownStatus]}</Chip>
                {draft && shownStatus !== "DRAFT" && (
                  <span className="ms-2">
                    <Chip tone="amber">مسودة النسخة {m.draftVersion}</Chip>
                  </span>
                )}
              </Td>
              <Td className="max-w-[220px] text-xs text-[var(--color-ink-muted)]">
                {src ? <span className="line-clamp-2">{src}</span> : "—"}
              </Td>
              <Td>
                <Link
                  href={`/ministry/requirements/${encodeURIComponent(m.requirementId)}`}
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                >
                  عرض التفاصيل ←
                </Link>
              </Td>
            </tr>
          );
        })}
      </Table>

      <p className="mt-4 text-[11px] text-[var(--color-ink-faint)]">
        النسخة الأساسية (v1) لكل متطلب مأخوذة من المصفوفة التنظيمية المعتمدة ولا تُعدَّل مباشرةً —
        أي تغيير يصدر كنسخة جديدة تحفظ النسخة السابقة في السجل.
      </p>
    </div>
  );
}
