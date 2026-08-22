"use client";

import { useMemo, useState } from "react";
import { DECISION_CATEGORIES, DECISION_PRESETS } from "@/lib/data/decisionCatalog";
import type { DecisionCategory, DecisionInput } from "@/lib/types";

export function DecisionForm({
  onSimulate,
  isSimulating,
}: {
  onSimulate: (input: DecisionInput) => void;
  isSimulating: boolean;
}) {
  const [category, setCategory] = useState<DecisionCategory>("staffing_change");
  const presetsForCategory = useMemo(
    () => DECISION_PRESETS.filter((p) => p.category === category),
    [category]
  );
  const [presetId, setPresetId] = useState(presetsForCategory[0]?.id);
  const preset =
    DECISION_PRESETS.find((p) => p.id === presetId) ?? presetsForCategory[0];

  const [titleAr, setTitleAr] = useState(preset?.titleAr ?? "");
  const [descriptionAr, setDescriptionAr] = useState(preset?.descriptionAr ?? "");
  const [magnitudePercent, setMagnitudePercent] = useState(preset?.magnitudePercent ?? -10);
  const [affectedAreaAr, setAffectedAreaAr] = useState(preset?.affectedAreaAr ?? "");

  function selectCategory(next: DecisionCategory) {
    setCategory(next);
    const nextPreset = DECISION_PRESETS.find((p) => p.category === next);
    if (nextPreset) {
      setPresetId(nextPreset.id);
      setTitleAr(nextPreset.titleAr);
      setDescriptionAr(nextPreset.descriptionAr);
      setMagnitudePercent(nextPreset.magnitudePercent);
      setAffectedAreaAr(nextPreset.affectedAreaAr);
    }
  }

  function selectPreset(id: string) {
    const p = DECISION_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    setTitleAr(p.titleAr);
    setDescriptionAr(p.descriptionAr);
    setMagnitudePercent(p.magnitudePercent);
    setAffectedAreaAr(p.affectedAreaAr);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSimulate({ titleAr, category, descriptionAr, magnitudePercent, affectedAreaAr });
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-1">
          1. نوع القرار التشغيلي
        </h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {DECISION_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => selectCategory(c.id)}
              className={`text-right rounded-lg border p-3 transition-colors ${
                category === c.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-tint)]"
                  : "border-[var(--color-border)] hover:bg-[var(--color-bg)]"
              }`}
            >
              <span className="text-base ml-1.5" aria-hidden>
                {c.icon}
              </span>
              <span className="text-xs font-semibold text-[var(--color-ink)]">{c.labelAr}</span>
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                {c.helperAr}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-1">
          2. اختر مثالًا تشغيليًا أو خصّصه
        </h3>
        <div className="space-y-1.5">
          {presetsForCategory.map((p) => (
            <label
              key={p.id}
              className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                presetId === p.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-tint)]"
                  : "border-[var(--color-border)] hover:bg-[var(--color-bg)]"
              }`}
            >
              <input
                type="radio"
                name="preset"
                checked={presetId === p.id}
                onChange={() => selectPreset(p.id)}
                className="mt-1"
              />
              <span className="text-xs text-[var(--color-ink)]">{p.titleAr}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1.5">
            عنوان القرار
          </label>
          <input
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1.5">
            الجهة / نقطة الخدمة المتأثرة
          </label>
          <input
            value={affectedAreaAr}
            onChange={(e) => setAffectedAreaAr(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1.5">
          وصف القرار
        </label>
        <textarea
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-[var(--color-ink-muted)]">
            نسبة التغيير المقترحة
          </label>
          <span className="text-sm font-bold tabular-nums text-[var(--color-ink)]">
            {magnitudePercent > 0 ? "+" : ""}
            {magnitudePercent}%
          </span>
        </div>
        <input
          type="range"
          min={-40}
          max={40}
          step={1}
          value={magnitudePercent}
          onChange={(e) => setMagnitudePercent(Number(e.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--color-ink-faint)] mt-1">
          <span>تخفيض 40%-</span>
          <span>بلا تغيير</span>
          <span>زيادة 40%+</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSimulating}
        className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
      >
        {isSimulating ? "جارٍ تحليل الأثر…" : "🧭 تحليل أثر القرار قبل التنفيذ"}
      </button>
    </form>
  );
}
