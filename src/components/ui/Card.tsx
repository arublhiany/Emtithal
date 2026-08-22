import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padding = "p-5",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return <div className={`card ${padding} ${className}`}>{children}</div>;
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h2>
        {subtitle && (
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon = "📋",
  title,
  descriptionAr,
}: {
  icon?: string;
  title: string;
  descriptionAr?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="text-3xl mb-3">{icon}</div>
      <p className="font-medium text-[var(--color-ink)]">{title}</p>
      {descriptionAr && (
        <p className="text-sm text-[var(--color-ink-muted)] mt-1 max-w-sm">{descriptionAr}</p>
      )}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  descriptionAr,
  action,
}: {
  eyebrow?: string;
  title: string;
  descriptionAr?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium tracking-wide text-[var(--color-accent-dark)] mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">{title}</h1>
        {descriptionAr && (
          <p className="text-sm text-[var(--color-ink-muted)] mt-1.5 max-w-2xl leading-relaxed">
            {descriptionAr}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
