"use client";

// =============================================================================
// Shared visual primitives (Phase 11) — brand palette + Cairo, RTL, no emoji.
// Kept minimal and flat to match the approved Figma direction (no gridlines,
// low elevation, brand-toned bars).
// =============================================================================

import type { ReactNode } from "react";
import { NavIcon } from "@/components/layout/NavIcon";
import { show, type ChipTone } from "@/lib/ui/status";

const TONE_FG: Record<ChipTone, string> = {
  green: "var(--color-status-compliant)",
  amber: "var(--color-status-partial)",
  red: "var(--color-status-noncompliant)",
  indigo: "var(--color-status-review)",
  neutral: "var(--color-ink-muted)",
};
const TONE_BG: Record<ChipTone, string> = {
  green: "var(--color-status-compliant-bg)",
  amber: "var(--color-status-partial-bg)",
  red: "var(--color-status-noncompliant-bg)",
  indigo: "var(--color-status-review-bg)",
  neutral: "var(--color-status-notassessed-bg)",
};

// -- KPI tile (the Figma KPI grid cell) --------------------------------

export function KpiTile({
  label,
  value,
  suffix,
  icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  icon?: string;
  tone?: ChipTone;
  hint?: ReactNode;
}) {
  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-ink-muted)]">{label}</span>
        {icon && (
          <span className="text-[var(--color-ink-faint)]" aria-hidden>
            <NavIcon name={icon} />
          </span>
        )}
      </div>
      <div className="flex items-end gap-1.5">
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color: tone === "neutral" ? "var(--color-ink)" : TONE_FG[tone] }}
        >
          {value}
        </span>
        {suffix && <span className="mb-1 text-xs text-[var(--color-ink-muted)]">{suffix}</span>}
      </div>
      {hint && <span className="text-[11px] text-[var(--color-ink-faint)]">{hint}</span>}
    </div>
  );
}

// -- readiness donut / gauge -----------------------------------------

export function Donut({
  value,
  outOf = 100,
  size = 128,
  stroke = 12,
  captionAr,
}: {
  value: number | null;
  outOf?: number;
  size?: number;
  stroke?: number;
  captionAr?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const unavailable = value == null;
  const pct = unavailable ? 0 : Math.max(0, Math.min(1, value / outOf));
  const dash = pct * c;
  const arc = unavailable
    ? "var(--color-border-strong)"
    : pct >= 0.85
      ? "var(--color-status-compliant)"
      : pct >= 0.6
        ? "var(--color-accent)"
        : "var(--color-status-noncompliant)";
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={arc}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-[var(--color-ink)]">
          {show(value)}
        </span>
        <span className="text-[11px] text-[var(--color-ink-muted)]">من {outOf}</span>
      </div>
      {captionAr && (
        <span className="sr-only">
          {captionAr}: {show(value)} من {outOf}
        </span>
      )}
    </div>
  );
}

// -- requirement / criterion progress bar ---------------------------

export function ProgressBar({
  value,
  tone,
  className = "",
}: {
  /** 0-100, or null → an empty track. */
  value: number | null;
  tone?: ChipTone;
  className?: string;
}) {
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  const color = tone
    ? TONE_FG[tone]
    : v >= 85
      ? "var(--color-status-compliant)"
      : v >= 60
        ? "var(--color-accent)"
        : "var(--color-status-noncompliant)";
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)] ${className}`}>
      <div
        className="h-2 rounded-full"
        style={{ width: `${v}%`, background: color, transition: "width .5s ease" }}
      />
    </div>
  );
}

// -- horizontal category bar chart ---------------------------------

export function BarChartH({
  rows,
  linkHref,
  linkLabel,
}: {
  rows: { labelAr: string; value: number; tone: ChipTone }[];
  linkHref?: string;
  linkLabel?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.labelAr} className="flex items-center gap-3">
          <span
            className="w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-medium"
            style={{ color: TONE_FG[r.tone], background: TONE_BG[r.tone] }}
          >
            {r.labelAr}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]">
            <div
              className="h-2 rounded-full"
              style={{ width: `${(r.value / max) * 100}%`, background: TONE_FG[r.tone] }}
            />
          </div>
          <span className="w-6 shrink-0 text-left text-xs tabular-nums text-[var(--color-ink-muted)]">
            {r.value}
          </span>
        </div>
      ))}
      {linkHref && linkLabel && (
        <a href={linkHref} className="inline-block pt-1 text-xs font-semibold text-[var(--color-primary)] hover:underline">
          {linkLabel} ←
        </a>
      )}
    </div>
  );
}
