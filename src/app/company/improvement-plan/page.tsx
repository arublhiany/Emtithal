"use client";

import { useDemoStore } from "@/lib/store/demoStore";
import { PageHeader } from "@/components/ui/Card";
import { ActionStatusBadge } from "@/components/ui/Badge";
import { PRIORITY_LABEL, ACTION_STATUS_LABEL } from "@/lib/labels";
import type { ActionStatus } from "@/lib/types";
import Link from "next/link";

const STATUS_FLOW: ActionStatus[] = ["not_started", "in_progress", "completed"];

const PRIORITY_TONE: Record<string, string> = {
  critical: "text-[var(--color-status-noncompliant)]",
  high: "text-[var(--color-status-partial)]",
  medium: "text-[var(--color-ink-muted)]",
  low: "text-[var(--color-ink-faint)]",
};

export default function ImprovementPlanPage() {
  const { state, setActionStatus } = useDemoStore();
  const actions = [...state.actions].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  const totalExpectedImprovement = state.actions
    .filter((a) => a.status !== "completed")
    .reduce((sum, a) => sum + a.expectedImprovement, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="خطة التحسين"
        title="خطة التحسين والإجراءات التصحيحية"
        descriptionAr={`تنفيذ جميع الإجراءات المفتوحة قد يرفع نسبة الامتثال الإجمالية بما يصل إلى ${totalExpectedImprovement} نقطة تقريبًا.`}
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-right">
                <th className="p-4 font-medium text-[var(--color-ink-muted)]">الإجراء</th>
                <th className="p-4 font-medium text-[var(--color-ink-muted)]">المعيار</th>
                <th className="p-4 font-medium text-[var(--color-ink-muted)]">الأولوية</th>
                <th className="p-4 font-medium text-[var(--color-ink-muted)]">المسؤول</th>
                <th className="p-4 font-medium text-[var(--color-ink-muted)]">الموعد المستهدف</th>
                <th className="p-4 font-medium text-[var(--color-ink-muted)]">الأثر المتوقع</th>
                <th className="p-4 font-medium text-[var(--color-ink-muted)]">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.id} className="border-b border-[var(--color-border)] last:border-0 align-top">
                  <td className="p-4 max-w-xs">
                    <p className="font-medium text-[var(--color-ink)]">{a.titleAr}</p>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                      {a.problemAr}
                    </p>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/company/compliance/${a.requirementId}`}
                      className="text-xs font-mono text-[var(--color-primary)] hover:underline"
                    >
                      {a.requirementId}
                    </Link>
                  </td>
                  <td className={`p-4 text-xs font-semibold ${PRIORITY_TONE[a.priority]}`}>
                    {PRIORITY_LABEL[a.priority]}
                  </td>
                  <td className="p-4 text-xs text-[var(--color-ink-muted)] whitespace-nowrap">
                    {a.responsibleRoleAr}
                  </td>
                  <td className="p-4 text-xs text-[var(--color-ink-muted)] whitespace-nowrap">
                    {a.targetDateLabel}
                  </td>
                  <td className="p-4 text-xs tabular-nums text-[var(--color-status-compliant)] font-semibold whitespace-nowrap">
                    +{a.expectedImprovement} نقطة
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5">
                      <ActionStatusBadge status={a.status} />
                      <select
                        value={a.status}
                        onChange={(e) => setActionStatus(a.id, e.target.value as ActionStatus)}
                        className="text-[11px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-1"
                      >
                        {STATUS_FLOW.map((s) => (
                          <option key={s} value={s}>
                            {ACTION_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
