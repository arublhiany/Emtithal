// =============================================================================
// Approved research corpus (Phase 8) — closed-world.
//
// One approved publisher only: معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة —
// جامعة أم القرى. No news summaries, blogs, snippets, generated summaries, or
// other institutions. `publicationStatus` is stored EXPLICITLY.
//
// Provenance is NOT PDF-only. The corpus holds:
//  1. SEED_RESEARCH_ENTRY — the Nawwariyah simulation INTERIM_REPORT PDF, whose
//     official PDF has NOT been ingested in this environment (its `passages` are
//     empty, `sourceVerificationStatus` is PENDING_LOCAL_INGESTION). Its
//     contents are NEVER invented; only the approved bibliographic metadata is
//     stored. It stays a future PDF source.
//  2. Two REAL official UQU web sources, captured verbatim in a locally hashed
//     snapshot (research_sources/uqu_research_web_sources.md). These are OFFICIAL
//     WEB pages, NOT reconstructed PDFs — WEB_SECTION provenance, no page number.
//
// The corpus is CORPUS_LOADED because ≥1 real approved source (the web snapshots)
// has verified local provenance + non-empty grounded passages.
// =============================================================================

import type { ResearchCorpusEntry, ResearchCorpusState } from "./types";

export { RESEARCH_CORPUS_PENDING_CODE } from "./types";

// -- local official-web snapshot -------------------------------------------------
//
// The snapshot markdown file is a provenance-preserving LOCAL CAPTURE only — it
// is NOT the publisher. The canonical publisher/source stays UQU / the Institute.
// The SHA-256 below is computed locally over the exact file bytes; a test
// (`webSnapshot.test.ts`) re-hashes the file and asserts it still matches.

/** Repo-relative path of the verified local official-web snapshot. */
export const WEB_SNAPSHOT_SOURCE_FILE = "research_sources/uqu_research_web_sources.md";

/** SHA-256 of the exact bytes of `WEB_SNAPSHOT_SOURCE_FILE` (computed locally). */
export const WEB_SNAPSHOT_SHA256 =
  "32dca19615c7b9d83418fa87e160de7e522b8025edd2d73ae98696c4f6a22ff2";

/**
 * ISO 8601 — when this local official-web snapshot was VERIFIED inside the
 * Emtithal repository (a re-hash matching `WEB_SNAPSHOT_SHA256`). It is NOT a
 * UQU publication date and NOT the page's last-modified date. Captured once from
 * the machine clock (`date -u +"%Y-%m-%dT%H:%M:%SZ"`), not from file mtime.
 */
export const WEB_SNAPSHOT_VERIFIED_AT = "2026-08-31T16:47:51Z";

/**
 * SEED — the first approved Institute publication. INTERIM_REPORT, PDF report.
 * Bibliographic metadata only. `passages: []` until the official PDF is ingested
 * locally with real page provenance (see `ingestResearchPdf`).
 */
export const SEED_RESEARCH_ENTRY: ResearchCorpusEntry = {
  researchId: "UQU-HAJJ-INST-1447-NAWWARIYAH-SIM",
  titleAr:
    "تحسين كفاءة المرور بمحطة استقبال حافلات الحجاج والمعتمرين بالنوارية باستخدام النمذجة والمحاكاة",
  publisherAr: "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة",
  institutionAr: "جامعة أم القرى",
  researchSeason: "1447H",
  publicationYear: "2026",
  publicationStatus: "INTERIM_REPORT",
  sourceKind: "PDF_REPORT",
  theme: "OPERATIONAL_SIMULATION_AND_DECISION_SUPPORT",
  topicTags: [
    "النمذجة",
    "المحاكاة",
    "تقييم البدائل التشغيلية",
    "قبل التنفيذ الميداني",
    "كفاءة المرور",
    "محطة استقبال الحافلات",
    "النوارية",
    "دعم القرار التشغيلي",
  ],
  officialSourceReference:
    "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة، جامعة أم القرى — \"تحسين كفاءة المرور بمحطة استقبال حافلات الحجاج والمعتمرين بالنوارية باستخدام النمذجة والمحاكاة\" (تقرير مرحلي، موسم 1447هـ / 2026م).",
  // The official UQU parent page is verified; the linked drive.uqu.edu.sa PDF
  // currently presents an invalid/private-connection certificate warning.
  // `officialUrl` stays null until the real PDF is ingested over a valid TLS
  // connection — TLS/certificate validation is NEVER bypassed.
  officialUrl: null,
  approvedSourceLocator:
    "الصفحة الرسمية لجامعة أم القرى / معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة (uqu.edu.sa) — تم التحقق منها. رابط ملف PDF على drive.uqu.edu.sa يُظهر حاليًا تحذير شهادة اتصال غير صالحة، ولن يتم تجاوز التحقق من الشهادة؛ لم يُنزَّل الملف الرسمي محليًا بعد.",
  documentHash: null,
  snapshotHash: null,
  ingestedAt: null,
  snapshotVerifiedAt: null,
  sourceVerificationStatus: "PENDING_LOCAL_INGESTION",
  scopeAr:
    "استخدام النمذجة والمحاكاة لتقييم بدائل تشغيلية لمحطة استقبال حافلات الحجاج والمعتمرين بالنوارية بهدف تحسين كفاءة المرور، مع تقييم البدائل قبل التنفيذ الميداني.",
  limitationsAr: [
    "المصدر تقرير مرحلي، وتبقى النتائج أو التوصيات قابلة للتحديث في التقرير النهائي.",
    "الدراسة خاصة بحالة محطة النوارية ولا تُعمَّم تلقائيًا على مواقع أو قرارات أخرى.",
    "لا يمثل هذا المصدر متطلبًا تنظيميًا ولا يغيّر أي نتيجة امتثال أو جاهزية.",
  ],
  passages: [], // EMPTY — the official PDF has not been ingested in this environment.
};

/**
 * SOURCE A — the Institute's Modelling & Simulation Unit page. OFFICIAL_WEB_PAGE.
 * Verbatim excerpt from the local official-web snapshot; WEB_SECTION provenance,
 * no page number. Supports the GENERAL institutional use of modelling/simulation
 * for evaluating proposals/solutions, suggesting alternatives, deriving
 * indicators/readings, and supporting decision-making — it does NOT validate any
 * specific Emtithal scenario or numerical output.
 */
export const WEB_SOURCE_SIMULATION_UNIT: ResearchCorpusEntry = {
  researchId: "UQU-HAJJ-INSTITUTE-SIMULATION-UNIT",
  titleAr: "وحدة النمذجة والمحاكاة",
  publisherAr: "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة — جامعة أم القرى",
  institutionAr: "جامعة أم القرى",
  researchSeason: null,
  // No explicit publication date on the page. The snapshot only shows a
  // "last modified" date (2019-05-21) — that is NOT a publication year, so it is
  // deliberately NOT stored here.
  publicationYear: null,
  publicationStatus: "OTHER_APPROVED",
  sourceKind: "OFFICIAL_WEB_PAGE",
  theme: "OPERATIONAL_SIMULATION_AND_DECISION_SUPPORT",
  topicTags: [
    "النمذجة",
    "المحاكاة",
    "استخدام النمذجة والمحاكاة",
    "تقييم المقترحات والحلول",
    "اقتراح البدائل",
    "استنباط مؤشرات وقراءات",
    "دعم القرار",
    "وحدة النمذجة والمحاكاة",
    "معهد الحج والعمرة",
  ],
  officialSourceReference:
    "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة، جامعة أم القرى — صفحة \"وحدة النمذجة والمحاكاة\" (مصدر ويب رسمي: https://uqu.edu.sa/hajj/70777).",
  officialUrl: "https://uqu.edu.sa/hajj/70777",
  approvedSourceLocator:
    "لقطة محلية موثّقة من الصفحة الرسمية لجامعة أم القرى (uqu.edu.sa/hajj/70777) محفوظة في research_sources/uqu_research_web_sources.md. اللقطة حاوية محلية فقط؛ الناشر المرجعي هو المعهد / جامعة أم القرى.",
  documentHash: null,
  snapshotHash: WEB_SNAPSHOT_SHA256,
  ingestedAt: null,
  snapshotVerifiedAt: WEB_SNAPSHOT_VERIFIED_AT,
  sourceVerificationStatus: "OFFICIAL_WEB_SNAPSHOT_VERIFIED_LOCAL",
  scopeAr:
    "الدور المؤسسي العام لتقنيات النمذجة والمحاكاة في عمليات الحج والعمرة: تقييم فاعلية المقترحات والحلول، واقتراح بدائل تتماشى مع متغيرات بيئة الدراسة، واستنباط مؤشرات وقراءات لدعم القرار في بعض الخطط التطويرية.",
  limitationsAr: [
    "هذا مصدر ويب رسمي (صفحة تعريفية للوحدة) وليس تقريرًا بحثيًا نهائيًا بنتائج مقيسة.",
    "يدعم الدور العام للنمذجة والمحاكاة فقط، ولا يتحقق من صحة أي سيناريو أو ناتج رقمي محدد في منصة امتثال.",
    "لا يمثل هذا المصدر متطلبًا تنظيميًا ولا يغيّر أي نتيجة امتثال أو جاهزية.",
  ],
  passages: [
    {
      passageId: "UQU-HAJJ-INSTITUTE-SIMULATION-UNIT#web-1",
      locator: { type: "WEB_SECTION", section: "main body / unit description" },
      textAr:
        "تهدف الوحدة إلى استخدام تقنيات النمذجة والمحاكاة في عمليات الحج والعمرة، والمقترحات والحلول المرتبطة بتلك العمليات، حيث يوفر ذلك تقييماً لفاعلية المقترحات والحلول، وفي اقتراح بدائل تتماشى مع المتغيرات المحيطة ببيئة الدراسة، بالإضافة إلى إمكانية استنباط مؤشرات وقراءات لدعم القرار في القيام ببعض الخطط التطويرية.",
      extractionMethod: "WEB_SNAPSHOT_TEXT",
    },
  ],
};

/**
 * SOURCE B — the BRT operational-efficiency study/project page.
 * OFFICIAL_STUDY_PAGE — an official study/project page, NOT a final research
 * report. Supports ONLY what the snapshot states: the Institute is running a
 * scientific BRT operational-efficiency study; modelling/simulation is used to
 * analyse actual operating conditions; the study considers operational
 * efficiency, travel time, flow, and peak periods. NO study results.
 */
export const WEB_SOURCE_BRT_STUDY: ResearchCorpusEntry = {
  researchId: "UQU-HAJJ-1447-BRT-SIMULATION-STUDY",
  titleAr:
    "معهد خادم الحرمين الشَّريفين لأبحاث الحجِّ والعمرة يقيِّم كفاءة نظام الحافلات السَّريعة (BRT)",
  publisherAr: "جامعة أم القرى / معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة",
  institutionAr: "جامعة أم القرى",
  researchSeason: "1447H",
  publicationYear: "2026",
  publicationStatus: "OTHER_APPROVED",
  sourceKind: "OFFICIAL_STUDY_PAGE",
  theme: "OPERATIONAL_SIMULATION_AND_DECISION_SUPPORT",
  topicTags: [
    "النمذجة",
    "المحاكاة",
    "النمذجة والمحاكاة الحاسوبية",
    "الحافلات السريعة",
    "BRT",
    "الكفاءة التشغيلية",
    "أوقف مركبتك واركب",
    "Park and Ride",
    "زمن الرحلات",
    "الانسيابية",
    "فترات الذروة",
    "المدينة المنورة",
    "موسم رمضان",
  ],
  officialSourceReference:
    "جامعة أم القرى / معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة — صفحة دراسة/مشروع رسمية: \"…يقيِّم كفاءة نظام الحافلات السَّريعة (BRT)\" (مصدر ويب رسمي: https://uqu.edu.sa/App/News/178082).",
  officialUrl: "https://uqu.edu.sa/App/News/178082",
  approvedSourceLocator:
    "لقطة محلية موثّقة من صفحة الأخبار الرسمية لجامعة أم القرى (uqu.edu.sa/App/News/178082) محفوظة في research_sources/uqu_research_web_sources.md. اللقطة حاوية محلية فقط؛ الناشر المرجعي هو جامعة أم القرى / المعهد.",
  documentHash: null,
  snapshotHash: WEB_SNAPSHOT_SHA256,
  ingestedAt: null,
  snapshotVerifiedAt: WEB_SNAPSHOT_VERIFIED_AT,
  sourceVerificationStatus: "OFFICIAL_WEB_SNAPSHOT_VERIFIED_LOCAL",
  scopeAr:
    "صفحة دراسة/مشروع رسمية: المعهد ينفّذ دراسة علمية متخصصة لتقييم الكفاءة التشغيلية لنظام الحافلات السريعة (BRT) في المدينة المنورة خلال موسم رمضان باستخدام النمذجة والمحاكاة الحاسوبية لتحليل الأداء في الظروف التشغيلية الفعلية، مع التركيز على نظام \"أوقف مركبتك واركب\" وتحليل زمن الرحلات والانسيابية وفترات الذروة.",
  limitationsAr: [
    "هذه صفحة دراسة/مشروع رسمية وليست تقريرًا بحثيًا نهائيًا؛ لا تتضمن نتائج نهائية ولا يجوز التعامل معها كتقرير نهائي.",
    "لا تُذكر في اللقطة أي نسبة أو حجم عينة أو نتيجة سعة أو خفض زمن انتظار؛ ولا يجوز اختلاق أي رقم نتيجة.",
    "لا يمثل هذا المصدر متطلبًا تنظيميًا ولا يغيّر أي نتيجة امتثال أو جاهزية.",
  ],
  passages: [
    {
      passageId: "UQU-HAJJ-1447-BRT-SIMULATION-STUDY#web-1",
      locator: { type: "WEB_SECTION", section: "article body" },
      textAr:
        "ينفِّذ معهد خادم الحرمين الشَّريفين لأبحاث الحج والعمرة بجامعة أمِّ القرى دراسة علمية متخصصة لتقييم الكفاءة التشغيلية لنظام الحافلات السريعة (BRT) في المدينة المنورة خلال موسم رمضان؛ باستخدام النمذجة والمحاكاة الحاسوبية لتحليل أداء النظام في الظروف التشغيلية الفعلية.",
      extractionMethod: "WEB_SNAPSHOT_TEXT",
    },
    {
      passageId: "UQU-HAJJ-1447-BRT-SIMULATION-STUDY#web-2",
      locator: { type: "WEB_SECTION", section: "article body" },
      textAr:
        "وتركز الدراسة على تحليل أداء نظام “أوقف مركبتك واركب” (Park and Ride)؛ من خلال قياس كفاءة التشغيل، وتحليل زمن الرحلات، وتقييم مستوى الانسيابية في حركة الحافلات، إلى جانب دراسة التحديات المرتبطة بفترات الذروة.",
      extractionMethod: "WEB_SNAPSHOT_TEXT",
    },
  ],
};

const CORPUS: ResearchCorpusEntry[] = [
  SEED_RESEARCH_ENTRY,
  WEB_SOURCE_SIMULATION_UNIT,
  WEB_SOURCE_BRT_STUDY,
];

function clone(e: ResearchCorpusEntry): ResearchCorpusEntry {
  return {
    ...e,
    topicTags: [...e.topicTags],
    limitationsAr: [...e.limitationsAr],
    passages: e.passages.map((p) => ({ ...p, locator: { ...p.locator } })),
  };
}

export function getResearchCorpus(): ResearchCorpusEntry[] {
  return CORPUS.map(clone);
}

export function getResearchEntryById(researchId: string): ResearchCorpusEntry | undefined {
  const found = CORPUS.find((e) => e.researchId === researchId);
  return found ? clone(found) : undefined;
}

/**
 * An entry counts as loaded only when a real approved source has verified local
 * provenance (an ingested official PDF OR a verified official-web snapshot) AND
 * non-empty grounded passages.
 */
export function isEntryLoaded(entry: ResearchCorpusEntry): boolean {
  const verified =
    entry.sourceVerificationStatus === "OFFICIAL_SOURCE_VERIFIED_LOCAL" ||
    entry.sourceVerificationStatus === "OFFICIAL_WEB_SNAPSHOT_VERIFIED_LOCAL";
  return verified && entry.passages.length > 0;
}

export function researchCorpusState(corpus: ResearchCorpusEntry[] = CORPUS): ResearchCorpusState {
  return corpus.some(isEntryLoaded) ? "CORPUS_LOADED" : "CORPUS_PENDING";
}
