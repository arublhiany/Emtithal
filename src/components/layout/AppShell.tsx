"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { COMPANY_NAV, MINISTRY_NAV } from "@/components/layout/navConfig";
import { useDemoStore } from "@/lib/store/demoStore";
import Link from "next/link";

export function AppShell({
  portal,
  title,
  children,
}: {
  portal: "company" | "ministry";
  title?: string;
  children: ReactNode;
}) {
  const { state } = useDemoStore();
  const router = useRouter();
  const pathname = usePathname();
  const navItems = portal === "company" ? COMPANY_NAV : MINISTRY_NAV;
  const resolvedTitle =
    title ??
    navItems.find((n) => pathname === n.href || pathname?.startsWith(n.href + "/"))?.label ??
    "امتثال";

  useEffect(() => {
    if (state.view !== null && state.view !== portal) {
      router.replace("/");
    }
  }, [state.view, portal, router]);

  const unreadAlerts = state.alerts.filter((a) => !a.isRead).length;

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar portal={portal} navItems={navItems} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur px-6 py-4">
          <h1 className="text-base font-semibold text-[var(--color-ink)]">{resolvedTitle}</h1>
          <div className="flex items-center gap-3">
            <Link
              href={portal === "company" ? "/company/alerts" : "/ministry/alerts"}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm hover:bg-[var(--color-bg)] transition-colors"
              aria-label="التنبيهات"
            >
              🔔
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-status-noncompliant)] px-1 text-[10px] font-bold text-white">
                  {unreadAlerts}
                </span>
              )}
            </Link>
            <span className="hidden sm:inline-flex items-center rounded-full bg-[var(--color-primary-tint)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary)]">
              موسم 1447هـ — بيئة عرض تجريبي
            </span>
          </div>
        </header>
        <main className="flex-1 px-6 py-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
