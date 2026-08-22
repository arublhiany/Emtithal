"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function CompanyLayout({ children }: { children: ReactNode }) {
  return <AppShell portal="company">{children}</AppShell>;
}
