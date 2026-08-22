// =============================================================================
// Decision Simulation — structured catalog for the decision-entry form.
// The company selects a category and a preset (or edits it), rather than
// typing free-form chat text — this keeps Decision Simulation a structured,
// auditable tool rather than a generic chatbot (MASTER_SPEC §2).
// =============================================================================

import type { DecisionCategory } from "@/lib/types";

export interface DecisionCategoryMeta {
  id: DecisionCategory;
  labelAr: string;
  icon: string; // emoji-style glyph, rendered inside a badge — no external icon deps
  helperAr: string;
}

export const DECISION_CATEGORIES: DecisionCategoryMeta[] = [
  {
    id: "staffing_change",
    labelAr: "تغييرات في القوى العاملة",
    icon: "👥",
    helperAr: "تخفيض أو زيادة عدد الموظفين في نقطة خدمة أو نشاط معين.",
  },
  {
    id: "service_change",
    labelAr: "تغيير في الخدمة أو نقاط التقديم",
    icon: "🛎️",
    helperAr: "تعديل موقع أو آلية تقديم خدمة قائمة.",
  },
  {
    id: "guest_experience_process",
    labelAr: "عمليات تجربة الضيف",
    icon: "🕋",
    helperAr: "إضافة أو تعديل مبادرات ومسارات تجربة ضيف الرحمن.",
  },
  {
    id: "evidence_process_change",
    labelAr: "تغيير في عمليات التوثيق والأدلة",
    icon: "🗂️",
    helperAr: "تعديل آلية جمع أو توثيق الأدلة والتقارير الداعمة.",
  },
  {
    id: "operational_change",
    labelAr: "تغيير تشغيلي عام",
    icon: "⚙️",
    helperAr: "تعديلات تشغيلية أوسع تمس أكثر من جانب من جوانب الرحلة.",
  },
];

export interface DecisionPreset {
  id: string;
  category: DecisionCategory;
  titleAr: string;
  descriptionAr: string;
  magnitudePercent: number;
  affectedAreaAr: string;
}

export const DECISION_PRESETS: DecisionPreset[] = [
  {
    id: "preset-staff-cut-20",
    category: "staffing_change",
    titleAr: "خفض عدد الموظفين في نقطة خدمة الجمرات بنسبة 20%",
    descriptionAr:
      "تخفيض عدد الموظفين العاملين في نقطة خدمة الجمرات خلال أوقات الذروة بنسبة 20% لتقليل التكلفة التشغيلية.",
    magnitudePercent: -20,
    affectedAreaAr: "نقطة خدمة الجمرات",
  },
  {
    id: "preset-staff-cut-10",
    category: "staffing_change",
    titleAr: "خفض طفيف في فريق الاستقبال بنسبة 10%",
    descriptionAr: "تقليل عدد موظفي الاستقبال في أحد المخيمات بنسبة 10% خارج أوقات الذروة.",
    magnitudePercent: -10,
    affectedAreaAr: "نقطة الاستقبال — المخيم الرئيسي",
  },
  {
    id: "preset-happiness-rounds-cut",
    category: "operational_change",
    titleAr: "تقليص عدد الجولات الميدانية لفريق السعادة",
    descriptionAr: "تقليل عدد الجولات الأسبوعية لفريق السعادة من 6 إلى 4 جولات لتخفيف العبء التشغيلي.",
    magnitudePercent: -18,
    affectedAreaAr: "جولات فريق السعادة الميدانية",
  },
  {
    id: "preset-new-experience-initiative",
    category: "guest_experience_process",
    titleAr: "إطلاق مبادرة جديدة لتحسين تجربة الضيف عند نقاط التجمع",
    descriptionAr: "إطلاق مبادرة إرشاد ميداني إضافية عند نقاط التجمع الرئيسية لتحسين تجربة ضيف الرحمن.",
    magnitudePercent: 15,
    affectedAreaAr: "نقاط التجمع الرئيسية",
  },
  {
    id: "preset-reduce-documentation",
    category: "evidence_process_change",
    titleAr: "تبسيط آلية التوثيق الدوري للفعاليات",
    descriptionAr: "تقليل تكرار رفع تقارير التوثيق الدورية للفعاليات من أسبوعي إلى شهري.",
    magnitudePercent: -12,
    affectedAreaAr: "دورة توثيق الفعاليات",
  },
  {
    id: "preset-monitoring-expansion",
    category: "operational_change",
    titleAr: "توسيع تغطية رصد رحلة الضيف لتشمل جميع نقاط الخدمة",
    descriptionAr: "زيادة عدد فرق الرصد الميداني لتغطية نقاط الخدمة التسع بالكامل بدلاً من 6 فقط.",
    magnitudePercent: 20,
    affectedAreaAr: "جميع نقاط الخدمة",
  },
];
