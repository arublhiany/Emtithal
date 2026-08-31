"use client";

import type { ReactNode } from "react";
import { PageHead, SectionTitle } from "@/components/ui/kit";

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

/** Kept for source compatibility — delegates to the unified kit primitives. */
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
    <div className="mb-4">
      <SectionTitle hint={subtitle}>{title}</SectionTitle>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  descriptionAr,
}: {
  icon?: ReactNode;
  title: string;
  descriptionAr?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && <div className="mb-3 text-[var(--color-ink-faint)]">{icon}</div>}
      <p className="font-medium text-[var(--color-ink)]">{title}</p>
      {descriptionAr && (
        <p className="mt-1 max-w-sm text-sm text-[var(--color-ink-muted)]">{descriptionAr}</p>
      )}
    </div>
  );
}

/** Kept for source compatibility — delegates to the unified kit `PageHead`. */
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
  return <PageHead eyebrow={eyebrow} title={title} subtitle={descriptionAr} actions={action} />;
}
