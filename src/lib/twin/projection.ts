import { DEMO_COMPANY_PROFILE } from "@/lib/data/demo/companyProfile";
import { DEMO_VERIFICATION_INPUTS } from "@/lib/data/demo/verificationInputs";
import { runDeterministicState, type ValidatedMutation } from "@/lib/engine/decisionScenarioEngine";
import { createCamp, summarize, type Zone } from "./camp";

/** Explicit camp-to-company assumption. The camp is a subset of the fictional company. */
export function projectCompany(zones: Zone[]) {
  const delta = summarize(zones).occupancy - summarize(createCamp(0).zones).occupancy;
  const current = DEMO_COMPANY_PROFILE.pilgrims?.count;
  if (current == null) return null;
  const mutation: ValidatedMutation = { fieldPath: "pilgrims.count", kind: "COUNT", currentValue: current,
    scenarioValue: current + delta, source: "SCENARIO_ASSUMPTION" };
  return runDeterministicState("CAMP_TWIN_PROJECTION", DEMO_COMPANY_PROFILE, [mutation], DEMO_VERIFICATION_INPUTS);
}
