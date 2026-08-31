// =============================================================================
// Demo company — the legacy display profile for the company-portal screens.
//
// There is ONE canonical demo company fact set: `DEMO_COMPANY_PROFILE`
// (`@/lib/data/demo/companyProfile`), the profile the applicability and
// verification engines run on. This module only ADAPTS that canonical profile
// to the older `CompanyProfile` presentation shape — every operational fact
// (id, name, city, pilgrims, workforce, sites, season) is DERIVED from the
// canonical profile, never a second hard-coded value.
//
// Only two fields have no canonical equivalent and are display-only labels:
// `nameEn` (an English display name) and `license` (a fictional licence label).
// Neither affects applicability or readiness.
// =============================================================================

import type { CompanyProfile } from "@/lib/types";
import { getRequirements } from "@/lib/data/requirements";
import { computeCapabilityIndicators } from "@/lib/engine/capabilityEngine";
import { getDemoReadinessValue } from "@/lib/engine/complianceView";
import {
  CANONICAL_DEMO_COMPANY_ID,
  DEMO_COMPANY_PROFILE,
} from "@/lib/data/demo/companyProfile";

/** The single primary demo company id — re-exported from the canonical source. */
export const DEMO_COMPANY_ID = CANONICAL_DEMO_COMPANY_ID;

/** "1447H" → "موسم 1447هـ" — deterministic, from the canonical `season`. */
function seasonLabelAr(season: string): string {
  return `موسم ${season.replace(/H$/i, "هـ")}`;
}

export function getCompanyProfile(): CompanyProfile {
  const c = DEMO_COMPANY_PROFILE;
  const pilgrimsServed = c.pilgrims.count ?? 0;
  const workforceSize = c.workforce.count ?? 0;
  const serviceLocations = c.locationsAr.length;
  // No canonical "supervisors" fact exists — derive the planning number the
  // capability engine itself recommends from the canonical workforce, so the
  // indicator is a deterministic function of canonical truth, not a competing
  // hard-coded value.
  const supervisors = Math.ceil(workforceSize / 35);

  const raw = { pilgrimsServed, workforceSize, supervisors, serviceLocations };

  return {
    id: DEMO_COMPANY_ID,
    nameAr: c.legalNameAr,
    nameEn: "Emtithal Model Hajj Services (Demo)", // display-only label
    license: "رخصة تشغيل رقم 4471-H", // display-only fictional label
    city: c.locationsAr[0] ?? "—",
    ...raw,
    seasonLabel: seasonLabelAr(c.season),
    capabilityIndicators: computeCapabilityIndicators(
      raw,
      getRequirements(),
      getDemoReadinessValue(),
    ),
  };
}
