"use client";

// =============================================================================
// Demo session store — client-side state for the hackathon MVP.
//
// There is no production auth/persistence backend for this MVP (per
// MASTER_SPEC §52, "Out of Scope"). This store persists interactive demo
// state (role selection, evidence uploads, action status changes, decision
// simulations run, support tickets, alert read-state) to the browser's
// localStorage so the demo feels real across navigation and refreshes,
// without pretending there is server-side storage. See lib/data/* for the
// underlying seed data this store starts from and layers on top of.
// =============================================================================

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type {
  ActionStatus,
  AlertItem,
  CompanyRole,
  DecisionSimulationResult,
  Evidence,
  ImprovementAction,
  SupportTicket,
  SupportTicketStatus,
} from "@/lib/types";
import { getEvidenceRecords } from "@/lib/data/evidence";
import { getSeedActions } from "@/lib/data/actions";
import { getSeedAlerts } from "@/lib/data/alerts";
import { getSeedTickets } from "@/lib/data/tickets";
import { DEMO_COMPANY_ID } from "@/lib/data/company";

export type SessionView = "company" | "ministry" | null;

interface DemoState {
  view: SessionView;
  companyRole: CompanyRole | null;
  evidence: Evidence[];
  actions: ImprovementAction[];
  alerts: AlertItem[];
  tickets: SupportTicket[];
  decisionHistory: DecisionSimulationResult[];
  selectedMinistryCompanyId: string;
}

const STORAGE_KEY = "emtithal-demo-state-v1";

function initialState(): DemoState {
  return {
    view: null,
    companyRole: null,
    evidence: getEvidenceRecords(),
    actions: getSeedActions(),
    alerts: getSeedAlerts(),
    tickets: getSeedTickets(),
    decisionHistory: [],
    selectedMinistryCompanyId: DEMO_COMPANY_ID,
  };
}

type Action =
  | { type: "SET_SESSION"; view: SessionView; companyRole?: CompanyRole | null }
  | { type: "LOGOUT" }
  | { type: "ADD_EVIDENCE"; evidence: Evidence }
  | { type: "REQUEST_EVIDENCE_REVIEW"; evidenceId: string }
  | { type: "SET_ACTION_STATUS"; actionId: string; status: ActionStatus }
  | { type: "MARK_ALERT_READ"; alertId: string }
  | { type: "ADD_TICKET"; ticket: SupportTicket }
  | { type: "SET_TICKET_STATUS"; ticketId: string; status: SupportTicketStatus }
  | { type: "ADD_DECISION_RESULT"; result: DecisionSimulationResult }
  | { type: "SELECT_MINISTRY_COMPANY"; companyId: string }
  | { type: "HYDRATE"; state: DemoState }
  | { type: "RESET_DEMO" };

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "SET_SESSION":
      return { ...state, view: action.view, companyRole: action.companyRole ?? state.companyRole };
    case "LOGOUT":
      return { ...state, view: null, companyRole: null };
    case "ADD_EVIDENCE":
      return { ...state, evidence: [action.evidence, ...state.evidence] };
    case "REQUEST_EVIDENCE_REVIEW":
      return {
        ...state,
        evidence: state.evidence.map((e) =>
          e.id === action.evidenceId ? { ...e, validationStatus: "needs_review" as const } : e
        ),
      };
    case "SET_ACTION_STATUS":
      return {
        ...state,
        actions: state.actions.map((a) =>
          a.id === action.actionId ? { ...a, status: action.status } : a
        ),
      };
    case "MARK_ALERT_READ":
      return {
        ...state,
        alerts: state.alerts.map((a) => (a.id === action.alertId ? { ...a, isRead: true } : a)),
      };
    case "ADD_TICKET":
      return { ...state, tickets: [action.ticket, ...state.tickets] };
    case "SET_TICKET_STATUS":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.ticketId ? { ...t, status: action.status } : t
        ),
      };
    case "ADD_DECISION_RESULT":
      return { ...state, decisionHistory: [action.result, ...state.decisionHistory] };
    case "SELECT_MINISTRY_COMPANY":
      return { ...state, selectedMinistryCompanyId: action.companyId };
    case "HYDRATE":
      return action.state;
    case "RESET_DEMO":
      return initialState();
    default:
      return state;
  }
}

interface DemoStoreContextValue {
  state: DemoState;
  setSession: (view: SessionView, companyRole?: CompanyRole | null) => void;
  logout: () => void;
  addEvidence: (evidence: Evidence) => void;
  requestEvidenceReview: (evidenceId: string) => void;
  setActionStatus: (actionId: string, status: ActionStatus) => void;
  markAlertRead: (alertId: string) => void;
  addTicket: (ticket: SupportTicket) => void;
  setTicketStatus: (ticketId: string, status: SupportTicketStatus) => void;
  addDecisionResult: (result: DecisionSimulationResult) => void;
  selectMinistryCompany: (companyId: string) => void;
  resetDemo: () => void;
}

const DemoStoreContext = createContext<DemoStoreContextValue | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  // Hydrate from localStorage once, on mount, client-side only.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState;
        dispatch({ type: "HYDRATE", state: parsed });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      // Corrupt or unavailable localStorage — continue with seed state.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      // Storage unavailable (private mode, quota) — demo continues in-memory.
    }
  }, [state]);

  const value = useMemo<DemoStoreContextValue>(
    () => ({
      state,
      setSession: (view, companyRole) => dispatch({ type: "SET_SESSION", view, companyRole }),
      logout: () => dispatch({ type: "LOGOUT" }),
      addEvidence: (evidence) => dispatch({ type: "ADD_EVIDENCE", evidence }),
      requestEvidenceReview: (evidenceId) =>
        dispatch({ type: "REQUEST_EVIDENCE_REVIEW", evidenceId }),
      setActionStatus: (actionId, status) =>
        dispatch({ type: "SET_ACTION_STATUS", actionId, status }),
      markAlertRead: (alertId) => dispatch({ type: "MARK_ALERT_READ", alertId }),
      addTicket: (ticket) => dispatch({ type: "ADD_TICKET", ticket }),
      setTicketStatus: (ticketId, status) =>
        dispatch({ type: "SET_TICKET_STATUS", ticketId, status }),
      addDecisionResult: (result) => dispatch({ type: "ADD_DECISION_RESULT", result }),
      selectMinistryCompany: (companyId) =>
        dispatch({ type: "SELECT_MINISTRY_COMPANY", companyId }),
      resetDemo: () => dispatch({ type: "RESET_DEMO" }),
    }),
    [state]
  );

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) throw new Error("useDemoStore must be used within DemoStoreProvider");
  return ctx;
}
