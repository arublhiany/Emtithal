"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { NavIcon } from "@/components/layout/NavIcon";
import { COMPANY_NAV, MINISTRY_NAV } from "@/components/layout/navConfig";
import { useDemoStore } from "@/lib/store/demoStore";

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const resolvedTitle =
    title ??
    navItems.find((n) => pathname === n.href || pathname?.startsWith(n.href + "/"))?.label ??
    "امتثال";

  useEffect(() => {
    if (state.view !== null && state.view !== portal) router.replace("/");
  }, [state.view, portal, router]);

  const unreadAlerts = state.alerts.filter((a) => !a.isRead).length;

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar portal={portal} navItems={navItems} />

      {/* mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="إغلاق القائمة"
            className="absolute inset-0 bg-[var(--brand-ink)]/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 end-0 w-[264px] shadow-xl">
            <Sidebar
              portal={portal}
              navItems={navItems}
              variant="drawer"
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-ink-muted)] md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="فتح القائمة"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-[var(--color-ink)]">{resolvedTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={portal === "company" ? "/company/alerts" : "/ministry/alerts"}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-bg)]"
              aria-label="التنبيهات"
            >
              <NavIcon name="bell" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -start-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-status-noncompliant)] px-1 text-[10px] font-bold text-white">
                  {unreadAlerts}
                </span>
              )}
            </Link>
            <span className="hidden items-center rounded-full bg-[var(--color-primary-tint)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] sm:inline-flex">
              موسم 1447هـ — بيئة عرض
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[var(--content-max)] flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
