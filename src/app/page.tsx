"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemoStore } from "@/lib/store/demoStore";
import type { CompanyRole } from "@/lib/types";
import { COMPANY_ROLE_LABEL } from "@/lib/labels";
import { getCompanyProfile } from "@/lib/data/company";

const ROLE_OPTIONS: { id: CompanyRole; descAr: string; icon: string }[] = [
  {
    id: "compliance_officer",
    descAr: "متابعة الامتثال، الأدلة، والفجوات بشكل يومي.",
    icon: "🧾",
  },
  {
    id: "operations_manager",
    descAr: "متابعة الإجراءات التصحيحية والتشغيل الميداني.",
    icon: "⚙️",
  },
  {
    id: "decision_maker",
    descAr: "استخدام محاكاة القرار قبل اتخاذ قرارات تشغيلية.",
    icon: "🧭",
  },
];

const PIPELINE_STEPS = [
  { titleAr: "متطلبات الوزارة", icon: "🏛️" },
  { titleAr: "قاعدة معرفة الامتثال", icon: "📚" },
  { titleAr: "الأدلة والبيانات التشغيلية", icon: "🗂️" },
  { titleAr: "محرك الامتثال", icon: "⚖️" },
  { titleAr: "تحليل الفجوات والمخاطر", icon: "🎯" },
  { titleAr: "طبقة الذكاء الاصطناعي", icon: "🤖" },
  { titleAr: "توصيات ومحاكاة القرار", icon: "🧭" },
  { titleAr: "لوحات ومتابعة", icon: "📊" },
];

const VALUE_PROPS = [
  {
    icon: "🔍",
    titleAr: "امتثال استباقي لا تفاعلي",
    descAr: "اكتشاف الفجوات قبل التفتيش بدلاً من انتظار المفاجآت.",
  },
  {
    icon: "🧭",
    titleAr: "محاكاة القرار قبل التنفيذ",
    descAr: "اعرف أثر القرار التشغيلي على الامتثال قبل أن تتخذه.",
  },
  {
    icon: "🗂️",
    titleAr: "ذكاء الأدلة",
    descAr: "تحليل مبدئي للأدلة المرفوعة وربطها بالمتطلبات مع تتبّع كامل للمصدر.",
  },
  {
    icon: "🏛️",
    titleAr: "طبقة ذكاء رقابي للوزارة",
    descAr: "رؤية شاملة للشركات والمخاطر المتكررة ومعايير الامتثال.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { setSession } = useDemoStore();
  const [entity, setEntity] = useState<"none" | "company" | "ministry">("none");
  const profile = getCompanyProfile();

  function enterCompany(role: CompanyRole) {
    setSession("company", role);
    router.push("/company/dashboard");
  }

  function enterMinistry() {
    setSession("ministry", null);
    router.push("/ministry/control-center");
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Top bar */}
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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
          </div>
          <span className="text-xs text-[var(--color-ink-muted)]">
            منصة عرض تجريبي — هاكاثون
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-14">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full bg-[var(--color-primary-tint)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] mb-5">
            منصة ذكاء اصطناعي للامتثال الاستباقي وذكاء القرار
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-ink)] leading-[1.15] mb-5">
            امتثال يحوّل الجاهزية التنظيمية من رد الفعل
            <br className="hidden sm:block" /> إلى قرار استباقي مبني على بيانات
          </h1>
          <p className="text-[var(--color-ink-muted)] text-base leading-relaxed max-w-2xl mb-8">
            امتثال منصة ذكاء اصطناعي للامتثال وذكاء القرار مصممة لشركات خدمة الحج والجهات
            الرقابية. تربط المنصة المتطلبات الرسمية بالأدلة والبيانات التشغيلية الفعلية لكل
            شركة، لقياس الامتثال، وكشف الفجوات قبل التفتيش، وفهم أثر القرارات التشغيلية على
            الامتثال قبل تنفيذها.
          </p>

          <div className="flex flex-wrap gap-3 mb-3">
            <button
              onClick={() => setEntity("company")}
              className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              دخول تجريبي — شركة الحج
            </button>
            <button
              onClick={enterMinistry}
              className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-bg)] transition-colors"
            >
              دخول تجريبي — وزارة الحج والعمرة
            </button>
          </div>
          <p className="text-xs text-[var(--color-ink-faint)]">
            بيانات وشركة تجريبية بالكامل لأغراض العرض — لا تمثل شركة أو جهة حقيقية.
          </p>
        </div>

        {/* Role picker */}
        {entity === "company" && (
          <div className="mt-8 max-w-3xl card p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-[var(--color-ink)]">
                الدخول باسم {profile.nameAr} (تجريبي)
              </h3>
              <button
                onClick={() => setEntity("none")}
                className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                إغلاق ✕
              </button>
            </div>
            <p className="text-sm text-[var(--color-ink-muted)] mb-5">
              اختر دورك لعرض تجربة مخصصة (تسجيل دخول تجريبي بدون كلمة مرور لأغراض العرض).
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.id}
                  onClick={() => enterCompany(role.id)}
                  className="text-right rounded-xl border border-[var(--color-border)] p-4 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-tint)] transition-colors"
                >
                  <span className="text-xl mb-2 block">{role.icon}</span>
                  <span className="block font-semibold text-sm text-[var(--color-ink)] mb-1">
                    {COMPANY_ROLE_LABEL[role.id]}
                  </span>
                  <span className="block text-xs text-[var(--color-ink-muted)] leading-relaxed">
                    {role.descAr}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VALUE_PROPS.map((v) => (
            <div key={v.titleAr} className="card p-5">
              <span className="text-2xl block mb-3">{v.icon}</span>
              <h3 className="font-semibold text-sm text-[var(--color-ink)] mb-1.5">
                {v.titleAr}
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">{v.descAr}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-1">
            كيف تعمل منصة امتثال
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-6">
            معمارية هجينة تفصل المنطق الحتمي للامتثال عن طبقة الذكاء الاصطناعي — الذكاء
            الاصطناعي يفسّر ويوصي، والمحرك الحتمي يحسب النتيجة الرقمية.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {PIPELINE_STEPS.map((step, idx) => (
              <div key={step.titleAr} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
                  <span aria-hidden>{step.icon}</span>
                  <span className="text-xs font-medium text-[var(--color-ink)] whitespace-nowrap">
                    {step.titleAr}
                  </span>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <span className="text-[var(--color-ink-faint)]">←</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--color-ink-faint)]">
            امتثال لا يحل محل السلطة التنظيمية للوزارة ولا يضمن نتائج التفتيش. جميع تحليلات
            الذكاء الاصطناعي قابلة للاعتراض وتخضع للمراجعة البشرية عند الحاجة.
          </p>
          <p className="text-xs text-[var(--color-ink-faint)]">امتثال © 1447هـ</p>
        </div>
      </footer>
    </div>
  );
}
