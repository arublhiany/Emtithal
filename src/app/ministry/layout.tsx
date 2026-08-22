"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function MinistryLayout({ children }: { children: ReactNode }) {
  return <AppShell portal="ministry">{children}</AppShell>;
}
