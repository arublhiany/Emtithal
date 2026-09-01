"use client";

import { useMemo, useState } from "react";
import { PageHead, Panel, SectionTitle, Chip, BoundaryChip, EmptyState } from "@/components/ui/kit";
import { searchResearchCorpus } from "@/lib/research/browseResearch";
import { formatSeasonAr } from "@/lib/ui/status";

export default function ResearchSupportPage() {
  const [query, setQuery] = useState("");
  const { results, pending } = useMemo(() => searchResearchCorpus(query), [query]);

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="دعم بحثي"
        title="دعم بحثي"
        subtitle="أبحاث ودراسات معتمدة يمكن الرجوع إليها عند اتخاذ القرار."
        actions={<BoundaryChip kind="RESEARCH" />}
      />

      <Panel className="border-r-2 border-[var(--color-status-compliant)]">
        <p className="text-sm text-[var(--color-ink)]">
          الدراسات تدعم القرار ولا تُعد اشتراطات تنظيمية.
        </p>
      </Panel>

      <div>
        <label htmlFor="research-q" className="mb-1.5 block text-xs font-medium text-[var(--color-ink)]">
          ابحث في الأبحاث والدراسات
        </label>
        <input
          id="research-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالموضوع أو عنوان الدراسة أو الجهة أو كلمة مفتاحية"
          className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)]"
        />
        <p className="mt-1 text-[11px] text-[var(--color-ink-faint)]">
          البحث يقتصر على المصادر المعتمدة داخل المنصة.
        </p>
      </div>

      <div>
        <SectionTitle hint={`${results.length} نتيجة`}>الدراسات المتاحة</SectionTitle>
        {results.length === 0 ? (
          <EmptyState
            title="لا توجد دراسة مطابقة ضمن المصادر المعتمدة"
            hint="جرّب كلمة مفتاحية أخرى مثل: النمذجة والمحاكاة، الكفاءة التشغيلية، الحافلات السريعة."
          />
        ) : (
          <div className="space-y-4">
            {results.map((r) => (
              <Panel key={r.researchId} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-snug text-[var(--color-ink)]">
                    {r.titleAr}
                  </h3>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Chip tone="green" dot={false}>
                      {r.sourceKindAr}
                    </Chip>
                    <Chip tone="neutral" dot={false}>
                      {r.publicationStatusAr}
                    </Chip>
                  </div>
                </div>

                <p className="text-xs text-[var(--color-ink-muted)]">
                  الجهة: <span className="text-[var(--color-ink)]">{r.publisherAr}</span>
                  {r.publicationYear ? ` · ${r.publicationYear}م` : ""}
                  {r.seasonAr ? ` · موسم ${formatSeasonAr(r.seasonAr)}` : ""}
                </p>

                {r.insightAr && (
                  <div className="rounded-[var(--radius-control)] bg-[var(--color-bg)] p-3">
                    <p className="mb-1 text-[11px] font-medium text-[var(--color-ink-faint)]">
                      مقتطف من المصدر
                    </p>
                    <p className="text-xs leading-relaxed text-[var(--color-ink)]">{r.insightAr}</p>
                    {r.insightLocatorAr && (
                      <p className="mt-1 text-[11px] text-[var(--color-ink-faint)]">
                        {r.insightLocatorAr}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <p className="mb-1 text-[11px] font-medium text-[var(--color-ink-faint)]">
                    كيف يدعم القرار
                  </p>
                  <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
                    {r.decisionSupportAr}
                  </p>
                </div>

                {r.topicTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.topicTags.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[var(--color-primary-tint)] px-2 py-0.5 text-[11px] text-[var(--color-primary)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="border-t border-[var(--color-border)] pt-2">
                  <p className="text-[11px] font-medium text-[var(--color-ink-faint)]">المصدر</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
                    {r.officialSourceReference}
                  </p>
                  {r.officialUrl && (
                    <a
                      href={r.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg)]"
                    >
                      فتح المصدر الرسمي
                    </a>
                  )}
                  <p className="mt-1.5 text-[11px] text-[var(--color-ink-muted)]">{r.provenanceNoteAr}</p>
                </div>

                {r.limitationsAr.length > 0 && (
                  <details className="text-[11px] text-[var(--color-ink-muted)]">
                    <summary className="cursor-pointer font-medium text-[var(--color-ink-faint)]">
                      حدود الاستخدام
                    </summary>
                    <ul className="mt-1.5 space-y-1">
                      {r.limitationsAr.map((l, i) => (
                        <li key={i} className="leading-relaxed">
                          • {l}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </Panel>
            ))}
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div>
          <SectionTitle hint={`${pending.length}`}>مصادر بانتظار الإتاحة</SectionTitle>
          <Panel className="space-y-3">
            {pending.map((p) => (
              <div
                key={p.researchId}
                className="border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm text-[var(--color-ink)]">{p.titleAr}</p>
                  <Chip tone="amber" dot={false}>
                    {p.statusAr}
                  </Chip>
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">الجهة: {p.publisherAr}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-ink-faint)]">
                  {p.officialSourceReference}
                </p>
              </div>
            ))}
            <p className="text-[11px] text-[var(--color-ink-faint)]">
              يُدرَج ملخّص هذه الدراسة عند إتاحة مصدرها الرسمي؛ لا يُعرض أي محتوى قبل ذلك.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
}
