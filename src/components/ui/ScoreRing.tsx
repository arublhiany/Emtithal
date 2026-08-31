function toneForScore(score: number): string {
  if (score >= 85) return "var(--color-status-compliant)";
  if (score >= 60) return "var(--color-status-partial)";
  return "var(--color-status-noncompliant)";
}

export function ScoreRing({
  score,
  size = 128,
  strokeWidth = 12,
  label,
}: {
  /** `null` → renders a neutral "—" (never 0). */
  score: number | null;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const unavailable = score == null;
  const clamped = unavailable ? 0 : Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * circumference;
  const color = unavailable ? "var(--color-border-strong)" : toneForScore(clamped);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-[var(--color-ink)]">
          {unavailable ? "—" : clamped}
        </span>
        {label && (
          <span className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">{label}</span>
        )}
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  toneOverride,
  heightClass = "h-2",
}: {
  value: number;
  toneOverride?: string;
  heightClass?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = toneOverride ?? toneForScore(clamped);
  return (
    <div className={`w-full rounded-full bg-[var(--color-border)] ${heightClass} overflow-hidden`}>
      <div
        className={`${heightClass} rounded-full`}
        style={{ width: `${clamped}%`, background: color, transition: "width 0.5s ease" }}
      />
    </div>
  );
}

export function CompareBar({
  beforeValue,
  afterValue,
  label,
}: {
  beforeValue: number;
  afterValue: number;
  label: string;
}) {
  const delta = afterValue - beforeValue;
  const deltaColor =
    delta > 0
      ? "var(--color-status-compliant)"
      : delta < 0
        ? "var(--color-status-noncompliant)"
        : "var(--color-ink-muted)";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
        <span className="text-xs font-medium tabular-nums" style={{ color: deltaColor }}>
          {delta > 0 ? "+" : ""}
          {delta}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[11px] text-[var(--color-ink-muted)] mb-1">قبل</p>
          <ProgressBar value={beforeValue} toneOverride="var(--color-ink-faint)" />
        </div>
        <div className="text-[var(--color-ink-faint)] text-sm">→</div>
        <div className="flex-1">
          <p className="text-[11px] text-[var(--color-ink-muted)] mb-1">بعد</p>
          <ProgressBar value={afterValue} />
        </div>
      </div>
    </div>
  );
}
