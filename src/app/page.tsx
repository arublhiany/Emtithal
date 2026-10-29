"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemoStore } from "@/lib/store/demoStore";
import { Logo } from "@/components/ui/Logo";
import {
  AI_INTELLIGENCE_LINE_AR,
  COMPANY_CTA_AR,
  COMPANY_ENTRY_ROLE,
  GOVERNMENT_CTA_AR,
  LANDING_FOOTER_AR,
  LANDING_HEADLINE_AR,
  LANDING_SUPPORTING_AR,
  LANGUAGE_CONTROL,
} from "@/lib/ui/landing";

// Public landing — the approved reference: a calm, centred hero over a faint
// circuit motif, a subtle intelligence line, and a single bordered
// "تسجيل الدخول" card with the two entry actions. All Arabic copy is
// the locked set from `@/lib/ui/landing`; the canonical logo asset is used
// unchanged. No self-registration (removed by earlier product-owner approval).
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
      {/* header */}
      <header className="relative overflow-hidden">
        <CircuitMotif />
        <div className="relative mx-auto flex w-full max-w-[var(--content-max)] items-center justify-between gap-4 px-8 py-7">
          {/* logo — inline-start (right in RTL) */}
          <Logo height={54} priority />

          {/* language control — inline-end (left in RTL) */}
          <button
            type="button"
            dir="ltr"
            onClick={() => setLang((l) => (l === "ar" ? "en" : "ar"))}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
            aria-label="تبديل اللغة"
          >
            <GlobeIcon />
            {lang === "ar" ? LANGUAGE_CONTROL.enLabel : LANGUAGE_CONTROL.arLabel}
          </button>
        </div>
      </header>

      {/* hero */}
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-[42rem] flex-col items-center text-center">
          <h1 className="max-w-[38rem] text-[2.15rem] font-bold leading-[1.28] text-[var(--color-ink)] sm:text-[2.9rem] sm:leading-[1.22]">
            {LANDING_HEADLINE_AR}
          </h1>

          <p className="mx-auto mt-6 max-w-[34rem] text-[15px] leading-[2] text-[var(--color-ink-muted)]">
            {LANDING_SUPPORTING_AR}
          </p>

          <p className="mx-auto mt-7 inline-block rounded-[12px] bg-[var(--color-primary-tint)] px-5 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-primary)]">
            {AI_INTELLIGENCE_LINE_AR}
          </p>

          {/* login card */}
          <div
            className="mt-14 w-full max-w-[23rem] rounded-[20px] px-10 py-9 text-center"
            style={{ background: "#efece7" }}
          >
            <h2 className="text-[1.6rem] font-bold text-[var(--color-ink)]">تسجيل الدخول</h2>

            <PersonMark />

            <div className="mt-8 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={enterGovernment}
                className="w-full rounded-[10px] bg-[var(--color-primary)] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                {GOVERNMENT_CTA_AR}
              </button>
              <button
                type="button"
                onClick={enterCompany}
                className="w-full rounded-[10px] bg-[var(--color-primary)] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                {COMPANY_CTA_AR}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* footer */}
      <footer className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex w-full max-w-[var(--content-max)] flex-wrap items-center justify-between gap-2 px-8 py-5">
          <p className="text-[11px] leading-relaxed text-[var(--color-ink-faint)]">
            سبّاق لا يحل محل السلطة التنظيمية ولا يضمن نتائج التفتيش.
          </p>
          <p className="text-[11px] text-[var(--color-ink-faint)]">{LANDING_FOOTER_AR}</p>
        </div>
      </footer>
    </div>
  );
}

// -- inline marks --------------------------------------------------------

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

/** Two-tone person glyph (approved Flaticon "People" visual reference). */
function PersonMark() {
  return (
    <svg
      viewBox="0 0 96 96"
      width="104"
      height="104"
      aria-hidden="true"
      className="mx-auto mt-7"
    >
      <path d="M16 86c0-17.7 14.3-32 32-32s32 14.3 32 32z" fill="var(--color-primary)" />
      <circle cx="48" cy="30" r="17" fill="var(--color-primary)" />
      <g fill="var(--color-primary-hover)" opacity="0.55">
        <path d="M48 13a17 17 0 0 0 0 34Z" />
        <path d="M48 54c-17.7 0-32 14.3-32 32h32z" />
      </g>
    </svg>
  );
}

/** Faint decorative circuit-trace motif behind the header (no meaning). */
function CircuitMotif() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-0 h-[220px] w-full text-[var(--color-border-strong)]"
      viewBox="0 0 1200 220"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMin slice"
      style={{ opacity: 0.35 }}
    >
      <g stroke="currentColor" strokeWidth="1.25">
        <path d="M0 60h120l24 24h96M180 84v56M276 84h140l20-20h120" />
        <path d="M1200 48h-150l-28 28h-110M912 76v40M912 116h-130l-22 22H520" />
        <path d="M40 150h180l30-30h150M760 150h180l24 24h96" />
      </g>
      <g fill="currentColor">
        <circle cx="120" cy="60" r="3.5" />
        <circle cx="276" cy="84" r="3.5" />
        <circle cx="180" cy="140" r="3.5" />
        <circle cx="1050" cy="48" r="3.5" />
        <circle cx="912" cy="116" r="3.5" />
        <circle cx="760" cy="150" r="3.5" />
      </g>
    </svg>
  );
}
