// One consistent, simple line-icon set for the app shell. No emoji.
// 1.6 stroke, currentColor, 20px box.

type IconName =
  | "home"
  | "compliance"
  | "evidence"
  | "risks"
  | "plan"
  | "decision"
  | "alerts"
  | "control"
  | "companies"
  | "requirements"
  | "reports"
  | "reviews"
  | "bell"
  | "warning"
  | "document";

const P: Record<IconName, React.ReactNode> = {
  home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  compliance: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  evidence: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    </>
  ),
  risks: (
    <>
      <path d="M12 4 3 19h18z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  plan: (
    <>
      <path d="M4 6h16M4 12h16M4 18h10" />
      <circle cx="18" cy="18" r="2.4" />
    </>
  ),
  decision: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="m8 13 3 3 5-6" />
    </>
  ),
  alerts: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  control: (
    <>
      <rect x="3.5" y="4" width="17" height="6" rx="1.6" />
      <rect x="3.5" y="14" width="17" height="6" rx="1.6" />
      <path d="M7 7h.01M7 17h.01" />
    </>
  ),
  companies: (
    <>
      <rect x="4" y="4" width="9" height="16" rx="1.6" />
      <path d="M13 9h6a1.6 1.6 0 0 1 1.6 1.6V20H13M7 8h3M7 12h3M7 16h3" />
    </>
  ),
  requirements: (
    <>
      <path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M14 3.5V8h4M9 13h6M9 16.5h4" />
    </>
  ),
  reports: (
    <>
      <path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M14 3.5V8h4M9 17v-3M12 17v-5M15 17v-2" />
    </>
  ),
  reviews: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5M9 11l1.6 1.6L14 9" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 3 19h18z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  document: (
    <>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M14 3.5V8h4M9 12h6M9 15.5h4" />
    </>
  ),
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const d = P[(name as IconName) in P ? (name as IconName) : "compliance"];
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}
