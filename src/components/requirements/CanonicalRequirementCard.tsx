import Link from "next/link";
import type { CanonicalRequirementView } from "@/lib/hooks/useCompanyCompliance";
import { Chip } from "@/components/ui/kit";
import { ProgressBar } from "@/components/ui/viz";
import {
  APPLICABILITY_LABEL_AR,
  OFFICIAL_WEIGHT_LABEL_AR,
  STATUS_LABEL_AR,
  STATUS_TONE,
  UNRESOLVED_REQUIREMENT_AR,
  officialWeightText,
  show,
} from "@/lib/ui/status";

/**
 * One canonical requirement, any authority. Canonical ID is primary; status /
 * readiness / applicability are the deterministic engine result; the official
 * weight is shown only where the matrix publishes one.
 */
export function CanonicalRequirementCard({ r }: { r: CanonicalRequirementView }) {
  const assessable = r.applicability === "APPLICABLE" && r.readiness != null;
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-[11px] text-[var(--color-ink-faint)]">{r.id}</p>
          <h3 className="text-sm font-semibold leading-snug text-[var(--color-ink)]">
            {r.titleAr}
          </h3>
        </div>
        <span className="shrink-0 text-2xl font-bold tabular-nums text-[var(--color-ink)]">
          {assessable ? show(r.readiness) : "—"}
        </span>
      </div>

      <ProgressBar value={assessable ? r.readiness : null} tone={STATUS_TONE[r.status]} />

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone={STATUS_TONE[r.status]}>{STATUS_LABEL_AR[r.status]}</Chip>
        {r.applicability !== "APPLICABLE" && (
          <Chip tone="neutral" dot={false}>
            {APPLICABILITY_LABEL_AR[r.applicability]}
          </Chip>
        )}
        {r.isUnresolvedRegulatory && (
          <Chip tone="amber" dot={false}>
            {UNRESOLVED_REQUIREMENT_AR}
          </Chip>
        )}
        {r.isCriticalBlocker && <Chip tone="red">عائق حرج</Chip>}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2 text-[11px] text-[var(--color-ink-faint)]">
        <span>
          {OFFICIAL_WEIGHT_LABEL_AR}: {officialWeightText(r.officialWeightPercent)}
        </span>
        {r.hasDetail && <span className="text-[var(--color-primary)]">التفاصيل ←</span>}
      </div>
    </>
  );

  const cls = "card flex flex-col gap-3 p-5";
  return r.hasDetail ? (
    <Link
      href={`/company/compliance/${encodeURIComponent(r.id)}`}
      className={`${cls} transition-all hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card-hover)]`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
