"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/components/layout/navConfig";
import { useDemoStore } from "@/lib/store/demoStore";
import { getCompanyProfile } from "@/lib/data/company";
import { COMPANY_ROLE_LABEL } from "@/lib/labels";

export function Sidebar({
  portal,
  navItems,
}: {
  portal: "company" | "ministry";
  navItems: NavItem[];
}) {
  const pathname = usePathname();
  const { state, logout } = useDemoStore();
  const profile = getCompanyProfile();

  const entityLabel =
    portal === "company" ? profile.nameAr : "وزارة الحج والعمرة";
  const subLabel =
    portal === "company"
      ? state.companyRole
        ? COMPANY_ROLE_LABEL[state.companyRole]
        : "بيئة تجريبية"
      : "مركز التحكم الرقابي";

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] h-screen sticky top-0">
      <div className="px-5 pt-6 pb-5 border-b border-[var(--color-border)]">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-accent-tint)] font-bold text-sm">
            ام
          </span>
          <span>
            <span className="block text-base font-bold text-[var(--color-ink)] leading-tight">
              امتثال
            </span>
            <span className="block text-[11px] text-[var(--color-ink-muted)] leading-tight">
              Emtithal
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--color-primary-tint)] text-[var(--color-primary)]"
                  : "text-[var(--color-ink-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
              }`}
            >
              <span className="text-base" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 bg-[var(--color-bg)]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">
            {portal === "company" ? "ش" : "و"}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--color-ink)] truncate">
              {entityLabel}
            </p>
            <p className="text-[11px] text-[var(--color-ink-muted)] truncate">{subLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-2 w-full text-center text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] py-1.5 transition-colors"
        >
          تبديل الجهة / تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
