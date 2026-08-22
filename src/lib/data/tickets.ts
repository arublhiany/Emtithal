// =============================================================================
// AI dispute / support ticket seed data — demonstrates the human-review
// workflow described in EMTITHAL_MASTER_SPEC.md §29-33.
// =============================================================================

import type { SupportTicket } from "@/lib/types";
import { DEMO_COMPANY_ID } from "@/lib/data/company";

export function getSeedTickets(): SupportTicket[] {
  return [
    {
      id: "TCK-001",
      companyId: DEMO_COMPANY_ID,
      createdByRoleAr: "مسؤول الامتثال",
      aiResultRefAr: "تقييم معيار CR-004 — التعايش مع رحلة ضيف الرحمن ورصد التجربة",
      issueType: "wrong_analysis",
      descriptionAr:
        "نعتقد أن تغطية الرصد الميداني أعلى من 6 نقاط — تم رصد نقطة سابعة الأسبوع الماضي ولم تُحتسب.",
      status: "under_review",
      createdAtLabel: "قبل يوم واحد",
    },
  ];
}
