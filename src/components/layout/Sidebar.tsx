"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/components/layout/navConfig";
import { NavIcon } from "@/components/layout/NavIcon";
import { Logo } from "@/components/ui/Logo";
import { useDemoStore } from "@/lib/store/demoStore";
import { getCompanyProfile } from "@/lib/data/company";
import { COMPANY_ROLE_LABEL } from "@/lib/labels";

export function Sidebar({
  portal,
  navItems,
  variant = "static",
  onNavigate,
}: {
  portal: "company" | "ministry";
  navItems: NavItem[];
  variant?: "static" | "drawer";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { state, logout } = useDemoStore();
  const profile = getCompanyProfile();

  const entityLabel = portal === "company" ? profile.nameAr : "الجهة الحكومية";
  const subLabel =
    portal === "company"
      ? state.companyRole
        ? COMPANY_ROLE_LABEL[state.companyRole]
        : "ممثل الشركة"
      : "مركز التحكم الرقابي";

  const shell =
    variant === "drawer"
      ? "flex w-[264px] flex-col bg-[var(--color-surface)] h-full"
      : "hidden md:flex w-[var(--sidebar-w)] shrink-0 flex-col border-e border-[var(--color-border)] bg-[var(--color-surface)] h-screen sticky top-0";

  return (
    <aside className={shell}>
      <div className="border-b border-[var(--color-border)] px-5 pb-5 pt-6">
        <Link href="/" className="inline-flex" onClick={onNavigate}>
          <Logo height={30} />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--color-primary-tint)] text-[var(--color-primary)]"
                  : "text-[var(--color-ink-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
              }`}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] px-3 pb-4 pt-3">
        <div className="flex items-center gap-2.5 rounded-[var(--radius-control)] bg-[var(--color-bg)] px-2.5 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
            {portal === "company" ? "ش" : "ج"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[var(--color-ink)]">{entityLabel}</p>
            <p className="truncate text-[11px] text-[var(--color-ink-muted)]">{subLabel}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="mt-2 w-full py-1.5 text-center text-xs text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
        >
          تبديل الجهة / تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
