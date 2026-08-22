// =============================================================================
// Demo company profile — a fictional Hajj service company used to make the
// product demonstrable. Not a real company.
// =============================================================================

import type { CompanyProfile } from "@/lib/types";
import { getRequirements } from "@/lib/data/requirements";
import { computeCapabilityIndicators } from "@/lib/engine/capabilityEngine";

export const DEMO_COMPANY_ID = "company-alnoor";

const RAW_PROFILE = {
  pilgrimsServed: 6200,
  workforceSize: 260,
  supervisors: 6,
  serviceLocations: 9,
};

export function getCompanyProfile(): CompanyProfile {
  const requirements = getRequirements();
  return {
    id: DEMO_COMPANY_ID,
    nameAr: "شركة النور لخدمات الحج",
    nameEn: "Al-Noor Hajj Services (Demo)",
    license: "رخصة تشغيل رقم 4471-H",
    city: "مكة المكرمة",
    ...RAW_PROFILE,
    seasonLabel: "موسم 1447هـ",
    capabilityIndicators: computeCapabilityIndicators(RAW_PROFILE, requirements),
  };
}
