"use client";

import Link from "next/link";
import { useDemoStore } from "@/lib/store/demoStore";
import { PageHead, Panel, Table, Td, Chip } from "@/components/ui/kit";
import { ActionStatusBadge, DemoConfigBadge } from "@/components/ui/Badge";
import { PRIORITY_LABEL, ACTION_STATUS_LABEL } from "@/lib/labels";
import { displayRequirementId } from "@/lib/data/regulatory";
import { READINESS_INDEX_AR } from "@/lib/ui/status";
import type { ActionStatus } from "@/lib/types";

const STATUS_FLOW: ActionStatus[] = ["not_started", "in_progress", "completed"];

const PRIORITY_TONE: Record<string, "red" | "amber" | "neutral"> = {
  critical: "red",
  high: "amber",
  medium: "neutral",
  low: "neutral",
};

export default function ImprovementPlanPage() {
  const { state, setActionStatus } = useDemoStore();
  const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  const actions = [...state.actions].sort((a, b) => order[a.priority] - order[b.priority]);
  const open = actions.filter((a) => a.status !== "completed");
  const expectedGain = open.reduce((sum, a) => sum + a.expectedImprovement, 0);

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="خطة التحسين"
        title="خطة التحسين والإجراءات التصحيحية"
        subtitle="إجراءات مقترحة لمعالجة الفجوات، مرتبطة بمتطلباتها. الأثر المتوقع تقدير إرشادي فقط."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel>
          <p className="text-xs text-[var(--color-ink-muted)]">إجراءات مفتوحة</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-ink)]">{open.length}</p>
        </Panel>
        <Panel>
          <p className="text-xs text-[var(--color-ink-muted)]">إجمالي الإجراءات</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-ink)]">
            {actions.length}
          </p>
        </Panel>
        <Panel>
          <p className="text-xs text-[var(--color-ink-muted)]">
            أثر تقديري على {READINESS_INDEX_AR}
          </p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold tabular-nums text-[var(--color-ink)]">
            +{expectedGain}
            <span className="text-xs font-normal text-[var(--color-ink-faint)]">نقطة تقريبًا</span>
          </p>
          <div className="mt-1">
            <DemoConfigBadge />
          </div>
        </Panel>
      </div>

      <Table
        head={[
          "الإجراء",
          "المتطلب",
          "الأولوية",
          "المسؤول",
          "الموعد المستهدف",
          "أثر تقديري",
          "الحالة",
        ]}
      >
        {actions.map((a) => (
          <tr key={a.id}>
            <Td className="max-w-xs">
              <p className="font-medium text-[var(--color-ink)]">{a.titleAr}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                {a.problemAr}
              </p>
            </Td>
            <Td>
              <Link
                href={`/company/compliance/${displayRequirementId(a.requirementId)}`}
                className="font-mono text-xs text-[var(--color-primary)] hover:underline"
              >
                {displayRequirementId(a.requirementId)}
              </Link>
            </Td>
            <Td>
              <Chip tone={PRIORITY_TONE[a.priority]} dot={false}>
                {PRIORITY_LABEL[a.priority]}
              </Chip>
            </Td>
            <Td className="whitespace-nowrap text-xs text-[var(--color-ink-muted)]">
              {a.responsibleRoleAr}
            </Td>
            <Td className="whitespace-nowrap text-xs text-[var(--color-ink-muted)]">
              {a.targetDateLabel}
            </Td>
            <Td className="whitespace-nowrap text-xs font-semibold tabular-nums text-[var(--color-status-compliant)]">
              +{a.expectedImprovement} نقطة
            </Td>
            <Td>
              <div className="flex flex-col gap-1.5">
                <ActionStatusBadge status={a.status} />
                <select
                  value={a.status}
                  onChange={(e) => setActionStatus(a.id, e.target.value as ActionStatus)}
                  aria-label="تغيير حالة الإجراء"
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-1 text-[11px]"
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {ACTION_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </Td>
          </tr>
        ))}
      </Table>

      <p className="text-xs text-[var(--color-ink-muted)]">
        «أثر تقديري» رقم إرشادي فقط، ولا يمثّل إعادة حساب فعلية للمؤشر.
      </p>
    </div>
  );
}
