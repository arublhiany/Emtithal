export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const COMPANY_NAV: NavItem[] = [
  { href: "/company/dashboard", label: "الرئيسية", icon: "home" },
  { href: "/company/compliance", label: "الامتثال", icon: "compliance" },
  { href: "/company/evidence", label: "الأدلة", icon: "evidence" },
  { href: "/company/gaps", label: "الفجوات والمخاطر", icon: "risks" },
  { href: "/company/improvement-plan", label: "خطة التحسين", icon: "plan" },
  { href: "/company/decision-simulation", label: "محاكاة القرار", icon: "decision" },
  { href: "/company/research", label: "دعم بحثي", icon: "research" },
  { href: "/company/alerts", label: "التنبيهات", icon: "alerts" },
];

export const MINISTRY_NAV: NavItem[] = [
  { href: "/ministry/control-center", label: "مركز التحكم", icon: "control" },
  { href: "/ministry/companies", label: "الشركات", icon: "companies" },
  { href: "/ministry/requirements", label: "المتطلبات التنظيمية", icon: "requirements" },
  { href: "/ministry/reports", label: "التقارير", icon: "reports" },
  { href: "/ministry/risks", label: "المخاطر", icon: "risks" },
  { href: "/ministry/reviews", label: "المراجعات", icon: "reviews" },
  { href: "/ministry/alerts", label: "التنبيهات", icon: "alerts" },
];
