"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RegMgmtProvider } from "@/components/regmgmt/RegMgmtProvider";

export default function CompanyLayout({ children }: { children: ReactNode }) {
  // RegMgmtProvider is mounted here read-only so the company can see
  // regulatory-change notifications issued by the government portal (its own
  // versioned store; it never writes to it from the company side).
  return (
    <RegMgmtProvider>
      <AppShell portal="company">{children}</AppShell>
    </RegMgmtProvider>
  );
}
