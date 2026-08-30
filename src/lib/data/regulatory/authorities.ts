// =============================================================================
// Authorities — transcribed from REGULATORY_MATRIX_v1.md §4–§7.
//
// Only authorities with an official requirement directly applicable to the
// Hajj/Umrah company, its workers, or a service the company must provide,
// supervise, or verify (matrix §17 Scope Control).
// =============================================================================

import type { Authority } from "@/lib/model";

export const AUTHORITIES: Authority[] = [
  {
    id: "MOHU",
    nameAr: "وزارة الحج والعمرة",
    domainsAr: ["جودة أداء الخدمات", "الجاهزية التشغيلية", "إدارة مقدمي الخدمات"],
    matrixRef: "REGULATORY_MATRIX_v1.md §4–§5",
  },
  {
    id: "MOH",
    nameAr: "وزارة الصحة",
    domainsAr: ["صحة العاملين"],
    matrixRef: "REGULATORY_MATRIX_v1.md §6",
  },
  {
    id: "CIVIL_DEFENSE",
    nameAr: "الدفاع المدني",
    domainsAr: ["السلامة"],
    matrixRef: "REGULATORY_MATRIX_v1.md §7",
  },
];
