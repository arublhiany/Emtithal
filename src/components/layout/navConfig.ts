export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const COMPANY_NAV: NavItem[] = [
  { href: "/company/dashboard", label: "الرئيسية", icon: "🏠" },
  { href: "/company/compliance", label: "الامتثال", icon: "📋" },
  { href: "/company/evidence", label: "الأدلة", icon: "🗂️" },
  { href: "/company/gaps", label: "الفجوات والمخاطر", icon: "⚠️" },
  { href: "/company/improvement-plan", label: "خطة التحسين", icon: "🛠️" },
  { href: "/company/decision-simulation", label: "محاكاة القرار", icon: "🧭" },
  { href: "/company/alerts", label: "التنبيهات", icon: "🔔" },
];

export const MINISTRY_NAV: NavItem[] = [
  { href: "/ministry/control-center", label: "مركز التحكم", icon: "🏛️" },
  { href: "/ministry/companies", label: "الشركات", icon: "🏢" },
  { href: "/ministry/standards", label: "المتطلبات والمعايير", icon: "📖" },
  { href: "/ministry/risks", label: "المخاطر", icon: "⚠️" },
  { href: "/ministry/reviews", label: "المراجعات", icon: "🧾" },
  { href: "/ministry/alerts", label: "التنبيهات", icon: "🔔" },
];
