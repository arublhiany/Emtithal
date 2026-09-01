"use client";

// =============================================================================
// Shared UI kit (Phase 10) — reusable primitives on the authoritative brand
// tokens + Cairo. RTL-first. Same function = same component.
// =============================================================================

import type { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

// -- page / section headers ------------------------------------------

export function PageHead({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-medium text-[var(--color-ink-faint)]">{eyebrow}</p>
        )}
        <h1 className="text-xl font-bold leading-snug text-[var(--color-ink)] sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-[var(--color-ink)]">{children}</h2>
      {hint && <span className="text-xs text-[var(--color-ink-muted)]">{hint}</span>}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

// -- chips ---------------------------------------------------------

type Tone = "green" | "amber" | "red" | "neutral" | "indigo";

const TONE: Record<Tone, { fg: string; bg: string }> = {
  green: { fg: "var(--color-status-compliant)", bg: "var(--color-status-compliant-bg)" },
  amber: { fg: "var(--color-status-partial)", bg: "var(--color-status-partial-bg)" },
  red: { fg: "var(--color-status-noncompliant)", bg: "var(--color-status-noncompliant-bg)" },
  indigo: { fg: "var(--color-status-review)", bg: "var(--color-status-review-bg)" },
  neutral: { fg: "var(--color-status-notassessed)", bg: "var(--color-status-notassessed-bg)" },
};

export function Chip({
  children,
  tone = "neutral",
  dot = true,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  const t = TONE[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ color: t.fg, background: t.bg }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.fg }} />}
      {children}
    </span>
  );
}

/** Trust-boundary chip — deliberately distinct from a regulatory status chip. */
export function BoundaryChip({ kind }: { kind: "REGULATION" | "VERIFICATION" | "AI" | "RESEARCH" }) {
  const map = {
    REGULATION: { label: "تنظيمي", tone: "neutral" as Tone },
    VERIFICATION: { label: "نتيجة تحقق", tone: "indigo" as Tone },
    AI: { label: "تحليل بالذكاء الاصطناعي", tone: "amber" as Tone },
    RESEARCH: { label: "دعم بحثي", tone: "green" as Tone },
  };
  const m = map[kind];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium"
      style={{ color: TONE[m.tone].fg, borderColor: TONE[m.tone].fg, background: "transparent" }}
    >
      {m.label}
    </span>
  );
}

// -- buttons -----------------------------------------------------

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Btn({ variant = "secondary", className = "", ...rest }: BtnProps) {
  const styles: Record<NonNullable<BtnProps["variant"]>, string> = {
    primary:
      "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-[var(--shadow-card)]",
    secondary:
      "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-bg)]",
    ghost: "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-bg)]",
    danger:
      "border border-[var(--color-status-noncompliant)] text-[var(--color-status-noncompliant)] hover:bg-[var(--color-status-noncompliant-bg)]",
  };
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    />
  );
}

// -- form fields ----------------------------------------------

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-ink)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-[var(--color-ink-faint)]">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)]";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-24 ${props.className ?? ""}`} />;
}

// -- states ------------------------------------------------

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 p-10 text-center">
      <p className="text-sm font-medium text-[var(--color-ink)]">{title}</p>
      {hint && <p className="max-w-sm text-xs text-[var(--color-ink-muted)]">{hint}</p>}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[var(--radius-control)] border border-[var(--color-status-noncompliant)] bg-[var(--color-status-noncompliant-bg)] px-3 py-2 text-xs text-[var(--color-status-noncompliant)]">
      {children}
    </p>
  );
}

export function AlertBanner({
  tone = "amber",
  title,
  children,
}: {
  tone?: "amber" | "red" | "green";
  title: string;
  children?: ReactNode;
}) {
  const map = {
    amber: { fg: "var(--color-status-partial)", bg: "var(--color-status-partial-bg)" },
    red: { fg: "var(--color-status-noncompliant)", bg: "var(--color-status-noncompliant-bg)" },
    green: { fg: "var(--color-status-compliant)", bg: "var(--color-status-compliant-bg)" },
  }[tone];
  return (
    <div className="rounded-[var(--radius-card)] px-4 py-3" style={{ background: map.bg }}>
      <p className="text-sm font-semibold" style={{ color: map.fg }}>
        {title}
      </p>
      {children && (
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">{children}</p>
      )}
    </div>
  );
}

// -- data table shell --------------------------------------

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-primary-tint)]/40">
            {head.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-ink-muted)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td className={`border-b border-[var(--color-border)] px-3 py-2.5 align-top ${className}`}>
      {children}
    </td>
  );
}
