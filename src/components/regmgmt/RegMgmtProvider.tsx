"use client";

// =============================================================================
// Government regulatory-management — client provider (Phase 10).
//
// Wraps the PURE reducers in `@/lib/regmgmt` with a SEPARATE versioned
// localStorage key. It never touches the demo store's persisted shape.
// Canonical Phase-1 truth is read-only; this layer only appends DRAFT /
// new-version / deactivation records + audit + regulatory-change notifications.
// =============================================================================

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import {
  REGMGMT_STORAGE_KEY,
  analyzeImpact,
  buildRegChangeNotifications,
  deserializeRegMgmt,
  reduceActivateVersion,
  reduceCreateRequirement,
  reduceDeactivate,
  reduceIssueVersion,
  reduceRecordNotifications,
  reduceUpdateDraft,
  seedRegMgmtState,
  serializeRegMgmt,
  type ImpactAnalysis,
  type RegChangeType,
  type RegMgmtState,
  type RequirementVersionInput,
} from "@/lib/regmgmt";
import { getRequirementByCanonicalId } from "@/lib/data/regulatory";
import { getDemoGovernmentPortfolio } from "@/lib/data/demo/governmentPortfolio";

const ACTOR_AR = "مستخدم حكومي (بيئة تجريبية)";
const now = () => new Date().toISOString();

type Cmd =
  | { type: "SET"; state: RegMgmtState }
  | { type: "RESET" };

function reducer(state: RegMgmtState, cmd: Cmd): RegMgmtState {
  switch (cmd.type) {
    case "SET":
      return cmd.state;
    case "RESET":
      return seedRegMgmtState();
    default:
      return state;
  }
}

export type MutationResult = { ok: true } | { ok: false; errorAr: string };

interface RegMgmtContextValue {
  state: RegMgmtState;
  createRequirement: (id: string, input: RequirementVersionInput) => MutationResult;
  issueVersion: (id: string, input: RequirementVersionInput) => MutationResult;
  updateDraft: (id: string, version: number, input: RequirementVersionInput) => MutationResult;
  activateVersion: (id: string, version: number) => MutationResult;
  deactivate: (id: string, effectiveUntil: string, reasonAr: string) => MutationResult;
  /** Runs deterministic impact + records applicability-scoped notifications. */
  runImpactAndNotify: (id: string, changeType: RegChangeType) => ImpactAnalysis | null;
  previewImpact: (id: string, changeType: RegChangeType) => ImpactAnalysis | null;
  resetManagement: () => void;
}

const Ctx = createContext<RegMgmtContextValue | null>(null);

export function RegMgmtProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seedRegMgmtState);

  useEffect(() => {
    try {
      const { state: restored, rejected } = deserializeRegMgmt(
        window.localStorage.getItem(REGMGMT_STORAGE_KEY),
        seedRegMgmtState(),
      );
      if (!rejected) dispatch({ type: "SET", state: restored });
    } catch {
      /* storage unavailable — continue with the seeded baseline */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(REGMGMT_STORAGE_KEY, serializeRegMgmt(state));
    } catch {
      /* storage unavailable — in-memory only */
    }
  }, [state]);

  const value = useMemo<RegMgmtContextValue>(() => {
    const commit = (
      run: (s: RegMgmtState) => { ok: true; state: RegMgmtState } | { ok: false; errorAr: string },
    ): MutationResult => {
      const res = run(state);
      if (!res.ok) return { ok: false, errorAr: res.errorAr };
      dispatch({ type: "SET", state: res.state });
      return { ok: true };
    };

    const impactFor = (id: string, changeType: RegChangeType): ImpactAnalysis | null => {
      const m = state.managed.find((x) => x.requirementId === id);
      if (!m) return null;
      const version =
        m.versions.find((v) => v.version === (m.activeVersion ?? m.draftVersion)) ??
        m.versions[m.versions.length - 1];
      if (!version) return null;
      return analyzeImpact(
        version,
        changeType,
        getDemoGovernmentPortfolio(),
        getRequirementByCanonicalId(id) ?? null,
      );
    };

    return {
      state,
      createRequirement: (id, input) => commit((s) => reduceCreateRequirement(s, id, input, ACTOR_AR, now())),
      issueVersion: (id, input) => commit((s) => reduceIssueVersion(s, id, input, ACTOR_AR, now())),
      updateDraft: (id, version, input) =>
        commit((s) => reduceUpdateDraft(s, id, version, input, ACTOR_AR, now())),
      activateVersion: (id, version) =>
        commit((s) => reduceActivateVersion(s, id, version, ACTOR_AR, now())),
      deactivate: (id, effectiveUntil, reasonAr) =>
        commit((s) => reduceDeactivate(s, id, ACTOR_AR, now(), effectiveUntil, reasonAr)),
      previewImpact: impactFor,
      runImpactAndNotify: (id, changeType) => {
        const ia = impactFor(id, changeType);
        if (!ia) return null;
        const m = state.managed.find((x) => x.requirementId === id)!;
        const version =
          m.versions.find((v) => v.version === (m.activeVersion ?? m.draftVersion)) ??
          m.versions[m.versions.length - 1];
        const notifs = buildRegChangeNotifications(version, changeType, ia, now());
        dispatch({ type: "SET", state: reduceRecordNotifications(state, notifs) });
        return ia;
      },
      resetManagement: () => dispatch({ type: "RESET" }),
    };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRegMgmt() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRegMgmt must be used within RegMgmtProvider");
  return ctx;
}
