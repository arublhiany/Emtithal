"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RegMgmtProvider } from "@/components/regmgmt/RegMgmtProvider";

export default function MinistryLayout({ children }: { children: ReactNode }) {
  return (
    <RegMgmtProvider>
      <AppShell portal="ministry">{children}</AppShell>
    </RegMgmtProvider>
  );
}
