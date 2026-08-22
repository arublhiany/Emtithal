import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { DemoStoreProvider } from "@/lib/store/demoStore";

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "امتثال | Emtithal",
  description:
    "منصة امتثال — منصة ذكاء اصطناعي للامتثال الاستباقي وذكاء القرار لشركات خدمة الحج والجهات الرقابية.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${plexArabic.variable} h-full`}>
      <body className="min-h-full antialiased">
        <DemoStoreProvider>{children}</DemoStoreProvider>
      </body>
    </html>
  );
}
