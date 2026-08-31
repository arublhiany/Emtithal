"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemoStore } from "@/lib/store/demoStore";
import { Logo } from "@/components/ui/Logo";
import {
  AI_DISCLAIMER_AR,
  COMPANY_CTA_AR,
  COMPANY_ENTRY_ROLE,
  GOVERNMENT_CTA_AR,
  LANDING_FOOTER_AR,
  LANDING_HEADLINE_AR,
  LANDING_SUPPORTING_AR,
  LANGUAGE_CONTROL,
} from "@/lib/ui/landing";

// The approved landing is intentionally minimal: logo · language control ·
// headline · short supporting text · subtle AI-disclaimer pill · government
// login · company login · minimal footer. No self-registration, no feature
// grids, no statistics, no marketing.
export default function LandingPage() {
  const router = useRouter();
  const { setSession } = useDemoStore();
  const [lang, setLang] = useState<"ar" | "en">("ar");

  function enterGovernment() {
    setSession("ministry", null);
    router.push("/ministry/control-center");
  }
  function enterCompany() {
    setSession("company", COMPANY_ENTRY_ROLE);
    router.push("/company/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto flex w-full max-w-[var(--content-max)] items-center justify-between px-6 py-4">
          <Logo height={40} priority />
          <button
            type="button"
            onClick={() => setLang((l) => (l === "ar" ? "en" : "ar"))}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
            aria-label="تبديل اللغة"
          >
            <GlobeIcon />
            {lang === "ar" ? LANGUAGE_CONTROL.enLabel : LANGUAGE_CONTROL.arLabel}
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-xl text-center">
          <h1 className="text-3xl font-bold leading-[1.35] text-[var(--color-ink)] sm:text-[2.1rem]">
            {LANDING_HEADLINE_AR}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
            {LANDING_SUPPORTING_AR}
          </p>

          <p className="mx-auto mt-6 inline-block rounded-full bg-[var(--color-primary-tint)] px-4 py-2 text-xs leading-relaxed text-[var(--color-primary)]">
            {AI_DISCLAIMER_AR}
          </p>

          <div className="mx-auto mt-10 flex max-w-sm flex-col gap-3">
            <button
              type="button"
              onClick={enterGovernment}
              className="rounded-[var(--radius-control)] bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              {GOVERNMENT_CTA_AR}
            </button>
            <button
              type="button"
              onClick={enterCompany}
              className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-bg)]"
            >
              {COMPANY_CTA_AR}
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex w-full max-w-[var(--content-max)] flex-wrap items-center justify-between gap-2 px-6 py-5">
          <p className="text-[11px] text-[var(--color-ink-faint)]">
            امتثال لا يحل محل السلطة التنظيمية ولا يضمن نتائج التفتيش.
          </p>
          <p className="text-[11px] text-[var(--color-ink-faint)]">{LANDING_FOOTER_AR}</p>
        </div>
      </footer>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9S14.5 18.5 12 21c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
