import type { Risk } from "@/lib/types";
import { RISK_TONE } from "@/lib/labels";

const IMPACT_ROWS: Risk["impact"][] = ["critical", "high", "medium", "low"];
const PROB_COLS: Risk["probability"][] = ["low", "medium", "high"];

const IMPACT_LABEL: Record<Risk["impact"], string> = {
  critical: "حرج",
  high: "مرتفع",
  medium: "متوسط",
  low: "منخفض",
  none: "لا يوجد",
};
const PROB_LABEL: Record<Risk["probability"], string> = {
  high: "مرتفع",
  medium: "متوسط",
  low: "منخفض",
};

export function RiskMatrix({ risks }: { risks: Risk[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs min-w-[420px]">
        <thead>
          <tr>
            <th className="p-2"></th>
            {PROB_COLS.map((p) => (
              <th key={p} className="p-2 text-center font-medium text-[var(--color-ink-muted)]">
                احتمالية {PROB_LABEL[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {IMPACT_ROWS.map((impact) => (
            <tr key={impact}>
              <th className="p-2 text-right font-medium text-[var(--color-ink-muted)] whitespace-nowrap">
                أثر {IMPACT_LABEL[impact]}
              </th>
              {PROB_COLS.map((prob) => {
                const cellRisks = risks.filter(
                  (r) => r.impact === impact && r.probability === prob
                );
                return (
                  <td key={prob} className="p-1.5">
                    <div className="min-h-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2 flex flex-col gap-1 items-center justify-center">
                      {cellRisks.map((r) => {
                        const tone = RISK_TONE[r.level];
                        return (
                          <span
                            key={r.id}
                            title={r.titleAr}
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap max-w-full truncate"
                            style={{ color: tone.fg, background: tone.bg }}
                          >
                            {r.requirementId}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
